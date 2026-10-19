# RuleForge — A Verifiable Business Rules Engine (Frontend)

RuleForge is a developer-tool web application and formal verification workbench designed for defining, testing, and formally proving business rule correctness. Unlike traditional heuristic engines, RuleForge pairs an authoritative execution runtime with an SMT-LIB2 backend (Z3 solver) to detect rule conflicts, unreachable branches, and condition overlaps, alongside counterfactual perturbation analysis and historical backtesting.

---

## 1. Key Architectural Features

- **Authoritative Business Rules Editor**:
  - Full domain-specific language (DSL) supporting `AND`, `OR`, `==`, `!=`, `>`, `<`, `>=`, `<=`, and nested expressions.
  - Advisory client-side AST tokenization and syntax linting with purple/indigo code styling.
  - Server-authoritative validation preventing unproven client decisions.
  - Priority-ordered deterministic execution model.

- **Evaluation Playground**:
  - Interactive decision simulator for e-commerce discount and eligibility domains (Tiers: `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`).
  - Step-by-step condition evaluation trace timeline.
  - Matched and failed predicate breakdowns with execution latency metrics.

- **Formal Verification Workspace**:
  - Direct integration with backend Z3 SMT solver.
  - Verifies for **Rule Overlap**, **Conflicting Outcomes**, **Unreachable Rules**, and **Shadowed Rules**.
  - Distinct solver results: **SAT** (satisfying counterexample found), **UNSAT** (proven safe/infeasible), **UNKNOWN** (inconclusive).
  - Concrete **Witness Input assignments** extracted directly from solver models.
  - Deep inspection modal showing SMT-LIB2 diagnostics and formal remediation guidance.

- **Counterfactual Explorer**:
  - What-If solver calculating the minimal perturbation required to flip a decision.
  - Side-by-side Before/After comparison.
  - Formally distinguishes **Proven Optimal (Z3 Minimal Cost)** from **Best-Found Candidate (Heuristic)**.

- **Historical Backtesting Engine**:
  - Regression and impact simulation comparing a baseline ruleset version against a candidate draft across thousands of historical records.
  - Interactive Recharts outcome distribution charts and tier/region breakdown tables.
  - Changed decision record auditing with dollar impact quantification.
  - Audit CSV export.

- **Dual-Mode Backend Architecture**:
  - Persistent real-time backend connection indicator in top navigation.
  - Explicit **Demo Mode** (`VITE_DEMO_MODE=true`) serving synthetic demonstration datasets with clear disclaimers that the Z3 solver has not executed.
  - Zero mock fallback in real API mode: backend connection failures remain transparently visible with full error context.

---

## 2. Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Lucide React
- **Routing**: React Router v7
- **Data Fetching & Caching**: TanStack Query (React Query v5)
- **Charts & Data Visualization**: Recharts v3
- **Validation & Forms**: React Hook Form + Zod
- **Testing**: Vitest + React Testing Library + `@testing-library/jest-dom`

---

## 3. Getting Started

### Prerequisites

- Node.js `v18+` (Tested on Node `v22.18.0`)
- npm `v9+` (Tested on npm `10.9.3`)

### Installation

```bash
# Clone or navigate to the project directory
cd ruleforge-frontend

# Install dependencies
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available environment variables:

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Target RuleForge backend API base URL | `http://localhost:8080/api/v1` |
| `VITE_DEMO_MODE` | Enable synthetic mock data mode | `true` |

### Running Locally

```bash
# Start development server
npm run dev
```

Open your browser at `http://localhost:5173`.

### Running Tests

```bash
# Run unit and component test suites via Vitest
npm test

# Run tests in watch mode
npm run test:watch
```

### Production Build

```bash
# Typecheck and bundle with Vite
npm run build

# Preview production build
npm run preview
```

---

## 4. Expected Backend API Contract

The frontend centralizes all HTTP communication in `src/lib/api-client.ts` and domain modules in `src/api/`. It expects the following backend endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server status, uptime, and Z3 solver availability |
| `GET` | `/rulesets` | List all business rulesets |
| `POST` | `/rulesets` | Create a new draft ruleset |
| `GET` | `/rulesets/:id` | Fetch detailed ruleset with rule list and versions |
| `PUT` | `/rulesets/:id` | Update ruleset metadata or rule list |
| `POST` | `/rulesets/:id/validate` | Authoritative compiler schema and syntax validation |
| `POST` | `/rulesets/:id/evaluate` | Authoritative simulation with execution trace |
| `POST` | `/rulesets/:id/verify` | Trigger formal Z3 SMT verification |
| `POST` | `/rulesets/:id/counterfactual` | Calculate minimal-cost counterfactual inputs |
| `POST` | `/backtests` | Launch historical backtest job comparing two versions |
| `GET` | `/backtests/:id` | Poll or retrieve status of a backtesting job |
| `GET` | `/backtests/:id/export` | Export changed records to CSV format |

---

## 5. Contract Observations & Design Notes

1. **Authoritative vs. Advisory Boundaries**:
   - Client-side expression validation in `src/lib/dsl-parser.ts` is strictly advisory for immediate user feedback. Authoritative parsing and SAT/UNSAT proofs are delegated to the backend compiler.
2. **SAT vs. Conflict Classification**:
   - A condition overlap is classified separately from a conflicting outcome. When priority disambiguation resolves an overlap deterministically, it is logged as an `OVERLAP` rather than an error `CONFLICT`.
3. **Optimality Proofs**:
   - Counterfactual explanations are marked `PROVEN OPTIMAL` only when the backend solver establishes a global minimal distance under the specified metric. Otherwise, candidates are labeled as `BEST-FOUND CANDIDATE (HEURISTIC)`.
4. **Backend Failure Transparency**:
   - When Demo Mode is turned off, the frontend never masks API 500s or network drops with mock data; real errors are raised with clear connection indicators and HTTP diagnostics.
