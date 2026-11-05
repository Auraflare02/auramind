export type SubscriptionTier = "gold" | "platinum" | "diamond";
export type BillingCycle = "monthly" | "annual";

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
  status: "active" | "trialing" | "past_due" | "canceled";
  billingCycle: BillingCycle;
  startedAt: string;
  renewsAt: string;
  plan: PlanConfig;
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
