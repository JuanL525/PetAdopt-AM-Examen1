let activeRoomId: string | null = null;

export function setActiveRoomId(roomId: string | null) {
  activeRoomId = roomId;
}

export function getActiveRoomId() {
  return activeRoomId;
}
