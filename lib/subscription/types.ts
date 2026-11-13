export type SubscriptionTier = "gold" | "platinum" | "diamond" | "beta" | "platinum_beta";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "expired";
export type BillingCycle = "monthly" | "annual";

export interface PlatinumBetaRecord {
  userId: string;
  paymentStatus: "approved" | "pending" | "rejected";
  betaActivationDate: string;
  betaExpiryDate: string;
  planType: "platinum_beta";
  maxActiveGoals: number; // 3
  maxFriends: number; // 15
  totalCallCredits: number; // 20
  aiCallAllowance?: number; // compatibility alias for totalCallCredits
  callsConsumed: number;
  aiCallsConsumed?: number; // compatibility alias for callsConsumed
  totalCallDurationSeconds: number; // Tracked duration
  maxCallDurationSeconds: number; // 90
  whatsAppUsage: number; // Messages sent
  paymentReference?: string;
  whatsAppEligibility: boolean;
  calendarEligibility: boolean;
  isExpired: boolean;
  daysRemaining: number;
}

export interface UserCommunicationPreferences {
  userId: string;
  whatsappOptIn: boolean;
  callingOptIn: boolean;
  preferredCallingStart: string;
  preferredCallingEnd: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  preferredLanguage: "hi" | "en";
}

export interface PlanConfig {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  badge: string;
  popular?: boolean;
  accentColor: string;
  monthlyPriceIntro: number;
  monthlyPriceRegular: number;
  annualPriceMonthly: number;
  maxGoals: number;
  maxFriends: number;
  aiCallsPerMonth: number;
  aiCallsMax: number;
  whatsAppCheckins: boolean;
  googleCalendar: "none" | "basic" | "full";
  preferredCallingTime: boolean;
  hindiCallingAgent: boolean;
  advancedAI: boolean;
  advancedReports: boolean;
  distractionAnalysis: "basic" | "advanced" | "detailed_patterns";
  reports: ("daily" | "weekly" | "monthly" | "comparative")[];
  hourlyAppNotifications: boolean;
  focusTimer: boolean;
  xpAndLevels: boolean;
  coreLevelPhilosophy: string;
  sections: {
    title: string;
    items: string[];
  }[];
  keyHighlights: string[];
}

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startedAt: string;
  renewsAt: string;
  plan: PlanConfig;
  platinumBeta?: PlatinumBetaRecord;
  usage: {
    activeGoals: number;
    maxGoals: number;
    friendsCount: number;
    maxFriends: number;
    aiCallsUsedThisMonth: number;
    aiCallsAllowance: number;
    whatsAppEnabled: boolean;
    calendarConnected: boolean;
  };
}
