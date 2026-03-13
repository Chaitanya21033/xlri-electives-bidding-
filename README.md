# ElectiVe — Course Bidding Platform

A production-quality elective course bidding platform for business schools and graduate management programmes. Supports 600 students, 30+ courses, 3 roles (Admin, Faculty, Student), and robust auction logic with auditable tie-breaking.

---

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env
# Edit DATABASE_URL and DIRECT_DATABASE_URL in .env

# 3. Run migrations
npx prisma migrate dev

# 4. Seed demo data (600 students, 30 courses, live bidding round)
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Role       | Email                      | Password   |
|------------|----------------------------|------------|
| Admin      | admin@elective.dev         | admin123   |
| Faculty    | professor@elective.dev     | prof123    |
| BM Student | bm.student@elective.dev    | student123 |
| HRM Student| hrm.student@elective.dev   | student123 |

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Framework    | Next.js 15 (App Router, TypeScript) |
| Styling      | Tailwind CSS v4, custom design tokens |
| Components   | Radix UI primitives + custom library |
| ORM          | Prisma v7 with pg adapter           |
| Database     | PostgreSQL                          |
| Auth         | Custom session-based auth (httpOnly cookies) |
| Validation   | Zod (server-side) + React Hook Form (client) |
| Testing      | Jest + ts-jest                      |

---

## Architecture

```
src/
├── app/
│   ├── (public)/          # Public marketing site layout
│   ├── (portal)/          # Portal shared layout (auth check)
│   ├── admin/             # Admin portal pages
│   ├── professor/         # Faculty portal pages
│   ├── student/           # Student portal pages
│   ├── api/
│   │   ├── auth/          # Login + signout endpoints
│   │   └── bids/          # Bid placement + withdrawal APIs
│   ├── login/
│   └── page.tsx           # Home/marketing page
├── components/
│   ├── ui/                # Core UI primitives (Button, Badge, Card, etc.)
│   ├── layout/            # Navigation (PortalNav, PublicNav, PublicFooter)
│   ├── portal/
│   │   ├── admin/         # Admin views
│   │   ├── professor/     # Faculty views
│   │   └── student/       # Student views
│   ├── marketing/         # Public site sections
│   └── auth/              # Login form
├── lib/
│   ├── auth.ts            # Session management, verifyCredentials
│   ├── prisma.ts          # Prisma client singleton with pg adapter
│   ├── utils.ts           # Shared utilities
│   └── bidding/
│       ├── types.ts       # Core domain types
│       ├── mrb.ts         # MRB computation engine
│       ├── tiebreak.ts    # Tie-break resolution engine
│       ├── allocation-engine.ts  # Pure allocation logic
│       └── allocation-service.ts # Prisma transactional operations
└── __tests__/
    └── bidding-engine.test.ts    # 35 unit tests
```

---

## Bidding Engine

### MRB (Minimum Required Bid)

The MRB is computed by sorting all active bids descending and taking the Nth bid (where N = available seats) as the clearing price.

- If total bidders ≤ seats: MRB = 0 (undersubscribed)
- If clearing price creates a tie: tie-break logic applies

```
computeMRB(bids: BidInput[], seatsAvailable: number) → MRBComputationResult
```

### Tie-Break Engine

Tie-break policies must be **declared and locked before a round opens**. Students can see the policy before bidding. All decisions are audited.

| Method              | Description                                              |
|---------------------|----------------------------------------------------------|
| `CQPI_DESC`         | Higher CQPI wins. Roll number as secondary sort.         |
| `PREREQ_GRADE_DESC` | Higher grade in specified prerequisite course wins.       |
| `COMPOSITE_RANK`    | Weighted combination of multiple metrics.                |
| `LOTTERY`           | Seeded random shuffle — deterministic and auditable.      |
| `MANUAL_RANKED_LIST`| Pre-uploaded ranked list by admin/faculty.                |

### Allocation Algorithm

1. Filter bids for eligibility (BM/HRM — server-side, never client-only)
2. Compute MRB → identify clearing price
3. Students above clearing price → WON
4. Students at clearing price with remaining seats → check for tie
5. If tie: apply tie-break policy → rank → allocate remaining seats
6. Students below clearing price → LOST
7. Losing bids are reimbursed (transactional)

### Withdrawal Rules

