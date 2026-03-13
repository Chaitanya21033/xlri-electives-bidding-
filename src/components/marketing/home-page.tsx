import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ArrowRight,
  BarChart3,
  Shield,
  Zap,
  Users,
  BookOpen,
  TrendingUp,
  Award,
  GraduationCap,
  ChevronRight,
  Star,
} from "lucide-react";

const stats = [
  { value: "600+", label: "Students per institution" },
  { value: "30s", label: "Average bid update time" },
  { value: "99.9%", label: "Uptime during bid cycles" },
  { value: "100%", label: "Tie-break auditability" },
];

const features = [
  {
    icon: Shield,
    title: "Transparent Allocation Engine",
    description:
      "Every allocation decision is logged and auditable. Students see tie-break policies before bidding. No black boxes.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Demand Visibility",
    description:
      "Administrators and faculty see live bid distributions across courses. Identify oversubscription early and adjust capacity with confidence.",
  },
  {
    icon: Zap,
    title: "Configurable Bidding Logic",
    description:
      "Set minimum required bids, carry-forward policies, round-specific rules, and cross-programme quotas — all without engineering support.",
  },
  {
    icon: Users,
    title: "Multi-Role Collaboration",
    description:
      "Admins govern the process, faculty define tie-break criteria, and students bid with complete information. Three portals, one platform.",
  },
  {
    icon: TrendingUp,
    title: "MRB and Clearing Price Logic",
    description:
      "Dynamic Minimum Required Bid reflects actual course demand. Students make informed allocation decisions rather than guessing.",
  },
  {
    icon: Award,
    title: "Robust Tie-Break Engine",
    description:
      "CQPI, prerequisite grades, composite ranking, or lottery — tie-break rules are pre-declared, visible to students, and fully audited.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Admin configures the cycle",
    description:
      "Create the academic term, configure bidding rounds, set total point allocations per student, and define cross-programme quotas.",
  },
  {
    step: "02",
    title: "Faculty publish course details",
    description:
      "Professors complete course descriptions, set seat caps, define eligibility, and — critically — declare tie-break policy before the round opens.",
  },
  {
    step: "03",
    title: "Students bid with full information",
    description:
      "Students view eligible courses, see current MRB levels, allocate bid points, and adjust in real time until the round closes.",
  },
  {
    step: "04",
    title: "Engine resolves allocations",
    description:
      "The allocation engine runs seat filling, applies tie-break logic where required, and publishes results with a full audit trail.",
  },
  {
    step: "05",
    title: "Confirmation and finalisation",
    description:
      "Students confirm or withdraw from won courses during the confirmation round. Losing bids are automatically reimbursed.",
  },
];

