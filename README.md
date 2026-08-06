# Textile Marketplace (B2B)

A MERN-stack B2B marketplace connecting textile suppliers with buyers.

## Stack

- **Frontend:** React (Vite) + Tailwind CSS + React Router
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (httpOnly cookie), bcrypt password hashing, role-based access control

## Project structure

```
textile-marketplace/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── api/            # axios instance + API call wrappers
│       ├── components/     # shared UI components (Navbar, etc.)
│       ├── context/        # AuthContext (global auth state)
│       ├── pages/          # route-level pages
│       └── routes/         # ProtectedRoute wrapper for role-gated routes
└── server/                 # Express backend
    ├── config/             # db connection
    ├── controllers/        # route handler logic
    ├── middleware/         # protectRoute, requireRole
    ├── models/              # Mongoose schemas: User, Product, Order, Cart
    ├── routes/             # Express routers
    └── utils/              # JWT helpers
```

## Data models

- **User** — `role: 'buyer' | 'supplier'`, email, passwordHash, profile fields (company, contact, address, and supplier-specific fields like MOQ)
- **Product** — name, category, description, colors[], specs (map), stock, price, unit, images[], supplierId, status (`available` / `out_of_stock`, auto-derived from stock)
- **Order** — buyerId, supplierId, items[] (product snapshot + qty + price), totalAmount, status, shippingInfo, timestamps
- **Cart** — buyerId (unique), items[] (productId, quantity, color)

## Getting started

### Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)

### 1. Install dependencies

```bash
npm run install:all
```

Or manually:

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

Copy the example env files and fill in your values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`server/.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/textile-marketplace
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

`client/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the app in development

In two terminals:

```bash
# Terminal 1 — API server (http://localhost:5000)
npm run dev:server

# Terminal 2 — React app (http://localhost:5173)
npm run dev:client
```

### 4. Build the frontend for production

```bash
npm run build:client
```

## 🚀 Quick Deployment

For step-by-step deployment instructions, see [QUICK_DEPLOY.md](./QUICK_DEPLOY.md).

**Quick Summary:**
1. Push code to GitHub
2. Deploy backend to Render (Web Service)
3. Deploy frontend to Vercel
4. Set environment variables
5. Test and go live!

For detailed deployment options and troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Auth flow

- `POST /api/auth/register` — creates a user (`role: buyer|supplier`), returns user + sets JWT httpOnly cookie
- `POST /api/auth/login` — verifies credentials, sets JWT httpOnly cookie
- `POST /api/auth/logout` — clears the auth cookie
- `GET /api/auth/me` — returns the current authenticated user (requires `protectRoute`)

Backend middleware:

- `protectRoute` — verifies the JWT (from cookie or `Authorization: Bearer` header) and attaches `req.user`
- `requireRole('supplier')` / `requireRole('buyer', 'supplier')` — restricts access by role

Frontend:

- `AuthContext` — holds `user`, `isAuthenticated`, `isLoading`, and `login` / `register` / `logout` methods; fetches `/api/auth/me` on load to restore session
- `ProtectedRoute` — wraps routes needing auth; pass `allowedRoles={['supplier']}` to restrict by role

## Supplier experience (Part 2)

- **Onboarding** — after a supplier registers, they're routed to `/supplier/onboarding`, a one-question-at-a-time chat-style flow (business name, type, contact info, address, hours, categories, fabric types, MOQ). Answers are saved to `User.profile` via `PUT /api/users/profile` with `completeOnboarding: true`. Suppliers can't reach the rest of `/supplier/*` until this is done (enforced by the `RequireOnboarding` route guard).
- **Dashboard** (`/supplier`) — widgets for total/active products, pending orders, recent orders, and low-stock alerts, all pulled live from `GET /api/dashboard/supplier`.
- **Inventory** (`/supplier/inventory`) — full product CRUD (`/api/products`), image upload via Multer (stored locally under `server/uploads/products`, served at `/uploads/...`), and a one-click available/out-of-stock toggle.
- **Orders** (`/supplier/orders`) — list + filter incoming orders, order detail view with a status stepper (Pending → Accepted → Preparing → Ready for Dispatch → Completed), forward-only progression enforced server-side, plus a cancel action.
- **Profile** (`/supplier/profile`) — edit business name, type, contact, address, and hours after onboarding.

All of the above routes are supplier-only, enforced both by `requireRole("supplier")` on the backend and `allowedRoles={["supplier"]}` on the frontend `ProtectedRoute`.

## Placeholder endpoints

`GET /api/cart` is still stubbed — ready for buyer cart logic in a later step.

## Health check

`GET /api/health` → `{ "status": "ok" }`

---

## AI Assistant (Part 4)

**Embeddings & Semantic Search**
- Products are embedded with `sentence-transformers/all-MiniLM-L6-v2` (384-dim) via the HuggingFace Inference API whenever a product is created or updated — fire-and-forget, non-blocking.
- `POST /api/ai/search` accepts a natural-language query, embeds it, and returns the top-8 products by cosine similarity. Falls back to keyword matching if HF is unavailable or no products are embedded yet.
- `GET /api/ai/similar/:productId` returns 5 semantically similar products (category-based fallback if not embedded).
- `GET /api/ai/recommendations` returns personalised picks based on the buyer's onboarding preferences.
- `POST /api/admin/ai/embed-all` re-embeds all products (admin-only).

