export type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted"
  | "rejected"
  | "blocked"
  | "blocked_by"
  | "self";

export interface PublicProfile {
  id: string;
  fullName: string;
  username: string;
  auramindId: string;
  avatarUrl: string | null;
  bio: string | null;
  privacyDiscoverable: boolean;
  privacyShareGoals: boolean;
  privacyShareStats: boolean;
  privacyAllowRequests: string;
  createdAt: string;
}

export interface FriendSummary {
  id: string;
  fullName: string;
  username: string;
  auramindId: string;
  avatarUrl: string | null;
  bio: string | null;
  friendshipId: string;
  friendsSince: string;
  stats?: {
    totalFocusMin: number;
    totalXp: number;
    activeGoals: number;
  };
  sharedGoalsCount: number;
}

export interface FriendRequest {
  id: string; // friendship record id
  targetUserId: string; // the other user's id
  user: PublicProfile;
  createdAt: string;
  direction: "incoming" | "outgoing";
}

export interface FriendActivity {
  id: string;
  type: "request_received" | "request_accepted" | "goal_shared" | "milestone_completed" | "cheer";
  title: string;
  message: string | null;
  actor: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface SharedGoal {
  id: string;
  goalTitle: string;
  category: string;
  currentLevel: string;
  targetLevel: string;
  sharedCaption: string | null;
  status: string;
  startedAt: string | null;
  totalDays: number;
  currentDay: number;
  planSummary?: string;
  recentMilestones?: Array<{
    week: number;
    title: string;
    outcome: string;
  }>;
}

export interface FriendProfileDetails {
  profile: PublicProfile;
  friendshipStatus: FriendshipStatus;
  isMutualFriend: boolean;
  stats: {
    totalFocusMin: number;
    totalXp: number;
    activeGoals: number;
  } | null;
  sharedGoals: SharedGoal[];
}

export interface FriendsDashboardData {
  friends: FriendSummary[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  activities: FriendActivity[];
  stats: {
    totalFriends: number;
    pendingIncomingCount: number;
    pendingOutgoingCount: number;
    unreadActivitiesCount: number;
  };
}
