export interface LevelOption {
  id: string;
  label: string;
  description: string;
}

export interface GoalCategoryConfig {
  id: string;
  name: string;
  description: string;
  defaultFocusHours: number;
  levels: LevelOption[];
  hasLanguageField?: boolean;
  hasScoreFields?: boolean;
}

export const GOAL_CATEGORIES: GoalCategoryConfig[] = [
  {
    id: "language_learning",
    name: "Language Learning",
    description: "Master a new language using the CEFR international proficiency framework.",
    defaultFocusHours: 2,
    hasLanguageField: true,
    levels: [
      { id: "pre_a1", label: "Pre-A1 (Absolute Beginner)", description: "No prior knowledge or only a few isolated words." },
      { id: "a1", label: "A1 (Breakthrough / Beginner)", description: "Can understand simple everyday expressions and basic phrases." },
      { id: "a2", label: "A2 (Waystage / Elementary)", description: "Can communicate in simple, routine tasks and describe background." },
      { id: "b1", label: "B1 (Threshold / Intermediate)", description: "Can handle most travel situations and produce connected text on familiar topics." },
      { id: "b2", label: "B2 (Vantage / Upper-Intermediate)", description: "Can interact with native speakers fluently and understand complex text." },
      { id: "c1", label: "C1 (Effective Operational Proficiency / Advanced)", description: "Can express ideas fluently, spontaneously, and flexibly for professional life." },
      { id: "c2", label: "C2 (Mastery / Native-like)", description: "Can easily understand virtually everything heard or read; high nuance." },
      { id: "custom", label: "Other / Custom Level", description: "Specify your custom starting or target benchmark." },
    ],
  },
  {
    id: "coding_technology",
    name: "Coding and Technology",
    description: "Learn programming languages, software engineering, cloud, or AI development.",
    defaultFocusHours: 3,
    levels: [
      { id: "complete_beginner", label: "Complete Beginner", description: "Never written code or built software." },
      { id: "beginner", label: "Beginner", description: "Know basic syntax (variables, loops, functions) but struggle to build." },
      { id: "basic_practical", label: "Basic Practical Experience", description: "Have built small scripts or tutorials with guidance." },
      { id: "intermediate", label: "Intermediate", description: "Can build full-stack or standalone apps independently with docs." },
      { id: "advanced", label: "Advanced", description: "Proficient in architectural patterns, performance, and best practices." },
      { id: "project_ready", label: "Project-Ready / Production-Grade", description: "Ready to deploy scalable, robust production systems." },
      { id: "custom", label: "Custom Level", description: "Specify your custom technical benchmark." },
    ],
  },
  {
    id: "education_exams",
    name: "Education and Exams",
    description: "Prepare for standardized tests, university exams, or academic certifications.",
    defaultFocusHours: 3,
    hasScoreFields: true,
    levels: [
      { id: "starting_basics", label: "Starting from Basics", description: "Need to build foundational concepts from the ground up." },
      { id: "needs_foundation_repair", label: "Needs Foundation Repair", description: "Know some topics but have major gaps causing errors." },
      { id: "developing_understanding", label: "Developing Understanding", description: "Understand theory moderately; need practice with real problem sets." },
      { id: "intermediate_understanding", label: "Intermediate Understanding", description: "Consistently solving standard difficulty questions." },
      { id: "strong_understanding", label: "Strong Understanding", description: "Scoring well on practice tests; targeting top percentiles." },
      { id: "exam_ready", label: "Exam-Ready / Mastery", description: "Consistently scoring at target under timed exam conditions." },
      { id: "custom", label: "Custom Level", description: "Specify your custom academic target." },
    ],
  },
  {
    id: "career_development",
    name: "Career Development",
    description: "Upskilling, landing a new role, promotions, or professional certifications.",
    defaultFocusHours: 2,
    levels: [
      { id: "starting_scratch", label: "Starting from Scratch", description: "Transitioning into a completely new field or industry." },
      { id: "learning_fundamentals", label: "Learning the Fundamentals", description: "Acquiring core knowledge and terminology of the target role." },
      { id: "building_first_projects", label: "Building First Projects / Portfolio", description: "Creating tangible proof of ability and resume materials." },
      { id: "developing_practical_exp", label: "Developing Practical Experience", description: "Applying skills to simulated or real workplace tasks." },
      { id: "intermediate", label: "Intermediate Professional", description: "Solid contributor looking to level up to senior or specialized scope." },
      { id: "advanced", label: "Advanced / Leadership Ready", description: "Targeting leadership, management, or senior architect roles." },
      { id: "custom", label: "Custom Level", description: "Specify your custom career benchmark." },
    ],
  },
  {
    id: "business_entrepreneurship",
    name: "Business and Entrepreneurship",
    description: "Launch an MVP, acquire customers, validate business ideas, or scale revenue.",
    defaultFocusHours: 3,
    levels: [
      { id: "starting_from_scratch", label: "Starting from Scratch (Idea Stage)", description: "Have an idea or looking for the right market opportunity." },
      { id: "learning_fundamentals", label: "Validating the Concept", description: "Talking to users, surveying demand, testing problem-solution fit." },
      { id: "building_first_projects", label: "Building First MVP / Product", description: "Constructing the minimum viable offer or product." },
      { id: "developing_practical", label: "Developing Practical Traction", description: "Acquiring first 10-100 paying customers or users." },
      { id: "intermediate", label: "Intermediate Growth", description: "Optimizing unit economics, marketing channels, and operations." },
      { id: "established", label: "Established / Scaling", description: "Scaling systems, hiring team members, or fundraising." },
      { id: "custom", label: "Custom Level", description: "Specify your custom business milestone." },
    ],
  },
  {
    id: "fitness_personal",
    name: "Fitness and Personal Development",
    description: "Physical conditioning, health habits, discipline, and personal mastery.",
    defaultFocusHours: 1.5,
    levels: [
      { id: "sedentary", label: "Beginner / Sedentary", description: "Currently inactive; establishing baseline physical routine." },
      { id: "restarting", label: "Inconsistent / Restarting", description: "Had good habits before but struggled with consistency." },
      { id: "moderate", label: "Intermediate Consistency", description: "Exercising 2-3 times per week; seeking structured progression." },
      { id: "advanced", label: "Advanced Athletic Conditioning", description: "Experienced in training; targeting specific performance/body metrics." },
      { id: "peak_performance", label: "Peak Performance / Competition Prep", description: "High-intensity training for a race, meet, or event." },
      { id: "custom", label: "Custom Level", description: "Specify your custom personal benchmark." },
    ],
  },
  {
    id: "other",
    name: "Other Skills & Goals",
    description: "Any creative, specialized, or bespoke skill or long-term objective.",
    defaultFocusHours: 2,
    levels: [
      { id: "complete_beginner", label: "Complete Beginner", description: "No prior experience in this area." },
      { id: "beginner", label: "Beginner", description: "Basic familiarity with basic concepts." },
      { id: "elementary", label: "Elementary", description: "Able to perform simple tasks with regular guidance." },
      { id: "intermediate", label: "Intermediate", description: "Comfortable with standard tasks independently." },
      { id: "upper_intermediate", label: "Upper-Intermediate", description: "Handles complex tasks; refining speed and accuracy." },
      { id: "advanced", label: "Advanced", description: "Deep fluency and high competence." },
      { id: "expert", label: "Expert / Master", description: "Top-tier execution and ability to teach others." },
      { id: "custom", label: "Custom Level", description: "Specify your custom benchmark." },
    ],
  },
];

export function getCategoryConfig(categoryId: string): GoalCategoryConfig {
  return GOAL_CATEGORIES.find((c) => c.id === categoryId) || GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1];
}

export function formatLevel(categoryId: string, levelId: string, customLevel?: string): string {
  if (levelId === "custom" && customLevel) {
    return customLevel.trim();
  }
  const config = getCategoryConfig(categoryId);
  const found = config.levels.find((l) => l.id === levelId);
  return found ? found.label : (customLevel || levelId);
}