| Scenario                              | Allowed? |
|---------------------------------------|----------|
| Withdraw from LOST bid                | ✅ Yes (points reimbursed) |
| Withdraw from WON bid, points = 0     | ✅ Yes  |
| Withdraw from WON bid, points > 0     | ❌ No — reduce to 0 first |
| Post-round confirmation withdrawal    | ✅ Yes  |
| If MRB = 0, reduce to 0 then withdraw | ✅ Yes  |

---

## Database Schema Highlights

Key entities:

- **User** / **StudentProfile** / **ProfessorProfile** — auth and identity
- **AcademicTerm** / **BiddingCycle** / **BiddingRound** — temporal structure
- **Course** / **CourseOffering** / **TieBreakPolicy** — course management
- **Bid** / **BidHistory** — immutable bid record with audit trail
- **AllocationResult** / **ConfirmationAction** — allocation outcomes
- **StudentPointAllocation** — per-cycle point balance
- **QuotaRule** — cross-programme BM/HRM quotas
- **AuditLog** — every material action logged
- **WaitlistEntry** — optional waitlist support

Full schema: `prisma/schema.prisma`

---

## Running Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

**35 tests** cover:
- MRB computation (undersubscribed, oversubscribed, exact fill, tie detection)
- Bid reduction validation (MRB floor, enforceMinOneBid)
- All tie-break methods (CQPI, prereq grade, composite, lottery, manual list)
- Lottery determinism and seed reproducibility
- Eligibility enforcement (BM-only, HRM-only, both)
- Withdrawal validation rules
- Full allocation runs (no tie, tie with CQPI, ineligible student filtering)

---

## Key Design Decisions

### Why custom auth instead of NextAuth?
NextAuth v5 with Prisma adapter added unnecessary complexity given the simple role-based session needs. Custom httpOnly cookie sessions with bcrypt are more transparent and easier to audit.

### Why Prisma v7 with pg adapter?
Prisma v7 moved to a driver adapter model. We use `@prisma/adapter-pg` for standard PostgreSQL connections. This gives us explicit control over the connection pool and is compatible with edge and serverless runtimes.

### Why is tie-break logic in pure functions?
The allocation engine (`mrb.ts`, `tiebreak.ts`, `allocation-engine.ts`) has zero database dependencies. This allows fast unit testing without mocking, and makes the logic independently auditable. The `allocation-service.ts` wraps it with Prisma transactions.

### Concurrency
- Bids use an optimistic `version` field for concurrency detection
- Allocation runs in a `$transaction` with all relevant reads inside the transaction boundary
- Server-side eligibility check prevents IDOR attacks even if the client is forged

---

## Environment Variables

| Variable              | Description                                     |
|-----------------------|-------------------------------------------------|
| `DATABASE_URL`        | Prisma Postgres proxy URL (for migrations)      |
| `DIRECT_DATABASE_URL` | Standard postgres:// URL (for PrismaClient)     |
| `NEXTAUTH_URL`        | App base URL                                    |
| `NEXTAUTH_SECRET`     | Session signing secret (min 32 chars)           |

---

## TODOs / Phase 2 Scope

- [ ] Admin: full course CRUD UI with validation
- [ ] Admin: student/professor CSV import with validation feedback
- [ ] Admin: manual allocation override UI with reason capture
- [ ] Admin: demand analytics charts (Chart.js or Recharts)
- [ ] Professor: tie-break policy setup form
- [ ] Professor: manual ranked list upload
- [ ] Student: confirmation round UI (confirm/withdraw won allocations)
- [ ] Student: downloadable allocation PDF
- [ ] Email notification hooks (SMTP integration skeleton is in place)
- [ ] Waitlist management UI
- [ ] Real-time MRB updates (polling or SSE)
- [ ] Credit constraint enforcement during bid placement
- [ ] Prerequisite course grade lookup for PREREQ_GRADE_DESC tie-break
- [ ] Admin audit log filters and export
- [ ] Password reset flow
- [ ] Mobile-optimised bid interface
- [ ] E2E tests with Playwright

---

## Business Rules Summary

1. Students only see courses they are batch-eligible for (enforced server-side)
2. Courses cannot go live in a bidding round without a locked tie-break policy
3. Students cannot bid on ineligible courses even via forged API requests
4. Winning students cannot withdraw while their bid points > 0 (active rounds)
5. All bid reimbursements are transactional and audited
6. Tie-break decisions are logged with method, seed (if lottery), and ranked list
7. Admin overrides are recorded with reason and operator identity
8. Every allocation change is appended to the audit log (never deleted)
