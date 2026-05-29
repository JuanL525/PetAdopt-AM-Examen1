import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getUserInitials } from "@features/auth/domain/entities/User";
import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { Pet, PetStatus, formatPetAge } from "@features/pets/domain/entities/Pet";
import { usePets } from "@features/pets/presentation/hooks/usePets";
import { AdoptionStatus } from "@features/adoptions/domain/entities/AdoptionRequest";
import { useAdoptions } from "@features/adoptions/presentation/hooks/useAdoptions";
import {
  fontSize,
  fontWeight,
  PetBadge,
  PetDrawer,
  radius,
  shadow,
  space,
  useColors,
  useThemeStore,
} from "@shared/design";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AnimatePresence, MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LottieAnimation } from "../../../components/animations/LottieAnimation";

const loadingAnimation = require("../../../assets/animations/loading-cat.json");
const emptyAnimation   = require("../../../assets/animations/empty-dog.json");

const SIZES: Record<string, string> = {
  small: "Pequeño",
  medium: "Mediano",
  large: "Grande",
};

const STATUS: Record<
  PetStatus,
  { label: string; variant: "success" | "warning" | "neutral" }
> = {
  available: { label: "Disponible", variant: "success" },
  pending:   { label: "En proceso", variant: "warning" },
  adopted:   { label: "Adoptado",   variant: "neutral" },
};

// Badge según el estado de MI solicitud (perspectiva del adoptante)
const MY_REQUEST_BADGE: Record<
  AdoptionStatus,
  { label: string; variant: "success" | "warning" | "error" }
> = {
  pending:  { label: "Solicitada",  variant: "warning" },
  approved: { label: "¡Adoptado!",  variant: "success" },
  rejected: { label: "Rechazada",   variant: "error" },
};

function PetCard({
  pet,
  index,
  myRequestStatus,
}: {
  pet: Pet;
  index: number;
  myRequestStatus?: AdoptionStatus;
}) {
  const router = useRouter();
  const s = myRequestStatus ? MY_REQUEST_BADGE[myRequestStatus] : STATUS[pet.status];
  const c = useColors();
  const isDark = useThemeStore((st) => st.isDark);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 200, delay: index * 60 }}
      style={{ flex: 1, padding: space[2] }}
    >
      <Pressable onPress={() => router.push(`/(app)/pets/${pet.id}` as any)}>
        {({ pressed }) => (
          <MotiView
            animate={{ scale: pressed ? 0.97 : 1 }}
            transition={{ type: "timing", duration: 100 }}
            style={{
              backgroundColor: c.bgSurface,
              borderRadius: radius.xl,
              overflow: "hidden",
              borderWidth: 1.5,
              borderColor: pressed ? c.primary + "55" : c.border,
              ...shadow.md,
            }}
          >
            {/* Photo zone */}
            <View style={{ width: "100%", height: 158, position: "relative" }}>
              {pet.photoUrl ? (
                <Image
                  source={{ uri: pet.photoUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? c.primaryLight : "#FFF1EF",
                  }}
                >
                  <Text style={{ fontSize: 44 }}>🐾</Text>
                  <Text
                    style={{
                      fontSize: fontSize.base,
                      fontWeight: fontWeight.bold,
                      color: c.primary,
                      marginTop: space[2],
                    }}
                    numberOfLines={1}
                  >
                    {pet.name}
                  </Text>
                  {pet.breed ? (
                    <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }} numberOfLines={1}>
                      {pet.breed}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* Bottom gradient overlay — only when there's a photo */}
              {pet.photoUrl && (
                <>
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0, left: 0, right: 0,
                      height: 72,
                      backgroundColor: "rgba(0,0,0,0.52)",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: space[2], left: space[2], right: space[8],
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: fontWeight.bold,
                        fontSize: fontSize.base,
                        textShadowColor: "rgba(0,0,0,0.4)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      }}
                      numberOfLines={1}
                    >
                      {pet.name}
                    </Text>
                    {pet.breed ? (
                      <Text
                        style={{ color: "rgba(255,255,255,0.78)", fontSize: 10, marginTop: 1 }}
                        numberOfLines={1}
                      >
                        {pet.breed}
                      </Text>
                    ) : null}
                  </View>
                </>
              )}

              {/* Status badge — top left */}
              <View style={{ position: "absolute", top: space[2], left: space[2] }}>
                <PetBadge label={s.label} variant={s.variant} size="sm" />
              </View>
            </View>

            {/* Info strip */}
            <View
              style={{
                paddingHorizontal: space[3],
                paddingVertical: space[2],
                flexDirection: "row",
                alignItems: "center",
                gap: space[2],
                flexWrap: "wrap",
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              {/* Age — coral */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  backgroundColor: isDark ? c.primaryLight : "#FFE8E4",
                  borderRadius: radius.sm,
                  paddingHorizontal: space[2],
                  paddingVertical: 3,
                }}
              >
                <MaterialCommunityIcons name="calendar-outline" size={10} color={c.primary} />
                <Text style={{ fontSize: 10, color: c.primary, fontWeight: fontWeight.semibold }}>
                  {formatPetAge(pet.age)}
                </Text>
              </View>

              {/* Size — teal */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  backgroundColor: isDark ? c.secondaryLight : "#D0F2EC",
                  borderRadius: radius.sm,
                  paddingHorizontal: space[2],
                  paddingVertical: 3,
                }}
              >
                <MaterialCommunityIcons name="resize" size={10} color={c.secondary} />
                <Text style={{ fontSize: 10, color: c.secondary, fontWeight: fontWeight.semibold }}>
                  {SIZES[pet.size]}
                </Text>
              </View>

              {/* Shelter */}
              {pet.shelterName && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    flex: 1,
                    minWidth: "100%",
                  }}
                >
                  <MaterialCommunityIcons name="home-heart" size={10} color={c.textMuted} />
                  <Text
                    style={{ fontSize: 10, color: c.textMuted, flex: 1 }}
                    numberOfLines={1}
                  >
                    {pet.shelterName}
                  </Text>
                </View>
              )}
            </View>
          </MotiView>
        )}
      </Pressable>
    </MotiView>
  );
}

