export type TrainingStatus = "not_started" | "in_progress" | "completed";
export type PromptCategory = "sales" | "marketing" | "support" | "engineering" | "hr" | "productivity" | "data_analysis" | "creative";
export type TeamRole = "sales" | "marketing" | "engineering" | "support" | "hr" | "executive";
export type UsageChannel = "chatgpt" | "claude" | "api" | "copilot";

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: TeamRole;
  roleBenchmark: number;
  department: string;
  avatarInitials: string;
  promptsUsed: number;
  adoptionScore: number;
  trainingCompleted: number;
  totalModules: number;
  joinedAt: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: PromptCategory;
  promptText: string;
  usageCount: number;
  averageRating: number;
  createdBy: string;
  createdAt: string;
  tags: string[];
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: PromptCategory;
  durationMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  completionRate: number;
  enrolledCount: number;
  completedCount: number;
  lessons: number;
  practiceScenario: string;
  capabilityOutcome: string;
}

export type CapabilityCheckStatus = "pending" | "passed" | "needs_review";

export interface CapabilityCheck {
  id: string;
  memberId: string;
  moduleId: string;
  status: CapabilityCheckStatus;
  scenario: string;
  attemptedAt: string | null;
  assessorNotes: string | null;
  independentApplication: boolean;
}

export interface UsageLog {
  id: string;
  memberId: string;
  promptTemplateId: string | null;
  channel: UsageChannel;
  timestamp: string;
  promptSummary: string;
  tokensUsed: number;
  feedback: "positive" | "neutral" | "negative";
}

export interface AdoptionMetrics {
  totalTeamMembers: number;
  activeUsers: number;
  totalPromptsUsed: number;
  averageAdoptionScore: number;
  overallTrainingCompletion: number;
  promptsThisWeek: number;
  promptsThisMonth: number;
  previousWeekPrompts: number;
  previousMonthPrompts: number;
  trendingUp: boolean;
  topCategory: PromptCategory;
  totalPromptTemplates: number;
  averageRating: number;
  totalCapabilityChecksPassed: number;
  totalCapabilityChecks: number;
}