**Conversational Chat — `POST /api/ai/chat`**
- Uses `mistralai/Mistral-7B-Instruct-v0.2` with product context injected into the system prompt.
- In-process response cache (up to 500 entries) reduces repeated HF calls.
- Graceful fallback: if HF is rate-limited or the API key is absent, a keyword-driven canned response is returned so the UI never breaks.

**Chat Widget (`AIChatWidget.jsx`)**
- Floating button visible on all buyer pages.
- Runs semantic search and chat in parallel, then re-queries chat with search results as grounding context.
- Related product chips link directly to product detail pages.
- Voice input: hold the 🎤 button (Web Speech API `SpeechRecognition` — Chrome/Edge).
- Voice output: toggle 🔊 to enable `speechSynthesis` read-back of AI replies.
- No external voice API — purely browser-native.

---

## Admin Panel (Part 5)

- **Role**: `admin` added to `User` enum. Admin accounts are seeded only — never self-registered.
- **Seed**: `npm run seed:admin` (in `/server`). Reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.
- **Routes** (`/api/admin/*`, all `requireRole('admin')`):
  - `GET/PATCH/DELETE /api/admin/users` — manage all users, suspend/restore/delete
  - `GET/PATCH/DELETE /api/admin/products` — full product oversight
  - `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` — view and override any order
  - `GET /api/admin/activity` — paginated, filterable activity feed
- **ActivityLog model** — `userId`, `userRole`, `action`, `targetType`, `targetId`, `meta`, `createdAt`. Written fire-and-forget from auth, product, and order controllers.
- **Admin UI** (`/admin/*`, gated by `ProtectedRoute allowedRoles={["admin"]}`):
  - Users tab — searchable, filterable by role, suspend/restore/delete inline
  - Products tab — searchable, filterable by status, delete inline
  - Orders tab — filterable by status, inline status dropdown to override any order
  - Activity Log tab — live-feed style with icons, human-readable descriptions, relative timestamps, auto-refreshes every 15s

---

## CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`) — runs on push to `main`/`develop` and on all PRs:
1. Server syntax check — `node --check` on every `.js` file
2. Client lint + build — `npm run lint && npm run build`

**Deployment Guide**

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick Deployment Summary:**

**Vercel (client deployment)**
1. Connect your GitHub repo to Vercel, set root directory to `client`
2. Framework preset: Vite
3. Add env var: `VITE_API_URL=https://your-render-service.onrender.com/api`
4. The `client/vercel.json` rewrite rule handles SPA routing automatically

**Render (server deployment)**
1. Create a new Web Service, set root directory to `server`
2. Build command: `npm install`, Start command: `npm start`
3. Add env vars (see `render.yaml`): `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `GROQ_API_KEY`, etc.
4. After deploy, run `npm run seed:admin` once via Render Shell to create the admin account
5. The `render.yaml` in the repo root documents all required vars for reference

---

## Hackathon brief coverage checklist

| Feature | Status |
|---|---|
| B2B marketplace connecting buyers and suppliers | ✅ |
| Supplier registration + role-based auth | ✅ |
| Supplier onboarding (multi-step conversational form) | ✅ |
| Supplier product CRUD with image upload | ✅ |
| Supplier order management (5-stage stepper) | ✅ |
| Supplier dashboard with real DB widgets | ✅ |
| Buyer registration + onboarding | ✅ |
| Marketplace browsing: search, filter, sort, pagination | ✅ |
| Product detail page: images, specs, colors, stock | ✅ |
| Cart (DB-persisted, buyer-only) | ✅ |
| Checkout flow (shipping → review → confirm) → creates Orders | ✅ |
| Stock decrement on checkout | ✅ |
| Buyer order history + status tracking | ✅ |
| AI: product embeddings (sentence-transformers) | ✅ |
| AI: semantic search / similar products / recommendations | ✅ |
| AI: conversational Q&A (Mistral-7B) with product context | ✅ |
| AI: graceful fallback when HF unavailable | ✅ |
| Floating chat widget across buyer pages | ✅ |
| Voice input (Web Speech API SpeechRecognition) | ✅ |
| Voice output (speechSynthesis) | ✅ |
| Admin role + seeded admin account | ✅ |
| ActivityLog model + fire-and-forget logging | ✅ |
| Admin panel: users / products / orders / activity | ✅ |
| Activity log live feed with human-readable descriptions | ✅ |
| Responsive/mobile layout (hamburger, scrollable tabs, table scroll) | ✅ |
| GitHub Actions CI (lint + build on push) | ✅ |
| Vercel + Render deploy configs documented | ✅ |
| `.env.example` for all required vars | ✅ |

**Items not implemented (scope decisions):**
- Payment gateway integration (explicitly excluded from brief)
- Email notifications (not in brief)
- Real-time websocket order updates (polling used instead)
- Product reviews/ratings (not in brief)
- Multi-image delete per-image from admin panel (supplier can do it; admin delete removes whole product)
