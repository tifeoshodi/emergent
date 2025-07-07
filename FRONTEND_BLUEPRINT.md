# PMFusion – Frontend Blueprint

> A practical guide to refactoring the current proof-of-concept UI into a modern, maintainable, and delightful experience.

---

## 1. Product Vision
PMFusion is an EPC-focused project-/document-/resource-management platform.  The frontend must empower **Schedulers**, **Discipline Teams**, **DCC Officers**, **Clients**, and **Admins** to collaborate across three phases: *Project Creation → Teams Execution → Document Control*.

Success Criteria  
•  Intuitive navigation between phases & roles  
•  Realtime feedback (drag-&-drop, live updates)  
•  Sub-1 s interactions on broadband; > 90 Lighthouse perf  
•  WCAG 2.1 AA accessibility  
•  Modular codebase enabling new views in < ½ day  

---

## 2. High-Level Stack
| Concern               | Choice                                        | Notes |
|-----------------------|----------------------------------------------|-------|
| Framework            | **Next.js 15 (Pages Router)**               | Already present – migrate to App Router later. |
| Language              | TypeScript 5                                 | Incrementally adopt via `*.tsx` renames. |
| Styling               | Tailwind 4 + shadcn/ui                       | Design tokens via CSS variables for disciplines. |
| Data-layer            | Supabase JS v2 (+ Realtime), Axios ➜ **TanStack Query** | Normalised cache & optimistic updates. |
| State (client)        | React Context now ➜ **Zustand** for lightweight/global, **React Query** for async. |
| Forms / Validation    | react-hook-form + zod                        | Consistent UX, instant validation. |
| Drag & Drop           | @hello-pangea/dnd                            | Replace deprecated react-beautiful-dnd. |
| Charts                | recharts or nivo                             | Energy to pick later. |
| Animations            | framer-motion                                | Replace missing `tw-animate-css`. |
| Testing               | Jest 30 + RTL, Cypress for e2e              | Already partially configured. |
| Lint/Format           | ESLint 9, Prettier                           | Extend next config. |
| CI/CD                 | GitHub Actions → build, test, lint, Docker   | Publish to Vercel / Fly.io. |

---

## 3. Current Pain-Points
1. **Monster files** (`src/pages/index.js` > 1 k lines) – hard to reason, no code-splitting.  
2. Hard-coded **`REACT_APP_*` env vars** – not exposed in Next 15; causes *`supabaseUrl is required`*.  
3. Missing Tailwind utilities (`px-3`, `tw-animate-css`) & 404 route bundles.
4. No role-based routing / layout shells – every page re-implements nav.
5. Untyped JS; brittle API calls; no optimistic UI; repetitive `axios` logic.
6. CSS variables only for discipline colours – rest of tokens missing.

---

## 4. Proposed Folder Structure (feature-sliced)
```text
frontend/
└─ src/
   ├─ app/                 # migrate to App Router later
   ├─ features/            # domain modules (Kanban, WBS, DCC…)
   │   ├─ kanban/
   │   │   ├─ components/
   │   │   ├─ hooks/
   │   │   └─ api.ts
   │   ├─ projects/
   │   ├─ tasks/
   │   └─ dashboard/
   ├─ components/          # shared (Button, Card…)
   │   ├─ ui/              # shadcn cloned primitives
   │   └─ layout/
   ├─ hooks/               # cross-feature logic (useAuth, useQuery…)
   ├─ lib/                 # supabase, axios instance, constants
   ├─ pages/               # keep Pages Router while migrating
   ├─ styles/              # global.css, tokens.css
   └─ types/               # zod schemas & TS types
```

---

## 5. Core Modules
### 5.1 Auth & Layout
* `AuthProvider` wraps `QueryClientProvider` + `ThemeProvider`.  
* Layout shells: `DashboardLayout`, `AuthLayout`, `PublicLayout` with role guards.

### 5.2 API Layer
* `lib/api.ts` exports `axiosInstance` with interceptor adding `X-User-ID`.  
* Feature modules expose typed functions (`getProjects()`) returning zod-parsed data.  
* Supabase realtime hooks ➜ `useRealtimeChannel(table, callback)`.

