/**
 * ElectiVe Seed Script
 * Creates realistic demo data:
 *   - 1 Admin
 *   - 30 Professors
 *   - 600 Students (360 BM + 240 HRM)
 *   - 30 Courses (mix of BM-only, HRM-only, both)
 *   - 1 Active Academic Term
 *   - 1 Bidding Cycle with 2 rounds
 *   - Sample bids with tie scenarios
 */

import "dotenv/config";
import { PrismaClient, TieBreakMethod, EligibilityType, CourseStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString:
    process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "admin@elective.dev";
const PROF_EMAIL = "professor@elective.dev";
const BM_STUDENT_EMAIL = "bm.student@elective.dev";
const HRM_STUDENT_EMAIL = "hrm.student@elective.dev";

const departments = [
  "Finance & Accounting",
  "Marketing & Strategy",
  "Operations & Supply Chain",
  "Human Resources",
  "Business Analytics",
  "Entrepreneurship",
  "Economics",
];

const courseData = [
  // BM-only
  {
    code: "FIN601",
    title: "Advanced Corporate Finance",
    credits: 3,
    eligibility: "BM_ONLY" as EligibilityType,
    totalSeats: 45,
    description: "In-depth study of capital structure, M&A, and valuation methods used by investment banks and corporate treasury teams.",
    learningGoals: "Apply DCF and relative valuation; evaluate M&A synergies; understand leverage and capital markets.",
    schedule: "Mon/Wed 09:00–10:30",
    prerequisites: ["FIN501"],
    minEnrollment: 10,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "FIN602",
    title: "Derivatives and Risk Management",
    credits: 3,
    eligibility: "BM_ONLY" as EligibilityType,
    totalSeats: 40,
    description: "Options, futures, swaps, and structured products. Risk measurement and hedging strategies for financial institutions.",
    learningGoals: "Price derivatives using Black-Scholes and binomial trees; design hedging programs.",
    schedule: "Tue/Thu 11:00–12:30",
    prerequisites: ["FIN501"],
    minEnrollment: 8,
    tieBreakMethod: "PREREQ_GRADE_DESC" as TieBreakMethod,
  },
  {
    code: "MKT601",
    title: "Brand Strategy and Architecture",
    credits: 2,
    eligibility: "BM_ONLY" as EligibilityType,
    totalSeats: 35,
    description: "How firms build, extend, and manage brand portfolios. Case studies from FMCG, luxury, and B2B sectors.",
    learningGoals: "Design brand architecture; measure brand equity; develop brand extension strategy.",
    schedule: "Fri 10:00–12:30",
    prerequisites: ["MKT501"],
    minEnrollment: 8,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "OPS601",
    title: "Supply Chain Analytics",
    credits: 3,
    eligibility: "BM_ONLY" as EligibilityType,
    totalSeats: 38,
    description: "Data-driven supply chain decision making. Network design, inventory optimization, and resilience planning.",
    learningGoals: "Build supply chain simulation models; apply optimization to real logistics problems.",
    schedule: "Mon/Wed 14:00–15:30",
    prerequisites: ["OPS501"],
    minEnrollment: 8,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "STR601",
    title: "Corporate Strategy and Governance",
    credits: 3,
    eligibility: "BM_ONLY" as EligibilityType,
    totalSeats: 50,
    description: "Corporate diversification, portfolio strategy, and the role of boards and governance structures in value creation.",
    learningGoals: "Apply BCG and McKinsey strategy frameworks; evaluate board effectiveness; analyze activist investor cases.",
    schedule: "Tue/Thu 09:00–10:30",
    prerequisites: [],
    minEnrollment: 12,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  // HRM-only
  {
    code: "HRM601",
    title: "Talent Acquisition and Employer Branding",
    credits: 3,
    eligibility: "HRM_ONLY" as EligibilityType,
    totalSeats: 30,
    description: "Modern recruitment strategy, competency frameworks, and building employer brand in competitive talent markets.",
    learningGoals: "Design structured interview processes; measure time-to-hire and quality-of-hire; build EVP frameworks.",
    schedule: "Mon/Wed 11:00–12:30",
    prerequisites: [],
    minEnrollment: 8,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "HRM602",
    title: "Compensation Design and Total Rewards",
    credits: 3,
    eligibility: "HRM_ONLY" as EligibilityType,
    totalSeats: 30,
    description: "Salary benchmarking, incentive plan design, and equity compensation for listed and unlisted companies.",
    learningGoals: "Conduct pay equity audits; design sales compensation plans; evaluate executive remuneration.",
    schedule: "Tue/Thu 14:00–15:30",
    prerequisites: ["HRM501"],
    minEnrollment: 8,
    tieBreakMethod: "PREREQ_GRADE_DESC" as TieBreakMethod,
  },
  {
    code: "HRM603",
    title: "Organisation Development and Change",
    credits: 2,
    eligibility: "HRM_ONLY" as EligibilityType,
    totalSeats: 25,
    description: "Planned change approaches, culture diagnostics, and the role of the HR function in managing organisational transitions.",
    learningGoals: "Apply Kotter and ADKAR change models; facilitate culture workshops; evaluate change readiness.",
    schedule: "Fri 09:00–11:30",
    prerequisites: [],
    minEnrollment: 6,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "HRM604",
    title: "Labour Law and Industrial Relations",
    credits: 3,
    eligibility: "HRM_ONLY" as EligibilityType,
    totalSeats: 28,
    description: "Indian labour legislation, collective bargaining, dispute resolution, and compliance obligations for HR professionals.",
    learningGoals: "Navigate statutory compliance; conduct grievance redressal proceedings; manage union negotiations.",
    schedule: "Mon/Wed 16:00–17:30",
    prerequisites: [],
    minEnrollment: 6,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "HRM605",
    title: "HR Analytics and People Data",
    credits: 2,
    eligibility: "HRM_ONLY" as EligibilityType,
    totalSeats: 20,
    description: "Workforce analytics, attrition prediction models, and building data-informed HR decisions.",
    learningGoals: "Build predictive attrition models; visualize workforce data; present insights to leadership.",
    schedule: "Thu 14:00–16:30",
    prerequisites: [],
    minEnrollment: 5,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  // Open to both
  {
    code: "BAN601",
    title: "Business Analytics for Managers",
    credits: 3,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 60,
    description: "Statistical reasoning, regression analysis, and decision analytics tools for general management.",
    learningGoals: "Interpret regression outputs; apply A/B testing to business decisions; build basic predictive models.",
    schedule: "Mon/Wed 09:00–10:30",
    prerequisites: [],
    minEnrollment: 15,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "BAN602",
    title: "Machine Learning for Business",
    credits: 3,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 40,
    description: "Practical ML applications in marketing, operations, and risk. No advanced math required — focus on interpretation and deployment.",
    learningGoals: "Run classification and clustering models; evaluate ML model performance; design ML use cases for firms.",
    schedule: "Tue/Thu 11:00–12:30",
    prerequisites: ["BAN601"],
    minEnrollment: 10,
    tieBreakMethod: "PREREQ_GRADE_DESC" as TieBreakMethod,
  },
  {
    code: "ENT601",
    title: "New Venture Creation",
    credits: 3,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 45,
    description: "From idea to business model. Customer discovery, MVP development, and venture financing for aspiring entrepreneurs.",
    learningGoals: "Apply lean startup methodology; pitch to investors; build a business model canvas.",
    schedule: "Fri 10:00–12:30 + workshop",
    prerequisites: [],
    minEnrollment: 12,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "ENT602",
    title: "Family Business and Succession",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 30,
    description: "Governance, succession planning, and professionalisation challenges in family-controlled enterprises.",
    learningGoals: "Develop a succession roadmap; design family governance charter; manage promoter-professional tensions.",
    schedule: "Sat 09:00–11:30",
    prerequisites: [],
    minEnrollment: 8,
    tieBreakMethod: "LOTTERY" as TieBreakMethod,
  },
  {
    code: "MKT602",
    title: "Digital Marketing and Growth",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 55,
    description: "SEO, paid acquisition, content strategy, and analytics-driven growth marketing for consumer and B2B brands.",
    learningGoals: "Plan paid media campaigns; audit SEO; measure CAC and LTV; design growth loops.",
    schedule: "Mon/Wed 14:00–15:00",
    prerequisites: [],
    minEnrollment: 10,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "FIN603",
    title: "Fintech and Digital Banking",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 50,
    description: "Disruption in financial services: payments, lending, wealthtech, regtech, and CBDC ecosystems.",
    learningGoals: "Map fintech value chains; analyse regulatory frameworks; evaluate startup business models.",
    schedule: "Tue/Thu 16:00–17:00",
    prerequisites: [],
    minEnrollment: 10,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "STR602",
    title: "Competitive Intelligence and Scenario Planning",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 35,
    description: "Systematic competitor analysis, war gaming, and scenario planning as strategic management tools.",
    learningGoals: "Build competitive intelligence systems; run strategy war games; develop scenario plans.",
    schedule: "Fri 14:00–16:30",
    prerequisites: [],
    minEnrollment: 8,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "OPS602",
    title: "Service Operations Management",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 40,
    description: "Capacity management, queuing theory, and quality systems for service organizations in healthcare, banking, and hospitality.",
    learningGoals: "Apply Little's Law and queuing models; design service blueprints; measure and improve service quality.",
    schedule: "Mon/Wed 10:30–11:30",
    prerequisites: [],
    minEnrollment: 8,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "ESG601",
    title: "ESG Strategy and Sustainable Finance",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 45,
    description: "Corporate sustainability strategy, ESG disclosure frameworks (BRSR, TCFD), and green finance instruments.",
    learningGoals: "Conduct ESG materiality assessment; design sustainability reporting; evaluate green bond use of proceeds.",
    schedule: "Thu 09:00–11:30",
    prerequisites: [],
    minEnrollment: 10,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "MGT601",
    title: "Negotiations and Influence",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 50,
    description: "Principled negotiation theory and practice. Multi-party negotiations, cross-cultural dynamics, and persuasion science.",
    learningGoals: "Apply BATNA framework; conduct multi-party negotiations; understand cognitive biases in negotiation.",
    schedule: "Sat 10:00–12:30",
    prerequisites: [],
    minEnrollment: 12,
    tieBreakMethod: "LOTTERY" as TieBreakMethod,
  },
  {
    code: "MGT602",
    title: "Cross-Cultural Management",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 40,
    description: "Managing teams and organisations across cultural boundaries. Hofstede, GLOBE, and real-world case practice.",
    learningGoals: "Diagnose cultural dimensions; manage multicultural projects; adapt leadership style across cultures.",
    schedule: "Tue/Thu 16:00–17:00",
    prerequisites: [],
    minEnrollment: 10,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "LAW601",
    title: "Business Law and Contracts",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 60,
    description: "Contractual obligations, commercial disputes, IP basics, and regulatory compliance essentials for managers.",
    learningGoals: "Draft and review commercial contracts; identify IP infringement risks; navigate dispute resolution options.",
    schedule: "Mon/Wed 17:30–18:30",
    prerequisites: [],
    minEnrollment: 15,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "FIN604",
    title: "Private Equity and Venture Capital",
    credits: 3,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 30,
    description: "PE fund structures, LBO mechanics, VC term sheets, and portfolio management from an investor perspective.",
    learningGoals: "Build an LBO model; analyse VC term sheet provisions; evaluate PE exit strategies.",
    schedule: "Tue/Thu 09:00–10:30",
    prerequisites: ["FIN501"],
    minEnrollment: 8,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "MKT603",
    title: "Consumer Behaviour and Insights",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 45,
    description: "Psychological and sociocultural drivers of consumer decisions. Qualitative and quantitative research methods.",
    learningGoals: "Design consumer research studies; apply behavioural economics; develop segmentation frameworks.",
    schedule: "Fri 09:00–11:30",
    prerequisites: ["MKT501"],
    minEnrollment: 10,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "BAN603",
    title: "Visualisation and Data Storytelling",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 50,
    description: "Turning data into compelling narratives for executive audiences. Tableau, Power BI, and design principles.",
    learningGoals: "Build interactive dashboards; apply data storytelling principles; design for executive consumption.",
    schedule: "Wed 14:00–16:30",
    prerequisites: [],
    minEnrollment: 10,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "STR603",
    title: "Global Business Strategy",
    credits: 3,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 42,
    description: "Internationalization, market entry modes, global value chains, and geopolitical risk for multinational firms.",
    learningGoals: "Apply OLI and Uppsala frameworks; evaluate market entry options; manage geopolitical exposure.",
    schedule: "Mon/Wed 16:00–17:30",
    prerequisites: [],
    minEnrollment: 10,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "OPS603",
    title: "Project Management",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 55,
    description: "Traditional and agile project management methodologies. Scope, schedule, cost, and risk management.",
    learningGoals: "Build project schedules using CPM; manage stakeholder communication; apply agile ceremonies.",
    schedule: "Thu 16:00–18:30",
    prerequisites: [],
    minEnrollment: 12,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  {
    code: "MGT603",
    title: "Design Thinking for Managers",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 36,
    description: "Human-centred design applied to business problems. From empathy to prototyping and testable solutions.",
    learningGoals: "Facilitate design sprints; conduct user interviews; prototype and test ideas at speed.",
    schedule: "Sat 09:00–12:30",
    prerequisites: [],
    minEnrollment: 8,
    tieBreakMethod: "LOTTERY" as TieBreakMethod,
  },
  {
    code: "ECO601",
    title: "Macroeconomics for Business Leaders",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 60,
    description: "Reading the macroeconomic environment: monetary policy, fiscal policy, inflation, and their impact on business strategy.",
    learningGoals: "Interpret central bank communications; assess macro risk for business planning; forecast economic scenarios.",
    schedule: "Tue/Thu 08:00–09:00",
    prerequisites: [],
    minEnrollment: 15,
    tieBreakMethod: "CQPI_DESC" as TieBreakMethod,
  },
  // Undersubscribed course (low seats relative to demand will be reversed — high seats, low demand scenario)
  {
    code: "MGT604",
    title: "Business History and Long Cycles",
    credits: 1,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 40,
    description: "How historical patterns inform business strategy. Case studies from industrial revolutions to digital transformations.",
    learningGoals: "Apply historical lens to strategy; identify cyclical patterns in industries; avoid recency bias.",
    schedule: "Sat 14:00–15:00",
    prerequisites: [],
    minEnrollment: 5,
    tieBreakMethod: "LOTTERY" as TieBreakMethod,
  },
  {
    code: "MGT605",
    title: "Leadership and Executive Presence",
    credits: 2,
    eligibility: "BOTH" as EligibilityType,
    totalSeats: 60,
    description: "Leadership identity, executive communication, and building high-performance teams across career stages.",
    learningGoals: "Develop personal leadership narrative; practice executive communication; apply situational leadership.",
    schedule: "Fri 16:00–18:30",
    prerequisites: [],
    minEnrollment: 15,
    tieBreakMethod: "LOTTERY" as TieBreakMethod,
  },
];

const professorNames = [
  ["Dr. Arvind Sharma", "Finance & Accounting"],
  ["Dr. Meera Krishnan", "Finance & Accounting"],
  ["Dr. Rajesh Nair", "Marketing & Strategy"],
  ["Dr. Priya Mehta", "Marketing & Strategy"],
  ["Dr. Vikram Rao", "Operations & Supply Chain"],
  ["Dr. Sunita Desai", "Operations & Supply Chain"],
  ["Dr. Amit Gupta", "Business Analytics"],
  ["Dr. Lakshmi Pillai", "Business Analytics"],
  ["Dr. Sanjay Kumar", "Human Resources"],
  ["Dr. Deepa Mathur", "Human Resources"],
  ["Dr. Nitin Agarwal", "Entrepreneurship"],
  ["Dr. Kavitha Reddy", "Entrepreneurship"],
  ["Dr. Rahul Bose", "Finance & Accounting"],
  ["Dr. Ananya Singh", "Marketing & Strategy"],
  ["Dr. Vijay Shetty", "Operations & Supply Chain"],
  ["Dr. Nandita Ghosh", "Economics"],
  ["Dr. Kiran Joshi", "Business Analytics"],
  ["Dr. Suresh Venkat", "Human Resources"],
  ["Dr. Pooja Tiwari", "Marketing & Strategy"],
  ["Dr. Manoj Kapoor", "Finance & Accounting"],
  ["Dr. Rekha Iyer", "Human Resources"],
  ["Dr. Sameer Patel", "Business Analytics"],
  ["Dr. Uma Srinivasan", "Operations & Supply Chain"],
  ["Dr. Anil Banerjee", "Entrepreneurship"],
  ["Dr. Hema Nair", "Economics"],
  ["Dr. Sunil Khanna", "Finance & Accounting"],
  ["Dr. Geeta Choudhury", "Marketing & Strategy"],
  ["Dr. Ravi Mohan", "Business Analytics"],
  ["Dr. Swati Verma", "Human Resources"],
  ["Dr. Prashanth Lal", "Operations & Supply Chain"],
];

async function main() {
  console.log("🌱 Starting seed...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const profPassword = await bcrypt.hash("prof123", 12);
  const studentPassword = await bcrypt.hash("student123", 12);

  // ─── Admin ───────────────────────────────────────────────
  console.log("Creating admin...");
  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: "Admin User",
      hashedPassword: adminPassword,
      role: "ADMIN",
    },
  });

  // ─── Academic term ────────────────────────────────────────
  console.log("Creating academic term...");
  const term = await prisma.academicTerm.upsert({
    where: { id: "term-2024-25-t4" },
    update: { isActive: true },
    create: {
      id: "term-2024-25-t4",
      name: "Term 4 — 2024-25",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-04-30"),
      isActive: true,
    },
  });

  // ─── Professors ───────────────────────────────────────────
  console.log("Creating 30 professors...");
  const professors = [];
  for (let i = 0; i < professorNames.length; i++) {
    const [name, dept] = professorNames[i];
    const email =
      i === 0
        ? PROF_EMAIL
        : `prof${i + 1}@elective.dev`;
    const profUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        hashedPassword: profPassword,
        role: "PROFESSOR",
      },
    });
    const profile = await prisma.professorProfile.upsert({
      where: { userId: profUser.id },
      update: {},
      create: {
        userId: profUser.id,
        employeeId: `EMP${String(1000 + i).padStart(4, "0")}`,
        department: dept,
        designation: i % 5 === 0 ? "Professor" : i % 3 === 0 ? "Associate Professor" : "Assistant Professor",
        bio: `Faculty member in ${dept} with expertise in ${courseData[i % courseData.length].title.split(" ").slice(0, 3).join(" ")}.`,
      },
    });
    professors.push(profile);
  }

  // ─── Courses ─────────────────────────────────────────────
  console.log("Creating 30 courses with tie-break policies...");
  const courses = [];
  for (let i = 0; i < courseData.length; i++) {
    const cd = courseData[i];
    const course = await prisma.course.upsert({
      where: { code: cd.code },
      update: {},
      create: {
        code: cd.code,
        title: cd.title,
        description: cd.description,
        credits: cd.credits,
        academicTermId: term.id,
        status: "PUBLISHED" as CourseStatus,
        eligibility: cd.eligibility,
        totalSeats: cd.totalSeats,
        bmQuota:
          cd.eligibility === "BOTH"
            ? Math.floor(cd.totalSeats * 0.6)
            : undefined,
        hrmQuota:
          cd.eligibility === "BOTH"
            ? Math.ceil(cd.totalSeats * 0.4)
            : undefined,
        minEnrollment: cd.minEnrollment,
        prerequisites: cd.prerequisites,
        schedule: cd.schedule,
        learningGoals: cd.learningGoals,
      },
    });

    // Tie-break policy
    await prisma.tieBreakPolicy.upsert({
      where: { courseId: course.id },
      update: {},
      create: {
        courseId: course.id,
        method: cd.tieBreakMethod,
        lotteryAllowed: cd.tieBreakMethod === "LOTTERY",
        isLocked: true,
        lockedAt: new Date(),
      },
    });

    // Course offering with assigned professor
    const profProfile = professors[i % professors.length];
    await prisma.courseOffering.upsert({
      where: {
        courseId_professorId: {
          courseId: course.id,
          professorId: profProfile.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        professorId: profProfile.id,
        seatCap: cd.totalSeats,
        bmSeatCap:
          cd.eligibility === "BOTH"
            ? Math.floor(cd.totalSeats * 0.6)
            : undefined,
        hrmSeatCap:
          cd.eligibility === "BOTH"
            ? Math.ceil(cd.totalSeats * 0.4)
            : undefined,
        mrbPoints: 0,
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    courses.push(course);
  }

  // ─── Bidding cycle ────────────────────────────────────────
  console.log("Creating bidding cycle and rounds...");
  const cycle = await prisma.biddingCycle.upsert({
    where: { id: "cycle-2024-25-t4" },
    update: {},
    create: {
      id: "cycle-2024-25-t4",
      name: "Term 4 Electives Bid — 2024-25",
      academicTermId: term.id,
      totalPointsPerStudent: 1000,
      allowCarryForward: false,
      enforceMinOneBid: false,
      crossProgrammeEnabled: true,
    },
  });

  const round1 = await prisma.biddingRound.upsert({
    where: { biddingCycleId_roundNumber: { biddingCycleId: cycle.id, roundNumber: 1 } },
    update: {},
    create: {
      biddingCycleId: cycle.id,
      roundNumber: 1,
      name: "Round 1 — Primary Bidding",
      status: "OPEN",
      openAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      closeAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  const round2 = await prisma.biddingRound.upsert({
    where: { biddingCycleId_roundNumber: { biddingCycleId: cycle.id, roundNumber: 2 } },
    update: {},
    create: {
      biddingCycleId: cycle.id,
      roundNumber: 2,
      name: "Round 2 — Confirmation",
      status: "DRAFT",
      isConfirmationRound: true,
    },
  });

  // ─── Students ─────────────────────────────────────────────
  console.log("Creating 600 students (360 BM + 240 HRM)...");
  const studentIds: string[] = [];
  const studentProfileIds: string[] = [];
  const BM_COUNT = 360;
  const HRM_COUNT = 240;

  for (let i = 0; i < BM_COUNT + HRM_COUNT; i++) {
    const isBM = i < BM_COUNT;
    const batchType = isBM ? "BM" : "HRM";
    const idx = isBM ? i + 1 : i - BM_COUNT + 1;
    const email =
      i === 0
        ? BM_STUDENT_EMAIL
        : i === BM_COUNT
        ? HRM_STUDENT_EMAIL
        : `${batchType.toLowerCase()}${idx}@elective.dev`;
    const name =
      i === 0
        ? "Arjun Mehta"
        : i === BM_COUNT
        ? "Priya Reddy"
        : `Student ${batchType}${idx}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        hashedPassword: studentPassword,
        role: "STUDENT",
      },
    });

    const rollNumber = `${batchType}24${String(idx).padStart(3, "0")}`;
    const cqpi = 6.0 + Math.random() * 4.0; // 6.0–10.0
    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        rollNumber,
        batchType: isBM ? "BM" : "HRM",
        programme: isBM ? "MBA (Business Management)" : "MBA (Human Resources Management)",
        yearOfStudy: 2,
        cqpi: Math.round(cqpi * 100) / 100,
      },
    });

    // Point allocation
    await prisma.studentPointAllocation.upsert({
      where: {
        studentId_biddingCycleId: {
          studentId: profile.id,
          biddingCycleId: cycle.id,
        },
      },
      update: {},
      create: {
        studentId: profile.id,
        biddingCycleId: cycle.id,
        totalPoints: 1000,
        usedPoints: 0,
      },
    });

    studentIds.push(user.id);
    studentProfileIds.push(profile.id);
  }

  // ─── Sample bids (first 100 students) ─────────────────────
  console.log("Creating sample bids with tie scenarios...");
  const allOfferings = await prisma.courseOffering.findMany({
    include: { course: true },
  });

  // High-demand course: BAN601 (open to all, 60 seats)
  const ban601Offering = allOfferings.find(
    (o) => o.course.code === "BAN601"
  );
  // Create a tie scenario: 65+ students bid on BAN601 with exactly 100 points
  if (ban601Offering) {
    let tieCount = 0;
    for (let i = 0; i < Math.min(70, studentProfileIds.length); i++) {
      const pointsAllocated = i < 65 ? 100 : 80 + (i % 5) * 10;
      const existing = await prisma.bid.findUnique({
        where: {
          studentId_courseOfferingId_biddingRoundId: {
            studentId: studentProfileIds[i],
            courseOfferingId: ban601Offering.id,
            biddingRoundId: round1.id,
          },
        },
      });
      if (!existing) {
        await prisma.bid.create({
          data: {
            studentId: studentProfileIds[i],
            courseOfferingId: ban601Offering.id,
            biddingRoundId: round1.id,
            pointsAllocated,
            isActive: true,
          },
        });
        await prisma.studentPointAllocation.update({
          where: {
            studentId_biddingCycleId: {
              studentId: studentProfileIds[i],
              biddingCycleId: cycle.id,
            },
          },
          data: { usedPoints: { increment: pointsAllocated } },
        });
      }
    }
    // Set MRB for BAN601
    await prisma.courseOffering.update({
      where: { id: ban601Offering.id },
      data: { mrbPoints: 100 },
    });
  }

  // Undersubscribed: MGT604 — only 5 bids for 40 seats
  const mgt604Offering = allOfferings.find(
    (o) => o.course.code === "MGT604"
  );
  if (mgt604Offering) {
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.bid.findUnique({
        where: {
          studentId_courseOfferingId_biddingRoundId: {
            studentId: studentProfileIds[BM_COUNT + i],
            courseOfferingId: mgt604Offering.id,
            biddingRoundId: round1.id,
          },
        },
      });
      if (!existing) {
        await prisma.bid.create({
          data: {
            studentId: studentProfileIds[BM_COUNT + i],
            courseOfferingId: mgt604Offering.id,
            biddingRoundId: round1.id,
            pointsAllocated: 20,
            isActive: true,
          },
        });
      }
    }
  }

  // ─── Demo announcement ────────────────────────────────────
  await prisma.announcement.upsert({
    where: { id: "announce-demo-01" },
    update: {},
    create: {
      id: "announce-demo-01",
      title: "Term 4 Elective Bidding Now Open",
      body: "Round 1 of the Term 4 elective bidding cycle is now open. You have 1000 bid points to allocate. The round closes in 5 days. Please review the tie-break policies for each course before allocating your points.",
      isActive: true,
      publishedAt: new Date(),
    },
  });

  // ─── Credit constraints ───────────────────────────────────
  await prisma.creditConstraint.upsert({
    where: { id: "cc-bm-t4" },
    update: {},
    create: {
      id: "cc-bm-t4",
      batchType: "BM",
      minCredits: 12,
      maxCredits: 18,
      termId: term.id,
    },
  });
  await prisma.creditConstraint.upsert({
    where: { id: "cc-hrm-t4" },
    update: {},
    create: {
      id: "cc-hrm-t4",
      batchType: "HRM",
      minCredits: 12,
      maxCredits: 18,
      termId: term.id,
    },
  });

  console.log("\n✅ Seed complete!\n");
  console.log("Demo credentials:");
  console.log("  Admin:       admin@elective.dev / admin123");
  console.log("  Faculty:     professor@elective.dev / prof123");
  console.log("  BM Student:  bm.student@elective.dev / student123");
  console.log("  HRM Student: hrm.student@elective.dev / student123");
  console.log("\nActive round: Round 1 — Primary Bidding (OPEN)");
  console.log(`Students: ${BM_COUNT} BM + ${HRM_COUNT} HRM = 600 total`);
  console.log(`Courses: ${courseData.length} (5 BM-only, 5 HRM-only, 20 open)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
