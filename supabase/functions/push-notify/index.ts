// Supabase Edge Function — envía push remotas vía Expo Push API
// Se dispara con Database Webhooks en messages y adoption_requests

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
};

async function sendExpoPush(
  tokens: string[],
  message: { title: string; body: string; data?: Record<string, string> },
) {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (unique.length === 0) return;

  const messages = unique.map((to) => ({
    to,
    sound: 'default',
    title: message.title,
    body: message.body,
    data: message.data ?? {},
    channelId: 'default',
    priority: 'high',
  }));

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Expo push failed:', res.status, text);
  }
}

async function tokensForUsers(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const { data } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .in('id', userIds)
    .not('expo_push_token', 'is', null);

  return (data ?? [])
    .map((r: { expo_push_token: string | null }) => r.expo_push_token)
    .filter((t): t is string => !!t);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const payload = (await req.json()) as WebhookPayload;
    const { type, table, record, old_record } = payload;

    // ── Chat: nuevo mensaje ──
    if (table === 'messages' && type === 'INSERT') {
      const roomId = record.room_id as string;
      const senderId = record.user_id as string;
      const content = (record.content as string) ?? '';

      const { data: members } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)
        .neq('user_id', senderId);

      const recipientIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
      const tokens = await tokensForUsers(supabase, recipientIds);

      const { data: sender } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', senderId)
        .single();

      await sendExpoPush(tokens, {
        title: `💬 ${sender?.username ?? 'Nuevo mensaje'}`,
        body: content.length > 120 ? content.slice(0, 120) + '...' : content,
        data: { roomId },
      });
    }

    // ── Adopción: nueva solicitud → refugio ──
    if (table === 'adoption_requests' && type === 'INSERT') {
      const shelterId = record.shelter_id as string;
      const adopterId = record.adopter_id as string;
      const petId = record.pet_id as string;
      const requestId = record.id as string;

      const tokens = await tokensForUsers(supabase, [shelterId]);

      const [{ data: adopter }, { data: pet }] = await Promise.all([
        supabase.from('profiles').select('username').eq('id', adopterId).single(),
        supabase.from('pets').select('name').eq('id', petId).single(),
      ]);

      await sendExpoPush(tokens, {
        title: 'Nueva solicitud de adopción',
        body: `${adopter?.username ?? 'Un adoptante'} quiere adoptar a ${pet?.name ?? 'tu mascota'}`,
        data: { requestId },
      });
    }

    // ── Adopción: cambio de estado → adoptante ──
    if (table === 'adoption_requests' && type === 'UPDATE') {
      const newStatus = record.status as string;
      const oldStatus = old_record?.status as string | undefined;
      if (newStatus === oldStatus) {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (newStatus !== 'approved' && newStatus !== 'rejected') {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const adopterId = record.adopter_id as string;
      const petId = record.pet_id as string;
      const requestId = record.id as string;

      const tokens = await tokensForUsers(supabase, [adopterId]);
      const { data: pet } = await supabase.from('pets').select('name').eq('id', petId).single();

      const approved = newStatus === 'approved';
      await sendExpoPush(tokens, {
        title: approved ? '¡Solicitud aprobada! 🎉' : 'Solicitud rechazada',
        body: approved
          ? `${pet?.name ?? 'Mascota'}: el refugio aceptó tu solicitud`
          : `${pet?.name ?? 'Mascota'}: el refugio no pudo aprobar tu solicitud`,
        data: { requestId },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('push-notify error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
