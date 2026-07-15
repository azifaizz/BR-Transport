
# BR Transport Management System — Build Plan

Frontend-only build in Lovable. Backend (Spring Boot + MySQL) is yours to implement; I'll ship a documented REST contract the UI expects. We'll go module by module and I'll stop for your approval after each.

## Stack (what I'll actually build)

- **React 19 + TypeScript + Vite** (via TanStack Start, Lovable's template)
- **TanStack Router** for routing and protected routes (equivalent to React Router; same mental model)
- **Axios** with a central client + JWT interceptor
- **React Hook Form + Zod** for forms and validation
- **shadcn/ui + Tailwind v4** for the enterprise UI (chosen over MUI: lighter, fully themable to your navy + amber palette, already wired in Lovable)
- **TanStack Query** for server state, caching, pagination
- **Env-driven API base URL** (`VITE_API_BASE_URL`) so the same build points at local Spring Boot in dev and your deployed API in prod

Why not MUI: shadcn gives us the same component coverage, is easier to theme to a distinctive navy/amber enterprise look, and avoids MUI's runtime CSS-in-JS cost. If you'd rather use MUI, say the word before I start.

## Module roadmap (module-by-module, approval gates)

1. **Project structure + API contract + Auth** ← *this module*
2. Dashboard layout (top navbar + collapsible sidebar + content area, responsive)
3. Bill Generation form
4. Generated Bills table (search, sort, pagination, view/edit/delete)
5. Settings placeholder
6. Polish pass (empty states, error boundaries, 404, loading skeletons)

I stop after each module.

---

## Module 1 — what I'll build now

### Folder structure

```text
src/
  routes/                     # TanStack file-based routes
    __root.tsx                # shell + providers
    index.tsx                 # redirects: authed → /dashboard, else → /login
    login.tsx                 # public login page
    _authenticated.tsx        # route guard (redirects to /login if no token)
    _authenticated.dashboard.tsx        # placeholder (built in Module 2)
  lib/
    api/
      client.ts               # axios instance + JWT interceptor + 401 handler
      auth.ts                 # login(), logout(), me()
      bills.ts                # (stubs for Module 3/4)
    auth/
      auth-context.tsx        # AuthProvider + useAuth() hook
      token-storage.ts        # localStorage wrapper (access + refresh)
    validation/
      schemas.ts              # zod schemas shared with forms
  components/
    ui/                       # shadcn primitives
    forms/                    # reusable Field, FormRow, SubmitButton
  hooks/
  styles.css                  # navy + amber design tokens (oklch)
API_CONTRACT.md               # what your Spring Boot must implement
.env.example                  # VITE_API_BASE_URL=http://localhost:8080
```

### Design tokens (navy + amber)

Defined once in `src/styles.css` as semantic tokens; no hardcoded colors in components.

- `--primary` deep navy (~oklch 0.25 0.06 260)
- `--accent` amber (~oklch 0.78 0.16 75)
- Neutral slate surface, white cards, subtle shadows, 8px radius
- Inter for body, a slightly tighter display face for headings (not Poppins)

### Auth flow

- `/login` — email + password, RHF + Zod, POSTs `/api/auth/login`, stores `accessToken` (+ optional `refreshToken`) in localStorage, redirects to `/dashboard`.
- `_authenticated` layout — reads token, calls `/api/auth/me` once via TanStack Query; while pending shows a full-page loader; on 401 clears token and redirects to `/login`.
- Axios interceptor — attaches `Authorization: Bearer <token>`; on 401 clears session and bounces to `/login`.
- Logout — clears storage, invalidates queries, redirects.
- Session persistence — token in localStorage; auth context rehydrates on load.

No role logic; single Admin.

### REST contract your Spring Boot must expose (Module 1 subset)

```text
POST /api/auth/login
  body:    { email: string, password: string }
  200:     { accessToken: string, refreshToken?: string, user: { id, email, name } }
  401:     { message: string }

GET  /api/auth/me         (Bearer)
  200:     { id, email, name }
  401:     unauthorized

POST /api/auth/logout     (Bearer, optional server-side)
  204
```

All errors: `{ message: string, errors?: Record<string, string> }`, standard HTTP codes. CORS must allow the Lovable preview origin during dev.

I'll write `API_CONTRACT.md` at the repo root with request/response shapes, status codes, and the full endpoint list for later modules (bills CRUD with pagination/sort/search) so you can scaffold the Spring side in parallel.

### Confirmed from your answers

- Backend: **frontend-only**, wired to your Spring Boot via `VITE_API_BASE_URL`
- Admin account: **you create it manually** after backend is up (I'll document the expected shape)
- Style: **navy + amber logistics**
- Bill field confirmed so far: **Party Name** (I'll ask for the full field list at the start of Module 3)

## What I won't do in Module 1

- No dashboard UI yet (Module 2)
- No bill forms or tables yet (Modules 3–4)
- No mock/fake data — if backend isn't running, login will show a real network error, as intended

## After Module 1 you'll be able to

1. Run `npm run dev` against your local Spring Boot on `http://localhost:8080`
2. Log in with a real admin you created in MySQL
3. Land on a protected placeholder `/dashboard`
4. Get bounced to `/login` when the token is missing/expired

Approve this and I'll build Module 1.