const faqs = [
  {
    q: "What is the Minimum Required Bid (MRB)?",
    a: "The MRB is the current clearing price for a course — the lowest bid that would still secure a seat based on current demand. If demand is below seat availability, the MRB may be zero.",
  },
  {
    q: "Can a student win a course with zero bid points?",
    a: "Yes, if total demand for the course is below available seats. However, institutions can configure the platform to enforce a minimum one-point bid if preferred.",
  },
  {
    q: "How are ties resolved when multiple students bid the same amount?",
    a: "Each course must have a pre-declared tie-break policy visible to students before bidding opens. Supported methods include CQPI ranking, prerequisite course grades, composite ranking, lottery, or a manually uploaded ranked list.",
  },
  {
    q: "Can a student withdraw from a course they are winning?",
    a: "During active bidding, a student can withdraw from a winning course only if their bid points are at zero. After the round closes, withdrawals are possible during the confirmation window.",
  },
  {
    q: "Does the platform support batch-restricted courses?",
    a: "Yes. Courses can be set as BM-only, HRM-only, or open to both batches. Students only see and can bid on courses they are eligible for — enforcement happens server-side, not just in the UI.",
  },
  {
    q: "What happens to points from losing bids?",
    a: "Points from losing bids are automatically reimbursed to the student's available balance. Every reimbursement is transactional and logged in the audit trail.",
  },
];

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0f2744] pb-20 pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#1e6fcc22_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e6fcc]" />
              Purpose-built for management education institutions
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Elective allocation
              <span className="block text-[#4d9de0]">
                that students trust.
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-2xl">
              ElectiVe replaces spreadsheets and opaque admin processes with a
              structured, auditable bidding platform. Students bid with real
              information. Faculty own their tie-break logic. Administrators
              govern the entire cycle.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/demo">
                  Request a Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/solutions">See how it works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[#d4dde6] bg-[#f5f7fa]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-[#0f2744]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[#6b7e8f]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-[#0f2744] tracking-tight">
              Built for institutional complexity
            </h2>
            <p className="mt-4 text-[#4a5e72] leading-relaxed">
              Elective bidding isn't simple. Batch restrictions, tie-break
              policies, cross-programme quotas, and concurrent access — ElectiVe
              handles all of it with configurable logic and a clean audit trail.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[#d4dde6] bg-white p-6 hover:border-[#1e6fcc]/30 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f0fb] mb-4">
                  <feature.icon className="h-5 w-5 text-[#1e6fcc]" />
                </div>
                <h3 className="text-base font-semibold text-[#1c2b3a]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-[#6b7e8f] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#f5f7fa] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold text-[#0f2744] tracking-tight">
              From configuration to final allocation
            </h2>
            <p className="mt-4 text-[#4a5e72] leading-relaxed">
              A structured five-step process designed around the realities of
              academic programme management.
            </p>
          </div>
          <div className="space-y-4">
            {workflow.map((step, index) => (
              <div
                key={step.step}
                className="flex gap-6 rounded-xl bg-white border border-[#d4dde6] p-6"
              >
                <div className="shrink-0">
                  <span className="text-3xl font-bold text-[#d4dde6]">
                    {step.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1c2b3a]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#6b7e8f] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role overview */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold text-[#0f2744] tracking-tight">
              Three roles, one coherent system
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Shield,
                role: "Administrator",
                color: "bg-[#0f2744]",
                points: [
                  "Create and manage bidding cycles",
                  "Import students and faculty",
                  "Configure points and round policies",
                  "Override allocations with audit trail",
                  "View demand analytics and reports",
                  "Manage announcements and notifications",
                ],
              },
              {
                icon: BookOpen,
                role: "Faculty",
                color: "bg-[#1e6fcc]",
                points: [
                  "Publish course details and eligibility",
                  "Declare tie-break policy before round opens",
                  "View real-time demand for your courses",
                  "See provisional and final allocation lists",
                  "Upload course-specific instructions",
                  "Set seat cap request for admin approval",
                ],
              },
              {
                icon: GraduationCap,
                role: "Student",
                color: "bg-[#1a7f5a]",
                points: [
                  "Browse eligible courses with full details",
                  "See current MRB and seat availability",
                  "Allocate and adjust bid points",
                  "Withdraw from losing courses for reimbursement",
                  "View won/losing/tentative status in real time",
                  "Download final allocation summary",
                ],
              },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-xl border border-[#d4dde6] bg-white overflow-hidden"
              >
                <div className={`${r.color} p-5`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                      <r.icon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      {r.role}
                    </h3>
                  </div>
                </div>
                <ul className="p-5 space-y-2.5">
                  {r.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-[#1a7f5a] mt-0.5 shrink-0" />
                      <span className="text-sm text-[#4a5e72]">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#f5f7fa] py-20" id="faq">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#0f2744] tracking-tight">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-[#4a5e72]">
              Common questions about elective bidding and the ElectiVe platform.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-[#d4dde6] bg-white p-6"
              >
                <h3 className="text-sm font-semibold text-[#1c2b3a]">
                  {faq.q}
                </h3>
                <p className="mt-2 text-sm text-[#6b7e8f] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e6fcc] hover:text-[#1558a6]"
            >
              View all FAQs
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0f2744]">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Ready to replace the spreadsheet?
          </h2>
          <p className="mt-4 text-white/70 leading-relaxed">
            ElectiVe is designed for institutions with 200–2000 students across
            multiple batches and programmes. Get a structured walkthrough with
            your academic calendar and use-case in mind.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/demo">
                Schedule a Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/about">Learn about us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
