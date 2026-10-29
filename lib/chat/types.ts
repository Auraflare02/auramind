import { PublicProfile } from "../friends/types";

export interface WorldMessage {
  id: string;
  userId: string;
  message: string;
  reactions: Record<string, string[]>; // emoji -> array of user_ids
  createdAt: string;
  user: PublicProfile;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender?: PublicProfile;
  recipient?: PublicProfile;
}

export interface DirectConversationSummary {
  friend: PublicProfile;
  lastMessage: DirectMessage | null;
  unreadCount: number;
}
