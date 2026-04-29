# AGENTS.md - Frontend-Bar-React

## Commands
- `npm run dev` — Vite dev server (port 5173 default)
- `npm run build` — `tsc -b && vite build` (type-check first, then bundle)
- `npm run lint` — ESLint (tsc not included)
- `npm run preview` — Preview production build

## Stack
- React 19 + TypeScript + Vite 7
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin, no config file)
- `@vitejs/plugin-react-swc` for Fast Refresh (not Babel)
- React Router v7 (framework mode, not v6)
- Lucide React for icons

## Architecture
- **Single repo** (not monorepo)
- **Entry**: `src/main.tsx` → `src/App.tsx` (routes) → `src/components/layout/Layout.tsx`
- **Feature-based folders**: `src/features/` (auth, products, websocket) with context/component split
- **Pages**: `src/pages/` (admin, public, orders, menu, cart)

## Auth & Layout Behavior
- **Roles**: `ADMIN`, `WAITER` (backend sends `ROLE_ADMIN`, `ROLE_WAITER`)
- **Layout auto-renders by role** (`src/components/layout/Layout.tsx`):
  - `ADMIN` → sidebar (fixed, 256px) + no header
  - Non-admin → header with role-based nav
- **Sidebar links** defined in `Layout.tsx` (`ADMIN_SIDEBAR_LINKS`)
- **Protected routes** use `<ProtectedRoute>` wrapper in `App.tsx`

## API
- **Base URL**: `http://localhost:8090` (override with `VITE_API_BASE_URL` env var)
- **Config**: `src/config/api.ts` — all endpoints typed, use `API_ENDPOINTS.*`
- **Client**: axios instance in `src/config/api.ts`

## Gotchas
- **No tests** — no test files, no test runner configured
- **Build order matters**: `tsc -b` runs before `vite build` (see package.json scripts)
- **Env vars**: Vite requires `VITE_` prefix for client-side exposure
- **Recharts** used for dashboard charts (not Chart.js or similar)
- **WebSocket**: STOMP/SockJS for real-time order updates (`@stomp/stompjs` + `sockjs-client`)

## Conventions
- **Components**: PascalCase files (e.g., `AdminDashboard.tsx`)
- **CSS**: Tailwind utility classes (no CSS modules or styled-components)
- **Sidebar changes**: Edit `ADMIN_SIDEBAR_LINKS` in `Layout.tsx`, not per-page
- **Auth checks**: Use `useAuth()` hook, check `user?.roles?.includes('ADMIN')`