### 5.3 UI Kit
* shadcn ui primitives; extended via `tailwind.config.js`.  
* Design tokens in `styles/tokens.css` (spacing, font, z-index).  
* `clsx` + `tailwind-merge` for variant classes.

### 5.4 Pages / Views
| Route                | Layout              | Component                       | Notes |
|----------------------|---------------------|---------------------------------|-------|
| `/login`             | `AuthLayout`        | `LoginForm`                     | Supabase magic link & demo ID field |
| `/dashboard`         | `DashboardLayout`   | `ProjectOverview`, KPI cards    | Queries `/api/dashboard/stats` |
| `/projects`          | `DashboardLayout`   | `ProjectTable`, `CreateWizard`  | Modal wizard per workflow spec |
| `/projects/[id]`     | `ProjectLayout`     | Tabs: Gantt, WBS, Resources     | Suspense boundaries |
| `/tasks`             | `DashboardLayout`   | `KanbanBoard`                   | Drag-drop with optimistic reordering |
| `/dcc`               | `DashboardLayout`   | `DCCQueue`, `OutboundTracker`   | Badge counts via realtime |

---

## 6. Styling & Theming
* Tailwind 4 with `@layer` technique for utility additions.  
* Remove unknown classes (`px-3` → `px-3` **exists**; error comes from CSS Module – fix by scoping).  
* Replace `tw-animate-css` with framer-motion variants.

**Discipline colour tokens**
```css
:root {
  --discipline-mech: #ff7352;
  --discipline-elec: #2d9cdb;
  /* … */
}
```
Used via `text-[color:var(--discipline-mech)]` utilities (Tailwind arbitrary values).

---

## 7. Accessibility & Internationalisation
* All interactive elements keyboard navigable.  
* `aria-live` announcements for drag-drop.  
* RTL support prepared by using logical CSS properties.

---

## 8. Quality & Tooling
* **ESLint + Prettier** enforced in pre-commit via Husky.  
* **Jest + RTL** for unit tests; **Cypress** for e2e flows (`login → create project → board move`).  
* **Storybook** for UI kit regression.  
* **GitHub Actions**: `pnpm install`, `lint`, `test`, `docker build`, push image.  
* **Playwright** visual regression in later phase.

---

## 9. Performance & Observability
* Code-splitting by route & dynamic imports for heavy charts.  
* React 19 automatic memo; `useTransition` for large lists.  
* Lazy load Supabase only after auth.  
* Instrumentation via **Vercel Analytics** + Sentry.

---

## 10. Migration Roadmap
| Phase | Goal | Key Tasks |
|-------|------|-----------|
| 0 | **Stabilise** | Fix Tailwind unknown-class & missing module errors; ensure pages build. |
| 1 | **UI Kit & Tokens** | Extract shadcn primitives, set up tokens, replace inline styles, purge dead CSS. |
| 2 | **Feature Slices** | Break `index.js` into `features/*`; add React Query, Zustand, zod types. |
| 3 | **Realtime & Optimism** | Channel subscriptions for Kanban & DCC; optimistic drag-drop; offline queue. |
| 4 | **App Router** | Migrate to `/app` directory; leverage React Server Components for heavy dashboards. |
| 5 | **Polish & PWA** | Add app-shell loading, service-worker, push notifications. |

---

## 11. Immediate Next Steps (Week 1)
1. **Fix Build Errors** – remove `tw-animate-css` import and unknown utility.  
2. **Introduce TypeScript** – rename `src/pages/_app.js` → `*.tsx`, set `strict: true`.  
3. **Bootstrap UI Kit** – extract existing `ui/*` into `@/components/ui`, migrate to shadcn scaffolder.  
4. **Scaffold Feature Folders** – create `features/kanban/`, move KanbanBoard.
5. **Add React Query** – install, set `QueryClientProvider` in `_app`.  

---

> With this blueprint we have a clear, phased path from the current prototype to a production-grade, state-of-the-art frontend. 