export default function AdoptanteHome() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  const drawerMenuItems = [
    { icon: "heart-multiple",   label: "Mis Solicitudes",  route: "/(app)/adoptions", color: c.primary },
    { icon: "map-marker-radius",label: "Refugios Cercanos", route: "/(app)/map",       color: c.secondary },
    { icon: "robot",            label: "Asistente IA",      route: "/(app)/ai-chat",   color: "#8B5CF6" },
  ];

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "pending" | "adopted">("available");
  const { pets, isLoading: loading, loadPets: refresh } = usePets();
  const { requests, loadRequests } = useAdoptions();

  React.useEffect(() => {
    refresh();
    loadRequests();
  }, []);

  const handleRefresh = React.useCallback(() => {
    refresh();
    loadRequests();
  }, [refresh, loadRequests]);

  // Mapa petId -> estado de MI solicitud más reciente.
  // requests viene ordenado por fecha desc, así que la primera ocurrencia gana.
  const myRequestByPet = React.useMemo(() => {
    const map: Record<string, AdoptionStatus> = {};
    for (const r of requests) {
      if (!(r.petId in map)) map[r.petId] = r.status;
    }
    return map;
  }, [requests]);

  // Una mascota está "disponible para mí" si su estado es available
  // y yo no la he adoptado ya (solicitud aprobada).
  const isAvailableForMe = (p: Pet) =>
    p.status === "available" && myRequestByPet[p.id] !== "approved";

  const filtered = pets.filter((p) => {
    const myStatus = myRequestByPet[p.id];
    let matchFilter = true;
    if (filter === "available") matchFilter = isAvailableForMe(p);
    else if (filter === "pending") matchFilter = myStatus === "pending";
    else if (filter === "adopted") matchFilter = myStatus === "approved";
    // "all" → todas

    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.breed.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // Stats desde la perspectiva del adoptante
  const availableCount = pets.filter(isAvailableForMe).length;
  const myPendingCount = requests.filter((r) => r.status === "pending").length;
  const myAdoptedCount = requests.filter((r) => r.status === "approved").length;

  const STATS = [
    { label: "Disponibles", value: availableCount, color: "#10B981", bg: "#D1FAE5", darkBg: "#052E1C" },
    { label: "En proceso",  value: myPendingCount, color: "#F59E0B", bg: "#FEF3C7", darkBg: "#1C1206" },
    { label: "Adoptados",   value: myAdoptedCount, color: c.primary, bg: isDark ? c.primaryLight : "#FFE8E4", darkBg: c.primaryLight },
  ];

  const FILTER_CHIPS = [
    { key: "all" as const,       label: "Todos",       icon: "paw",          color: c.primary,  bg: isDark ? c.primaryLight : "#FFE8E4" },
    { key: "available" as const, label: "Disponibles", icon: "check-circle-outline", color: "#10B981", bg: isDark ? "#052E1C" : "#D1FAE5" },
    { key: "pending" as const,   label: "En proceso",  icon: "clock-outline",color: "#F59E0B",  bg: isDark ? "#1C1206" : "#FEF3C7" },
    { key: "adopted" as const,   label: "Adoptados",   icon: "heart",        color: "#9CA3AF",  bg: isDark ? "#1A1A16" : "#F3F4F6" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style="light" />

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: c.primary,
          paddingTop: insets.top,
          paddingHorizontal: space[5],
          paddingBottom: space[5],
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: "absolute", right: -36, top: -36,
            width: 170, height: 170, borderRadius: 85,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />
        <View
          style={{
            position: "absolute", right: 80, bottom: -28,
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: "rgba(255,255,255,0.07)",
          }}
        />
        <View
          style={{
            position: "absolute", left: -20, bottom: 10,
            width: 70, height: 70, borderRadius: 35,
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />

        {/* Greeting row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingTop: space[4],
          }}
        >
          <View>
            <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: fontSize.sm }}>
              Bienvenido/a de vuelta
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: fontSize.xl,
                fontWeight: fontWeight.bold,
                marginTop: 2,
              }}
            >
              {user?.username}
            </Text>
            <View
              style={{
                marginTop: space[2],
                backgroundColor: "rgba(255,255,255,0.22)",
                borderRadius: radius.full,
                paddingHorizontal: space[2],
                paddingVertical: 3,
                alignSelf: "flex-start",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              <Text style={{ color: "#fff", fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                🐾 Adoptante
              </Text>
            </View>
          </View>

          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
            <View
              style={{
                width: 42, height: 42, borderRadius: radius.full,
                backgroundColor: "rgba(255,255,255,0.22)",
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              <MaterialCommunityIcons name="menu" size={22} color="#fff" />
            </View>
          </Pressable>
        </View>

        {/* Stats strip */}
        <View style={{ flexDirection: "row", gap: space[2], marginTop: space[4] }}>
          {STATS.map((st) => (
            <View
              key={st.label}
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: radius.lg,
                paddingVertical: space[3],
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <Text style={{ color: "#fff", fontSize: fontSize.lg, fontWeight: fontWeight.bold }}>
                {st.value}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, marginTop: 1 }}>
                {st.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: space[5],
          paddingTop: space[4],
          paddingBottom: space[2],
        }}
      >
        <MotiView
          animate={{ borderColor: search.length > 0 ? c.primary : c.border }}
          transition={{ type: "timing", duration: 150 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.bgSurface,
            borderRadius: radius.xl,
            paddingHorizontal: space[4],
            height: 48,
            gap: space[2],
            borderWidth: 1.5,
            ...shadow.sm,
          }}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={search.length > 0 ? c.primary : c.textMuted}
          />
          <TextInput
            style={{ flex: 1, fontSize: fontSize.base, color: c.textPrimary }}
            placeholder="Buscar por nombre o raza..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          <AnimatePresence>
            {search.length > 0 && (
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "timing", duration: 150 }}
              >
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={c.textMuted} />
                </Pressable>
              </MotiView>
            )}
          </AnimatePresence>
        </MotiView>
      </View>

      {/* ── Colorful filter chips ─────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space[5],
          paddingVertical: space[2],
          gap: space[2],
        }}
        style={{ flexGrow: 0 }}
      >
        {FILTER_CHIPS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable key={f.key} onPress={() => setFilter(f.key)}>
              <MotiView
                animate={{
                  backgroundColor: active ? f.color : c.bgSurface,
                  borderColor: active ? f.color : c.border,
                }}
                transition={{ type: "timing", duration: 180 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: space[3],
                  paddingVertical: space[2],
                  borderRadius: radius.full,
                  borderWidth: 1.5,
                }}
              >
                <MaterialCommunityIcons
                  name={f.icon as any}
                  size={13}
                  color={active ? "#fff" : f.color}
                />
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: active ? "#fff" : f.color,
                  }}
                >
                  {f.label}
                </Text>
              </MotiView>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Grid ─────────────────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={{
          padding: filtered.length > 0 ? space[3] : 0,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={c.primary} colors={[c.primary]} />
        }
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              width: "100%",
              minHeight: 420,
              justifyContent: "center",
              alignItems: "center",
              gap: space[3],
              paddingHorizontal: space[8],
              paddingTop: space[6],
            }}
          >
            {loading && pets.length === 0 ? (
              <LottieAnimation source={loadingAnimation} size={220} loop />
            ) : (
              <>
                <LottieAnimation
                  source={emptyAnimation}
                  size={filter === "all" || filter === "available" ? 260 : 240}
                  loop
                />
                <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.textPrimary }}>
                  {filter === "pending"
                    ? "Sin solicitudes en proceso"
                    : filter === "adopted"
                    ? "Aún no has adoptado"
                    : "Sin resultados"}
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: c.textMuted, textAlign: "center" }}>
                  {search
                    ? "Prueba otra búsqueda"
                    : filter === "pending"
                    ? "Cuando solicites adoptar una mascota, aparecerá aquí mientras el refugio la revisa."
                    : filter === "adopted"
                    ? "Las mascotas que el refugio te apruebe aparecerán aquí."
                    : "Aún no hay mascotas disponibles. Desliza hacia abajo para actualizar."}
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <PetCard pet={item} index={index} myRequestStatus={myRequestByPet[item.id]} />
        )}
      />

      {/* ── FABs ─────────────────────────────────────────────────────── */}
      <MotiView
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 200, delay: 600 }}
        style={{ position: "absolute", bottom: 100, left: space[5] }}
      >
        <Pressable onPress={() => router.push("/(app)/map" as any)}>
          <View
            style={{
              width: 52, height: 52, borderRadius: radius.full,
              backgroundColor: isDark ? c.secondaryLight : "#D0F2EC",
              alignItems: "center", justifyContent: "center",
              borderWidth: 2, borderColor: c.secondary + "55",
              ...shadow.md,
            }}
          >
            <MaterialCommunityIcons name="map-marker-radius" size={24} color={c.secondary} />
          </View>
        </Pressable>
      </MotiView>

      <MotiView
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 200, delay: 700 }}
        style={{ position: "absolute", bottom: insets.bottom + space[6], right: space[5] }}
      >
        <Pressable onPress={() => router.push("/(app)/ai-chat" as any)}>
          <View
            style={{
              width: 60, height: 60, borderRadius: radius.full,
              backgroundColor: isDark ? "#1A1230" : "#EDE9FE",
              alignItems: "center", justifyContent: "center",
              borderWidth: 2, borderColor: "#8B5CF6" + "44",
              ...shadow.lg,
            }}
          >
            <MaterialCommunityIcons name="robot" size={28} color="#8B5CF6" />
          </View>
        </Pressable>
      </MotiView>

      {/* ── Drawer ───────────────────────────────────────────────────── */}
      <PetDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        username={user?.username}
        email={user?.email}
        initials={user ? getUserInitials(user) : "?"}
        roleLabel="🐾 Adoptante"
        roleColor={c.primary}
        menuItems={drawerMenuItems}
        onNavigate={(route) => router.push(route as any)}
        onLogout={logout}
      />
    </View>
  );
}
