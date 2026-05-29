// app/_layout.tsx
import { AppwriteAuthRepository } from "@features/auth/infrastructure/repositories/AppwriteAuthRepository";
import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { supabase } from "@shared/infrastructure/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { useEffect, useRef } from "react";
import { authRepository } from "../src/di/container";
import { getActiveRoomId } from "../src/services/activeChatRoom";
import {
  getExpoNotifications,
  registerForNotificationsAsync,
  sendMessageNotification,
  sendAdoptionNotification,
} from "../src/services/notificationService";

// Polyfill de localStorage para prevenir error interno en react-native-appwrite Realtime
const globalObj =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof global !== "undefined"
      ? global
      : ({} as any);
if (!globalObj.localStorage) {
  globalObj.localStorage = {
    _data: {} as Record<string, string>,
    getItem(key: string) {
      return this._data[key] || null;
    },
    setItem(key: string, value: string) {
      this._data[key] = value;
    },
    removeItem(key: string) {
      delete this._data[key];
    },
    clear() {
      this._data = {};
    },
  };
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const segments = useSegments() as any;
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (authRepository instanceof AppwriteAuthRepository) {
      setLoading(true);
      authRepository
        .getCurrentUser()
        .then(setUser)
        .finally(() => setLoading(false));
    } else {
      // Para Supabase, el listener onAuthStateChange maneja todo el estado reactivamente
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(
          `[_layout] onAuthStateChange event: ${event}, session: ${!!session}`
        );

        // Callback síncrono para no bloquear el Deep Link
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          if (session) {
            setLoading(true);
            syncUserProfile(session).finally(() => setLoading(false));
          } else if (event === "INITIAL_SESSION") {
            // En móvil SecureStore puede tardar — recuperar sesión antes de cerrar
            setLoading(true);
            supabase.auth.getSession().then(({ data: { session: recovered } }) => {
              if (recovered) {
                syncUserProfile(recovered).finally(() => setLoading(false));
              } else if (!useAuthStore.getState().user) {
                setUser(null);
                setLoading(false);
              } else {
                console.warn("[_layout] INITIAL_SESSION null — keeping cached user");
                setLoading(false);
              }
            });
          } else {
            setUser(null);
            setLoading(false);
          }
        } else if (event === "TOKEN_REFRESHED") {
          if (session && !useAuthStore.getState().user) {
            setLoading(true);
            syncUserProfile(session).finally(() => setLoading(false));
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
        }
      });

      // Tarea pesada aislada con try/catch y fallback
      const syncUserProfile = async (session: any) => {
        try {
          // 1. Asegurar que el perfil existe en la base de datos (best-effort)
          try {
            const metadata = session.user.user_metadata || {};
            const username =
              metadata.full_name ||
              metadata.name ||
              session.user.email?.split("@")[0] ||
              "Usuario";

            console.log(
              `[_layout] Reactively upserting/checking profile for: ${session.user.id}`
            );
            await supabase.from("profiles").upsert(
              {
                id: session.user.id,
                username,
                role: "adoptante",
              },
              { onConflict: "id", ignoreDuplicates: true }
            );
            console.log("[_layout] Profile upsert finished successfully.");
          } catch (profileErr: any) {
            console.warn(
              "[_layout] Profile upsert warning (non-blocking):",
              profileErr.message || profileErr
            );
          }

          // 2. Obtener perfil completo
          const user = await authRepository.getCurrentUser();
          console.log(
            `[_layout] User sync successful: ${user?.username} (${user?.role})`
          );
          if (user) {
            setUser(user);
          } else {
            // getCurrentUser falló pero tenemos sesión válida — usar fallback
            const metadata = session?.user?.user_metadata || {};
            const email = session?.user?.email || "";
            const username =
              metadata.full_name ||
              metadata.name ||
              email.split("@")[0] ||
              "Usuario";
            setUser({
              id: session.user.id,
              username,
              role: "adoptante",
              avatarUrl: metadata.avatarUrl || null,
              createdAt: session.user.created_at || new Date().toISOString(),
              email,
            } as any);
          }
        } catch (err: any) {
          // 3. ¡EL SALVAVIDAS! Si la BD falla o hace timeout, entramos nosotros
          console.error(
            "[_layout] Error syncing user session, using fallback:",
            err.message || err
          );
          const metadata = session?.user?.user_metadata || {};
          const email = session?.user?.email || "";
          const username =
            metadata.full_name ||
            metadata.name ||
            email.split("@")[0] ||
            "Usuario";
            
          const fallbackUser = {
            id: session?.user?.id || "",
            username,
            role: "adoptante",
            avatarUrl: metadata.avatarUrl || null,
            createdAt: session?.user?.created_at || new Date().toISOString(),
            email,
          };
          
          setUser(fallbackUser as any);
        }
      };

      return () => subscription.unsubscribe();
    }
  }, []);

  // Listener de Deep Linking para intercambiar el código de Google OAuth
  useEffect(() => {
    let subscription: any;

    const handleUrl = async (url: string) => {
      console.log(`[_layout] Deep link received for OAuth: ${url}`);
      if (url.includes("code=")) {
        const parsedUrl = Linking.parse(url);
        let code = parsedUrl.queryParams?.code as string | undefined;

        if (!code) {
          const match = url.match(/[?&]code=([^&]+)/);
          if (match) code = match[1];
        }

        if (code) {
          console.log(
            `[_layout] OAuth code found in URL: ${code}. Exchanging for session...`
          );
          try {
            const { data, error } =
              await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
            console.log(
              `[_layout] OAuth code exchange successful! User ID: ${data.user?.id}`
            );
          } catch (err: any) {
            console.error(
              "[_layout] Error exchanging OAuth code:",
              err.message || err
            );
          }
        }
      }
    };

    // Escuchar eventos de URL (cuando la app está en segundo plano o es reanudada)
    subscription = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    // Verificar si la app fue lanzada por una URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    const navReady = !!rootNavigationState?.key;
    const inAuth = segments[0] === "(auth)";

    console.log(
      `[AuthGuard] Check: user=${user ? user.username : "null"}, isLoading=${isLoading}, segments=${JSON.stringify(segments)}, navReady=${navReady}, inAuth=${inAuth}`
    );

    if (!navReady || isLoading) return;

    const id = setTimeout(() => {
      if (user && inAuth) {
        console.log(
          "[AuthGuard] Authenticated user on auth screen. Redirecting to Dashboard /(app)..."
        );
        router.replace("/(app)");
      } else if (!user && !inAuth) {
        console.log(
          "[AuthGuard] Unauthenticated user on private screen. Redirecting to Login /(auth)/login..."
        );
        router.replace("/(auth)/login");
      }
    }, 0);

    return () => clearTimeout(id);
  }, [user, isLoading, segments, rootNavigationState?.key]);

  const notificationSubRef = useRef<{ remove(): void } | null>(null);

  useEffect(() => {
    registerForNotificationsAsync();
    getExpoNotifications().then((Notifications) => {
      if (!Notifications) return;
      notificationSubRef.current =
        Notifications.addNotificationResponseReceivedListener(
          (response: any) => {
            if (!rootNavigationState?.key) return;
            const data = response.notification.request.content.data;
            if (data?.roomId) {
              router.push(`/chat/${data.roomId}`);
            } else if (data?.requestId) {
              router.push(`/adoptions/${data.requestId}` as any);
            }
          }
        );
    });
    return () => {
      notificationSubRef.current?.remove();
    };
  }, [rootNavigationState?.key]);

  // Notificaciones locales vía Supabase Realtime (app en primer plano)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("global-chat-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          if (!payload.new || payload.new.user_id === user.id) return;
          if (getActiveRoomId() === payload.new.room_id) return;

          try {
            const { data: senderData } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", payload.new.user_id)
              .single();

            const senderName = senderData?.username ?? "Otro Usuario";
            await sendMessageNotification(
              senderName,
              payload.new.room_id,
              payload.new.content
            );
          } catch (err) {
            console.warn("Error fetching sender profile for notification:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`adoption-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "adoption_requests",
          filter: `shelter_id=eq.${user.id}`,
        },
        async (payload) => {
          if (user.role !== "refugio") return;
          try {
            const { data: adopterData } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", payload.new.adopter_id)
              .single();
            const { data: petData } = await supabase
              .from("pets")
              .select("name")
              .eq("id", payload.new.pet_id)
              .single();
            await sendAdoptionNotification(
              "Nueva solicitud de adopción",
              `${adopterData?.username ?? "Un adoptante"} quiere adoptar a ${petData?.name ?? "tu mascota"}`,
              payload.new.id
            );
          } catch (err) {
            console.warn("Error sending adoption notification:", err);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "adoption_requests",
          filter: `adopter_id=eq.${user.id}`,
        },
        async (payload) => {
          if (user.role !== "adoptante") return;
          if (
            payload.new.status !== "approved" &&
            payload.new.status !== "rejected"
          ) {
            return;
          }
          const statusMsg =
            payload.new.status === "approved"
              ? "¡Aprobada! 🎉 El refugio aceptó tu solicitud"
              : "Rechazada. El refugio no pudo aprobar tu solicitud";
          try {
            const { data: petData } = await supabase
              .from("pets")
              .select("name")
              .eq("id", payload.new.pet_id)
              .single();
            await sendAdoptionNotification(
              `Solicitud ${payload.new.status === "approved" ? "aprobada" : "rechazada"}`,
              `${petData?.name ?? "Mascota"}: ${statusMsg}`,
              payload.new.id
            );
          } catch (err) {
            console.warn("Error sending status notification:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}