export interface Room {
  id: string;
  name: string;
  createdBy: string;       // user id del seller que la creó
  createdAt: string;
  memberCount?: number;    // opcional, para mostrar en el dashboard
}

export interface CreateRoomDTO {
  name: string;
}
