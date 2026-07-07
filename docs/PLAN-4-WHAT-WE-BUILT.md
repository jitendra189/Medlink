# MedLink Plan 4 — What We Built, How, and Why
> This document explains everything done in Plan 4 (the complete React frontend) in plain language.
> No prior knowledge assumed. Every decision explained from scratch.

---

## Table of Contents

1. [What Plan 4 Does](#1-what-plan-4-does)
2. [React Explained](#2-react-explained)
3. [Vite Explained](#3-vite-explained)
4. [The Design System](#4-the-design-system)
5. [Axios — Making API Calls](#5-axios--making-api-calls)
6. [React Query — Smart Data Fetching](#6-react-query--smart-data-fetching)
7. [Zustand — Global Auth State](#7-zustand--global-auth-state)
8. [Socket.IO Client — Real-time Connection](#8-socketio-client--real-time-connection)
9. [The UI Components](#9-the-ui-components)
10. [The Dashboard Layout](#10-the-dashboard-layout)
11. [React Router v6 — Navigation](#11-react-router-v6--navigation)
12. [Forms with React Hook Form + Zod](#12-forms-with-react-hook-form--zod)
13. [Auth Pages](#13-auth-pages)
14. [Patient Pages](#14-patient-pages)
15. [Hospital Pages](#15-hospital-pages)
16. [Donor Pages](#16-donor-pages)
17. [Driver Pages](#17-driver-pages)
18. [File Uploads — AvatarUpload](#18-file-uploads--avatarupload)
19. [Pagination](#19-pagination)
20. [Complete File List](#20-complete-file-list)
21. [The Visual Experience](#21-the-visual-experience)

---

## 1. What Plan 4 Does

After Plans 1–3, MedLink had a fully working **backend** — a NestJS API with 47 endpoints, a PostgreSQL database, JWT authentication, and real-time WebSocket support. But there was no way for a regular user to use it. To send an emergency SOS, you'd have to manually type a `curl` command. To see hospitals, you'd have to open Swagger.

**Plan 4 built the frontend** — the visual website that users actually see and click.

The frontend is a **React web application** that:
- Shows a professional landing page
- Lets users register and log in
- Shows different dashboards depending on your role (patient, hospital, donor, driver)
- Calls the backend API to fetch and update data
- Updates in real-time using Socket.IO (no page refresh needed)
- Works on desktop and mobile browsers

After Plan 4, opening `http://localhost:5173` shows a full website. A patient can register, send an SOS, and watch a hospital admin accept it live — all without touching a terminal.

---

## 2. React Explained

### What is React?

React is a JavaScript library created by Facebook for building user interfaces. The core idea: instead of writing HTML directly, you write **components** — reusable pieces of UI that React assembles into a page.

**Without React (plain HTML):**
```html
<div id="hospitals"></div>
<script>
  fetch('/api/v1/hospitals')
    .then(r => r.json())
    .then(data => {
      document.getElementById('hospitals').innerHTML =
        data.map(h => `<div>${h.name}</div>`).join('');
    });
</script>
```
This gets messy fast. Every time data changes you have to manually update the DOM. With dozens of pages it becomes unmanageable.

**With React:**
```tsx
function HospitalCard({ hospital }) {
  return <div>{hospital.name}</div>;
}

function HospitalsPage() {
  const { data } = useQuery({ queryKey: ['hospitals'], queryFn: hospitalsService.getAll });
  return <div>{data?.map(h => <HospitalCard key={h.id} hospital={h} />)}</div>;
}
```
React handles all the DOM updates automatically. When `data` changes, React re-renders only the parts that changed.

### What is JSX?

JSX looks like HTML but it's actually JavaScript. When you write:
```tsx
<Button variant="primary">Click me</Button>
```
React converts it to:
```js
React.createElement(Button, { variant: "primary" }, "Click me")
```
The `.tsx` file extension means TypeScript + JSX.

### Components

A component is just a function that returns JSX:
```tsx
function Spinner() {
  return <div className="animate-spin rounded-full border-4 border-brand-600" />;
}
```
Components can be used like HTML tags: `<Spinner />`.

### Props

Props are inputs to a component — like arguments to a function:
```tsx
function Badge({ variant = 'default', children }) {
  return <span className={variantClasses[variant]}>{children}</span>;
}

// Usage:
<Badge variant="success">Available</Badge>
```

### useState

`useState` stores local data inside a component. When it changes, the component re-renders:
```tsx
const [city, setCity] = useState('');
// city is the current value, setCity updates it
```

### useEffect

`useEffect` runs code after the component renders — used for connecting to sockets, fetching data, or setting up timers:
```tsx
useEffect(() => {
  const socket = getSocket();
  socket?.on('emergency:new', handleNewEmergency);
  return () => socket?.off('emergency:new'); // cleanup when unmounted
}, []); // [] means run once when mounted
```

---

## 3. Vite Explained

### What is Vite?

Vite is a development tool that does two things:
1. **Dev server** — serves your React app at `http://localhost:5173` during development
2. **Build tool** — compiles your React code into optimised HTML/CSS/JS files for production

### Why Vite is fast

Traditional tools like Webpack bundle ALL your JavaScript before starting the dev server. With 26 pages, that takes 30+ seconds on every startup.

Vite uses **native ES modules** — it serves each file individually without bundling during development. The browser requests files as needed. Result: dev server starts in under 1 second.

### Key commands

```bash
pnpm dev    # Start dev server → http://localhost:5173 (with hot reload)
pnpm build  # Create production build in dist/ folder
pnpm test   # Run Vitest tests
```

### What `pnpm build` produces

The `dist/` folder after a build:
```
dist/
├── index.html              ← The single HTML file (SPA)
└── assets/
    ├── index-xxx.js        ← React + all vendor libraries (code-split)
    ├── LandingPage-xxx.js  ← Landing page (lazy-loaded chunk)
    ├── LoginPage-xxx.js    ← Login page chunk
    └── ...                 ← One chunk per page (26 total)
```
Each page is a separate chunk. The browser only downloads a page when you navigate to it — making initial load fast.

---

## 4. The Design System

### What is Tailwind CSS?

Tailwind is a utility-first CSS framework. Instead of writing custom CSS:
```css
.my-button {
  background-color: #2563EB;
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
}
```
You apply small utility classes directly in JSX:
```tsx
<button className="bg-brand-600 text-white px-5 py-2.5 rounded-xl">
  Click me
</button>
```
This is faster to write, and you never have to switch between files.

### Our Color Palette

We chose a **navy + blue + emerald** palette — used by premium healthcare SaaS products like Vercel, Linear, and modern medical platforms.

| Token | Hex | Used for |
|-------|-----|---------|
| `navy-950` | `#020818` | Darkest background (landing page) |
| `navy-900` | `#0A1628` | Sidebar background |
| `navy-800` | `#0F2040` | Dark card backgrounds |
| `brand-600` | `#2563EB` | Primary buttons, active states, links |
| `brand-500` | `#3B82F6` | Hover states, icons |
| `brand-400` | `#60A5FA` | Light accent text |
| `emerald-500` | `#10B981` | Success states, availability, donor |
| `rose-500` | `#F43F5E` | Danger, emergencies, errors |
| `amber-500` | `#F59E0B` | Warnings, pending status |
| `surface-50–900` | Gray scale | Text, borders, backgrounds |

### Inter Font

Inter is a professional sans-serif font used by Stripe, Notion, Linear, and many top tech companies. It's loaded from Google Fonts and makes the whole UI look polished.

### Custom Tailwind Config

`tailwind.config.ts` extends Tailwind with custom values:

```ts
backgroundImage: {
  'hero-gradient': 'linear-gradient(135deg, #020818 0%, #0A1628 40%, ...)',
}
boxShadow: {
  'glow':    '0 0 30px rgba(37,99,235,0.4)',  // blue glow on hover
  'glow-sm': '0 0 15px rgba(37,99,235,0.25)', // subtle glow
}
animation: {
  'slide-up': 'slideUp 0.4s ease-out',  // content slides up on load
}
```

### Global CSS Classes (`src/index.css`)

Beyond Tailwind utilities, we defined reusable classes:

```css
.glass {
  /* Translucent card effect used on dark backgrounds */
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
}

.glass-dark {
  /* Darker glass for landing page sections */
  background: rgba(10,22,40,0.7);
  backdrop-filter: blur(20px);
}

.text-gradient {
  /* Blue-to-green gradient text for headings */
  background: linear-gradient(135deg, #60A5FA, #34D399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 5. Axios — Making API Calls

### What is Axios?

Axios is an HTTP client library — it makes API calls to the backend. You could use the browser's built-in `fetch()` but Axios has better error handling, request/response interceptors, and automatic JSON parsing.

### Our Axios Instance (`src/lib/axios.ts`)

```ts
export const api = axios.create({
  baseURL: '/api/v1',      // All requests go to /api/v1/...
  withCredentials: true,   // Send cookies (needed for refresh token)
});
```

`baseURL: '/api/v1'` means instead of writing `axios.get('http://localhost:3000/api/v1/hospitals')` everywhere, you just write `api.get('/hospitals')`.

### The Request Interceptor

This runs before EVERY request. It reads the JWT access token from localStorage and adds it to the Authorization header:

```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

So every API call automatically includes your JWT. No need to manually add headers anywhere.

### The Response Interceptor (Auto-Refresh)

This handles 401 Unauthorized errors automatically:

```ts
api.interceptors.response.use(
  (res) => res,  // Success — just return the response
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;  // Prevent infinite retry loops
      try {
        // Call refresh endpoint (sends httpOnly cookie automatically)
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        // Save new access token
        localStorage.setItem('accessToken', data.data.accessToken);
        // Retry the original failed request with new token
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        // Refresh failed — token expired, force logout
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
```

**What this means for the user:** JWT access tokens expire after 15 minutes. Without this interceptor, users would get logged out every 15 minutes. With it, the app silently gets a new token and retries — the user never notices.

### The 8 Service Files

Each service file is a thin wrapper around `api`:

```ts
// src/services/hospitals.service.ts
export const hospitalsService = {
  getAll: (params?) => api.get('/hospitals', { params }).then(r => r.data.data),
  getById: (id) => api.get(`/hospitals/${id}`).then(r => r.data.data),
  getDashboard: () => api.get('/hospitals/dashboard').then(r => r.data.data),
  // ...
};
```

Why `.then(r => r.data.data)`? Our API wraps responses: `{ success: true, data: <actual data> }`. We extract the inner `data` so pages receive clean objects.

---

## 6. React Query — Smart Data Fetching

### The Problem Without React Query

Without React Query, every page would look like this:
```tsx
function HospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    hospitalsService.getAll()
      .then(data => { setHospitals(data); setLoading(false); })
      .catch(err => { setError(err); setLoading(false); });
  }, []);

  if (loading) return <Spinner />;
  if (error) return <p>Error!</p>;
  return <div>{hospitals.map(...)}</div>;
}
```
That's 15 lines of boilerplate per page. And no caching — every navigation re-fetches everything.

### With React Query

```tsx
function HospitalsPage() {
  const { data: hospitals, isLoading } = useQuery({
    queryKey: ['hospitals'],
    queryFn: hospitalsService.getAll,
  });

  if (isLoading) return <PageSpinner />;
  return <div>{hospitals?.map(...)}</div>;
}
```
3 lines. React Query handles loading/error state, caching, background refetching.

### queryKey

The queryKey uniquely identifies a query. `['hospitals']` and `['hospitals', 'mumbai']` are different queries.

```tsx
// This caches hospitals filtered by city separately from the full list:
useQuery({
  queryKey: ['hospitals', city],
  queryFn: () => hospitalsService.getAll({ city }),
})
```

### staleTime

```ts
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
});
```

Data is "fresh" for 60 seconds. If you navigate away and come back within 60 seconds, React Query shows the cached data instantly and doesn't refetch. After 60 seconds it silently refetches in the background.

### useMutation

For creating/updating data (POST/PUT/DELETE):

```tsx
const acceptMutation = useMutation({
  mutationFn: (id: string) => emergencyService.accept(id),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['emergencies'] }),
});

// Usage:
<Button onClick={() => acceptMutation.mutate(emergency.id)} loading={acceptMutation.isPending}>
  Accept
</Button>
```

`invalidateQueries` marks the emergencies cache as stale, forcing a background refetch — so the list updates after accepting.

---

## 7. Zustand — Global Auth State

### Why We Need Global State

When a user logs in, we need the `user` object and `accessToken` available everywhere — in the Sidebar to show their name, in every page to know their role, in the Axios interceptor to attach the token.

We can't use `useState` for this because state in one component doesn't automatically flow to other components unless you pass it as props (which would require threading it through every component — "prop drilling").

Zustand is a simple global state library.

### The Auth Store (`src/stores/auth.store.ts`)

```ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        connectSocket(accessToken);  // Start Socket.IO connection
        set({ user, accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        disconnectSocket();  // Close Socket.IO connection
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'medlink-auth',  // localStorage key
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
```

### The `persist` Middleware

Without `persist`, if you refresh the page you get logged out — the state is gone.

With `persist`, Zustand saves the state to `localStorage` under the key `medlink-auth`. When the page reloads, Zustand reads localStorage and restores the state — you stay logged in.

### Usage in Components

```tsx
const { user, clearAuth } = useAuthStore();

// Show user's name:
<p>{user?.name}</p>

// Logout button:
<button onClick={clearAuth}>Logout</button>
```

---

## 8. Socket.IO Client — Real-time Connection

### Why Real-time Matters in Healthcare

Without real-time: A hospital admin would have to manually refresh the page to see new emergencies. In a real emergency, that delay costs lives.

With Socket.IO: The moment a patient sends an SOS, it appears on the hospital admin's screen instantly — no refresh.

### The Singleton Pattern (`src/lib/socket.ts`)

```ts
let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket; // Don't create a second connection
  socket = io('/', { auth: { token }, transports: ['websocket'] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
```

**Singleton** means there's only ever ONE socket connection for the whole app. Without this pattern, navigating between pages might create multiple connections to the same server — wasteful and buggy.

`auth: { token }` sends the JWT to the server when connecting so the WebSocket gateway knows who you are and which rooms to join.

### Using Sockets in Pages

```tsx
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  // Listen for new emergencies
  socket.on(SOCKET_EVENTS.EMERGENCY_NEW, () => {
    qc.invalidateQueries({ queryKey: ['emergencies'] });
  });

  // IMPORTANT: cleanup when component unmounts
  return () => {
    socket.off(SOCKET_EVENTS.EMERGENCY_NEW);
  };
}, [qc]);
```

**Why the cleanup matters:** If you navigate away from the hospital dashboard and come back, a new `socket.on` listener would be added — now you have two listeners and get duplicate updates. The `return () => socket.off(...)` removes the listener when the component unmounts.

### The 4 Real-time Flows

| Event | Who receives it | What happens |
|-------|----------------|-------------|
| `emergency:new` | Hospital Admin | Emergency queue updates instantly |
| `emergency:updated` | Patient | Status changes from pending → accepted |
| `blood:new_request` | Blood Donor | Alert appears on donor dashboard |
| `driver:location_update` | Patient tracking ambulance | Map marker moves |

---

## 9. The UI Components

### Button (`src/components/ui/Button.tsx`)

```tsx
<Button variant="primary" size="md" loading={false}>Save</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button variant="ghost" onClick={handleCancel}>Cancel</Button>
```

**5 variants:**
- `primary` — blue (#2563EB) with glow shadow. Used for main CTAs
- `secondary` — light gray. Used for secondary actions
- `danger` — red (#F43F5E). Used for destructive actions (delete, reject)
- `ghost` — no background, text only. Used for cancel/back links
- `outline` — blue border only. Used for "Get Started" on landing page

**Loading state:** When `loading={true}`, a spinning circle replaces the button text and the button is disabled — prevents double-clicks.

**forwardRef:** React Hook Form needs to attach a ref to the input element. `forwardRef` passes this through the component.

### Input (`src/components/ui/Input.tsx`)

```tsx
<Input
  id="email"
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  error={errors.email?.message}  // Shows red error below
  {...register('email')}          // React Hook Form connection
/>
```

When `error` is set, the border turns red and the error message appears below. This is the standard professional form pattern.

### Card (`src/components/ui/Card.tsx`)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Hospital Dashboard</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content here</p>
  </CardContent>
</Card>
```

White rounded container with subtle shadow. Cards organise content into distinct sections — used everywhere on dashboards.

### Badge (`src/components/ui/Badge.tsx`)

```tsx
<Badge variant="success" dot>Available</Badge>
<Badge variant="danger">Rejected</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">Confirmed</Badge>
```

Pill-shaped coloured labels. The `dot` prop adds a small coloured circle — useful for status indicators (like a green dot for "online").

**Colour meanings:**
- `success` (emerald) — active, available, confirmed, fulfilled
- `warning` (amber) — pending, waiting
- `danger` (rose) — rejected, cancelled, unavailable, errors
- `info` (blue) — informational status

### StatsCard (`src/components/ui/StatsCard.tsx`)

```tsx
<StatsCard
  icon={BedDouble}
  label="ICU Beds Available"
  value={12}
  accent="emerald"
  trend={{ direction: 'up', value: '+3 today' }}
/>
```

The standard dashboard metric card: icon + label + large number + optional trend arrow. Used on every dashboard to show key metrics at a glance.

### Spinner + PageSpinner (`src/components/ui/Spinner.tsx`)

```tsx
<Spinner />        // Small spinner for inline loading
<PageSpinner />    // Full-screen centered spinner
```

Shown while data is being fetched. Every page has `if (isLoading) return <PageSpinner />` so users see a spinner instead of an empty page.

### Modal (`src/components/ui/Modal.tsx`)

```tsx
<Modal isOpen={showAddDoctor} onClose={() => setShowAddDoctor(false)} title="Add Doctor">
  <form>...</form>
</Modal>
```

Dark overlay + white centered box. Escape key closes it. Body scroll is locked while open. Used on the Doctors page for the "Add Doctor" form.

### Pagination (`src/components/ui/Pagination.tsx`)

```tsx
<Pagination page={page} totalPages={12} onPageChange={setPage} />
```

Shows page numbers with ellipsis for large ranges (e.g., `1 2 3 … 10 11 12`). Prev/Next arrow buttons. Active page is highlighted blue. Returns `null` if `totalPages <= 1` so it disappears when not needed.

### AvatarUpload (`src/components/ui/AvatarUpload.tsx`)

```tsx
<AvatarUpload
  currentUrl={user?.avatarUrl}
  initials="JS"
  onUpload={(url) => handleAvatarChange(url)}
  size="lg"
/>
```

Shows either a profile photo or gradient circle with initials. Camera icon button in the corner opens a file picker. When a file is selected, `FileReader` immediately shows a preview (before upload). Then uploads to the API and calls `onUpload` with the URL.

---

## 10. The Dashboard Layout

### How It Works

Every dashboard page (patient, hospital, donor, driver) uses the same layout:

```
┌─────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌───────────────────────────────────┐ │
│  │          │  │  Topbar (breadcrumb + bell + user) │ │
│  │ Sidebar  │  ├───────────────────────────────────┤ │
│  │          │  │                                   │ │
│  │ MedLink  │  │   Page Content (<Outlet />)        │ │
│  │ logo     │  │                                   │ │
│  │ nav links│  │                                   │ │
│  │          │  │                                   │ │
│  │ user     │  │                                   │ │
│  │ logout   │  │                                   │ │
│  └──────────┘  └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

`DashboardLayout.tsx`:
```tsx
export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6 lg:p-8 animate-fade-in">
            <Outlet />  {/* ← Current page renders here */}
          </div>
        </main>
      </div>
    </div>
  );
}
```

**`<Outlet />`** is a React Router concept — it renders whatever child route is currently active. When you navigate to `/patient/hospitals`, the `Outlet` renders `HospitalsPage`. When you go to `/patient/emergency`, it renders `EmergencyPage`. The Sidebar and Topbar stay constant.

### Sidebar (`src/components/layout/Sidebar.tsx`)

Dark navy (bg-navy-900) sidebar, 256px wide. Contains:
1. **Logo area** — HeartPulse icon + "MedLink" text
2. **Navigation links** — different per role using `linksByRole[user.role]`
3. **User section** — name, role, and logout button at the bottom

Active link gets `bg-brand-600 text-white` — the blue highlight shows where you are. Inactive links are gray and turn lighter on hover.

### Topbar (`src/components/layout/Topbar.tsx`)

Sticky top bar with:
- **Breadcrumb** — reads the URL path and shows "Patient / Hospitals" style titles
- **Notification bell** — with a red dot (notifications not yet wired to real count)
- **User avatar** — gradient circle with initials

---

## 11. React Router v6 — Navigation

### What is Client-Side Routing?

Traditional websites: every link click sends a request to the server which returns a new HTML page. The browser fully reloads.

React: one HTML page loads once. When you click a link, JavaScript changes what's shown — no full reload. This is called a **Single Page Application (SPA)**.

### How Routes are Defined (`src/router/index.tsx`)

```tsx
export const router = createBrowserRouter([
  { path: '/', element: wrap(LandingPage) },
  { path: '/login', element: wrap(LoginPage) },
  {
    // This wraps all patient routes with DashboardLayout + ProtectedRoute
    element: <ProtectedRoute allowedRoles={[Role.PATIENT]}><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/patient/dashboard', element: wrap(PatientDashboard) },
      { path: '/patient/hospitals', element: wrap(PatientHospitals) },
      { path: '/patient/hospitals/:id', element: wrap(PatientHospitalDetail) },
      // ...
    ],
  },
]);
```

### Lazy Loading

```tsx
const PatientDashboard = lazy(() => import('../pages/patient/DashboardPage'));
```

`lazy()` means: don't download this page's JavaScript until someone navigates to `/patient/dashboard`. With 26 pages, this keeps the initial bundle small (only LandingPage and auth pages download on first visit).

`wrap()` wraps each lazy component in a Suspense boundary:
```tsx
const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<PageSpinner />}><Component /></Suspense>
);
```
While the page JavaScript is downloading, `<PageSpinner />` is shown.

### ProtectedRoute (`src/router/ProtectedRoute.tsx`)

```tsx
export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Wrong role — redirect to own dashboard
    const redirects = {
      patient: '/patient/dashboard',
      hospital: '/hospital/dashboard',
      donor: '/donor/dashboard',
      driver: '/driver/dashboard',
    };
    return <Navigate to={redirects[user.role]} replace />;
  }

  return <>{children}</>;
}
```

**What this prevents:**
- A non-logged-in user visiting `/patient/dashboard` → redirected to `/login`
- A blood donor trying to visit `/hospital/dashboard` → redirected to `/donor/dashboard`

---

## 12. Forms with React Hook Form + Zod

### What is React Hook Form?

Managing forms in React naively (using `useState` for every field) means a re-render on every keystroke. With 5 fields that's 5x more re-renders than necessary.

React Hook Form manages form state internally without React state — forms don't re-render while you type. Only validation errors cause re-renders.

### What is Zod?

Zod is a schema validation library. You define the shape and rules of your data:

```ts
const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  role: z.nativeEnum(Role),
});
```

Zod also infers the TypeScript type automatically: `type FormData = z.infer<typeof schema>`.

### How They Work Together

```tsx
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),  // Zod validates on submit
});

// Connecting an input to the form:
<Input
  {...register('email')}  // Attaches onChange, onBlur, ref
  error={errors.email?.message}
/>

// Submitting:
<form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
```

`handleSubmit` runs the Zod schema validation first. If valid, calls your function with the typed data. If invalid, populates `errors` and the form shows error messages — without ever calling your function.

---

## 13. Auth Pages

### LandingPage (`src/pages/LandingPage.tsx`)

The first thing every visitor sees. Dark navy background (`bg-navy-950`) with glowing orb decorations (blurred circles using `blur-3xl`).

Sections:
1. **Sticky navbar** — MedLink logo, nav links, Login + Get Started buttons
2. **Hero** — Large gradient headline, subtext, two CTAs, floating stat pills ("500+ Hospitals", "10K+ Donors")
3. **Stats bar** — Glass card with 4 numbers (hospitals, donors, response time, cities)
4. **How it works** — 4 numbered steps in dark cards
5. **Role cards** — 4 cards (Patient, Hospital, Donor, Driver) each with gradient icon
6. **Features grid** — 6 feature tiles
7. **CTA banner** — "Ready to save lives?" with Register button
8. **Footer** — Logo, links, copyright

### LoginPage (`src/pages/auth/LoginPage.tsx`)

**Split layout:** dark navy panel on the left (hidden on mobile), white form on the right.

Left panel: MedLink branding, a quote about healthcare, floating stats card.
Right panel: Email + password inputs, "Forgot password?" link, Sign In button.

On successful login, `useMutation` calls `authService.login()`. The `onSuccess` handler calls `setAuth(user, token)` then navigates to the correct dashboard based on `user.role`.

### RegisterPage (`src/pages/auth/RegisterPage.tsx`)

Same split layout. The key difference: instead of a dropdown for role selection, there are 4 **clickable role cards** — each with an icon, title, and description. The selected card gets a blue border. This is more intuitive and visually impressive.

Password strength: the Zod regex requires uppercase + lowercase + number, and the error message tells the user exactly what's missing.

### ForgotPasswordPage (`src/pages/auth/ForgotPasswordPage.tsx`)

User enters their email. On submit, `authService.forgotPassword(email)` calls `POST /auth/forgot-password`. The API always returns the same success message whether the email exists or not — this prevents **email enumeration** (an attacker figuring out which emails are registered).

After submit, a success card replaces the form: "Check your email. (For this demo, check the API console for the reset link.)"

### ResetPasswordPage (`src/pages/auth/ResetPasswordPage.tsx`)

Reads the `token` query parameter from the URL: `/reset-password?token=abc123...`.

If no token: shows an error card with a "Request new link" button.

If token present: shows password + confirm password fields. On submit, calls `authService.resetPassword(token, newPassword)`. On success, shows a confirmation and redirects to `/login` after 3 seconds.

---

## 14. Patient Pages

### Dashboard (`src/pages/patient/DashboardPage.tsx`)

```
"Good morning, Amit 👋  —  Tuesday, 7 July 2026"

[Hospitals: 5] [ICU Available: 60] [Blood Donors: 6] [Active Requests: 1]

[🔴 Emergency SOS] [🔵 Find Hospitals] [🟠 Request Blood] [🟢 Book Doctor]

Recent Activity: ...
```

4 `StatsCard` components showing live counts from `hospitalsService.getAll()` and `bloodService.searchDonors()`.

4 large colored quick-action tiles — each is a `Link` to the relevant page. Big enough to tap on mobile.

### Hospitals (`src/pages/patient/HospitalsPage.tsx`)

Search bar (filters by city when you press Enter or click Search), ICU Available toggle button, paginated grid of hospital cards.

Each card shows: hospital name, city/state, phone, ICU beds badge (green if available, red if none), bed totals, doctor count, ambulance count.

Clicking a card navigates to `HospitalDetailPage`.

### Hospital Detail (`src/pages/patient/HospitalDetailPage.tsx`)

Uses `useParams` to get the hospital ID from the URL: `/patient/hospitals/:id`.

```tsx
const { id } = useParams<{ id: string }>();
const { data: hospital } = useQuery({ queryKey: ['hospital', id], queryFn: () => hospitalsService.getById(id!) });
```

Shows resource stats (4 StatsCards), address, phone, then a grid of doctor cards with availability badges.

### ICU Finder (`src/pages/patient/IcuFinderPage.tsx`)

Calls `hospitalsService.getAll({ icuAvailable: true })` — the backend filters to hospitals with `icuBedsAvailable > 0`. Shows as a list with ICU count prominently displayed.

### Blood Page (`src/pages/patient/BloodPage.tsx`)

Two-column layout:
- **Left:** 8 blood group buttons (A+, A-, B+, B-, AB+, AB-, O+, O-). Clicking one filters donors.
- **Right:** Create blood request form (blood group, units required, urgency).

Donor cards show blood group badge, donor name, city, availability dot.

### Emergency Page (`src/pages/patient/EmergencyPage.tsx`)

Large pulsing red SOS button. Disabled until GPS is acquired (`navigator.geolocation.getCurrentPosition`). When GPS is ready, button activates.

On click, calls `emergencyService.create({ type, patientLat, patientLng })`. The new request appears in the "My Requests" list below with a "pending" badge.

Socket.IO listener on `SOCKET_EVENTS.EMERGENCY_UPDATED` automatically refreshes the list when the hospital accepts/rejects — the badge changes from amber to green in real-time.

### Bookings (`src/pages/patient/BookingsPage.tsx`)

Shows patient's bookings with filter tabs (All/Pending/Confirmed/Completed/Cancelled).

Each booking card: doctor name + specialization, hospital name, date/time, status badge, cancel button (if pending).

### Prescriptions (`src/pages/patient/PrescriptionsPage.tsx`)

List of prescriptions. Each card shows: issue date, doctor name, medications list (each with name, dosage, frequency). An "Attach document" button lets patients upload PDF/image files via `uploadService.uploadPrescription`.

### Profile (`src/pages/patient/ProfilePage.tsx`)

`AvatarUpload` component at the top — tap the camera icon to change profile photo. Below it: user info (name, email, role) in a clean card layout.

---

## 15. Hospital Pages

### Dashboard (`src/pages/hospital/DashboardPage.tsx`)

Most complex page in the app:

```
[Name of Hospital]

[ICU Available: 12] [ICU Total: 50] [Ambulances: 4] [Doctors: 120]

Pending Emergency Requests (2)
┌──────────────────────────────────────────────────────┐
│ ICU Emergency • Patient: Amit Sharma • 2m ago         │
│ Location: 19.076, 72.877                              │
│ [Accept]  [Reject]                                    │
└──────────────────────────────────────────────────────┘
```

`useEffect` connects a `SOCKET_EVENTS.EMERGENCY_NEW` listener. When a patient sends SOS anywhere, the emergency queue here updates instantly — `queryClient.invalidateQueries(['emergencies'])` triggers a background refetch.

Clicking Accept → `emergencyService.accept(id)` → invalidates queries → card disappears from pending list.

### Emergencies Page

Full emergency management table with filter tabs (All/Pending/Accepted/Resolved/Cancelled). Each row has action buttons matching the current status.

### Bookings Page

Incoming bookings from patients. Confirm/Complete/Cancel actions per booking. Shows patient name, doctor, scheduled time.

### Doctors Page

Left column: list of current doctors with availability badges. Right column: "Add Doctor" modal form (name + specialization). On submit, calls `api.post('/doctors', { name, specialization, hospitalId })`.

### Resources Page

Update ICU beds, ambulances. Shows current values as placeholders. On submit, calls `hospitalsService.updateResources(data)` which updates the hospital's resource counts.

### Profile Page

Hospital's name, city, state, phone in a clean card. Plus `AvatarUpload` for the admin's profile photo.

---

## 16. Donor Pages

### Dashboard (`src/pages/donor/DashboardPage.tsx`)

```
Donor Dashboard          [● Available] [Toggle Availability]

[Blood Group: O+] [Total Donations: 5] [Lives Saved: 5]

Pending Blood Requests Matching Your Type
┌────────────────────────────────────────┐
│ Blood Group: O+  •  2 units  •  CRITICAL│
│ [Fulfill]                               │
└────────────────────────────────────────┘
```

Socket.IO listener on `SOCKET_EVENTS.BLOOD_NEW_REQUEST` — when any patient creates a blood request matching this donor's blood group, it appears here instantly.

Toggle Availability button calls `bloodService.toggleAvailability()` — toggles the donor's `isAvailable` field.

Fulfill button calls `bloodService.fulfill(requestId)` — marks the request as fulfilled, increments totalDonations.

### Requests Page

All pending blood requests matching the donor's blood type. Urgency badges (CRITICAL=red, MEDIUM=amber, LOW=green) prioritize which requests need attention first.

### History Page

All past fulfilled requests — the donor's donation timeline.

### Profile Page

Blood group displayed prominently with `AvatarUpload`. Availability toggle.

---

## 17. Driver Pages

### Dashboard (`src/pages/driver/DashboardPage.tsx`)

```
Driver Dashboard         [● On Duty] [🔋 Go Off Duty]

┌──────────────────────────────────┐
│ 📍 Location sharing active       │
│    Updating every 5 seconds      │
└──────────────────────────────────┘

Nearby Emergency Requests
```

The most technically interesting page:

```tsx
useEffect(() => {
  if (isOnDuty) {
    locationInterval.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        // REST call to update DB:
        ambulanceService.updateLocation(pos.coords.latitude, pos.coords.longitude);
        // Socket emit to broadcast to tracking patients:
        socket?.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }, 5000); // Every 5 seconds
  } else {
    clearInterval(locationInterval.current);
  }
  return () => clearInterval(locationInterval.current);
}, [isOnDuty]);
```

When On Duty: every 5 seconds the browser gets GPS coordinates and sends them to the API (persisted to DB) AND emits them via Socket.IO (delivered to any patient tracking this driver in real-time).

---

## 18. File Uploads — AvatarUpload

### How File Upload Works

1. User clicks the camera icon → hidden `<input type="file">` opens
2. User selects a photo
3. `FileReader.readAsDataURL(file)` converts the file to a base64 string for **instant preview** — the image appears before upload
4. `FormData` wraps the file: `formData.append('file', file)`
5. Axios POST with `Content-Type: multipart/form-data` sends to `/api/v1/uploads/avatar`
6. Backend (Multer) saves the file to `uploads/` folder, returns `{ url: '/api/v1/uploads/files/filename.jpg' }`
7. `onUpload(url)` is called — the parent component updates the user's `avatarUrl`
8. On profile pages, `setAuth({ ...user, avatarUrl: url }, accessToken)` updates Zustand state

**File size limit:** 2MB for avatars, 5MB for prescriptions (set in the Multer config on the backend).

**Allowed formats:** JPEG, PNG, GIF for avatars; JPEG, PNG, GIF, PDF for prescriptions.

---

## 19. Pagination

### Why Pagination?

Without pagination, `GET /hospitals` returns ALL hospitals. When there are 500 hospitals in the database, that's 500 rows fetched, sent over the network, and rendered in the browser — slow and wasteful.

With pagination, you fetch 10 at a time: page 1 = first 10, page 2 = next 10, etc.

### The Backend Response

```json
{
  "data": [...10 hospitals...],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Frontend State

```tsx
const [page, setPage] = useState(1);

const { data } = useQuery({
  queryKey: ['hospitals', search, icuOnly, page],  // page in key!
  queryFn: () => hospitalsService.getAll({ page, limit: 9 }),
  keepPreviousData: true,  // Show old data while new page loads
});

const hospitals = data?.data ?? [];
const meta = data?.meta;
```

`keepPreviousData: true` means when you click "Next Page", the current hospitals stay visible while the next page loads — no flicker.

### Pagination Component

```tsx
<Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
```

Shows: `← 1 2 3 … 10 11 12 →`

The windowed algorithm shows a maximum of 5 page numbers centred around the current page, with ellipsis (`…`) for gaps.

---

## 20. Complete File List

### New Files Created in Plan 4

**Core Libraries & Config:**
- `apps/web/tailwind.config.ts` — custom colors, fonts, shadows, animations
- `apps/web/src/index.css` — global styles, glass effects, text-gradient
- `apps/web/index.html` — Inter font link added

**Utilities:**
- `apps/web/src/utils/cn.ts` — clsx + tailwind-merge helper

**Infrastructure (lib/):**
- `apps/web/src/lib/axios.ts` — Axios instance + interceptors
- `apps/web/src/lib/query-client.ts` — React Query client
- `apps/web/src/lib/socket.ts` — Socket.IO singleton

**State:**
- `apps/web/src/stores/auth.store.ts` — Zustand auth store

**Services (8 files):**
- `apps/web/src/services/auth.service.ts`
- `apps/web/src/services/hospitals.service.ts`
- `apps/web/src/services/emergency.service.ts`
- `apps/web/src/services/blood.service.ts`
- `apps/web/src/services/bookings.service.ts`
- `apps/web/src/services/prescriptions.service.ts`
- `apps/web/src/services/ambulance.service.ts`
- `apps/web/src/services/notifications.service.ts`
- `apps/web/src/services/upload.service.ts`

**UI Components (9 files):**
- `apps/web/src/components/ui/Button.tsx`
- `apps/web/src/components/ui/Input.tsx`
- `apps/web/src/components/ui/Card.tsx`
- `apps/web/src/components/ui/Badge.tsx`
- `apps/web/src/components/ui/Spinner.tsx`
- `apps/web/src/components/ui/Modal.tsx`
- `apps/web/src/components/ui/StatsCard.tsx`
- `apps/web/src/components/ui/Pagination.tsx`
- `apps/web/src/components/ui/AvatarUpload.tsx`

**Layout Components (3 files):**
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/web/src/components/layout/Topbar.tsx`
- `apps/web/src/components/layout/DashboardLayout.tsx`

**Router:**
- `apps/web/src/router/index.tsx` — all routes with lazy loading
- `apps/web/src/router/ProtectedRoute.tsx` — role-based route guard

**Pages (26 files):**
- `src/pages/LandingPage.tsx`
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/RegisterPage.tsx`
- `src/pages/auth/ForgotPasswordPage.tsx`
- `src/pages/auth/ResetPasswordPage.tsx`
- `src/pages/patient/DashboardPage.tsx`
- `src/pages/patient/HospitalsPage.tsx`
- `src/pages/patient/HospitalDetailPage.tsx`
- `src/pages/patient/IcuFinderPage.tsx`
- `src/pages/patient/BloodPage.tsx`
- `src/pages/patient/EmergencyPage.tsx`
- `src/pages/patient/BookingsPage.tsx`
- `src/pages/patient/PrescriptionsPage.tsx`
- `src/pages/patient/ProfilePage.tsx`
- `src/pages/hospital/DashboardPage.tsx`
- `src/pages/hospital/EmergenciesPage.tsx`
- `src/pages/hospital/BookingsPage.tsx`
- `src/pages/hospital/DoctorsPage.tsx`
- `src/pages/hospital/ResourcesPage.tsx`
- `src/pages/hospital/ProfilePage.tsx`
- `src/pages/donor/DashboardPage.tsx`
- `src/pages/donor/RequestsPage.tsx`
- `src/pages/donor/HistoryPage.tsx`
- `src/pages/donor/ProfilePage.tsx`
- `src/pages/driver/DashboardPage.tsx`
- `src/pages/driver/RequestsPage.tsx`
- `src/pages/driver/HistoryPage.tsx`
- `src/pages/driver/ProfilePage.tsx`

---

## 21. The Visual Experience

Here is the complete journey through the MedLink frontend:

### 1. Landing Page (http://localhost:5173)
Dark navy page with floating blue and emerald glowing orbs. Large gradient headline: "Emergency Healthcare, **Instantly Connected**" (last two words in blue-to-green gradient). Three floating pills below the hero: "500+ Hospitals", "10K+ Donors", "24/7 Emergency Response". Below the hero, a glass card with 4 stats. Then "How it works" steps, role cards with gradient icons, features grid, CTA banner, and footer.

### 2. Register Page
Click "Get Started Free". Split screen: dark left panel with MedLink branding, white right panel with registration form. 4 clickable role cards — click "Patient" and it gets a blue border. Fill name, email, password, click "Create Account".

### 3. Patient Dashboard
Redirected to `/patient/dashboard`. Greeting: "Good morning, Amit 👋". 4 white stat cards showing counts. 4 large colored tiles:
- Red tile → Emergency SOS
- Blue tile → Find Hospitals
- Orange tile → Request Blood
- Green tile → Book Doctor

### 4. Hospitals Page
Click "Find Hospitals". Search bar at top. 9 hospital cards in a grid (paginated). Each card shows name, location, phone, ICU badge. Pagination numbers at the bottom: `1 2 3 4 5`.

### 5. Emergency Test (Multi-tab Real-time Demo)
1. In Tab 1 (logged in as Patient): go to Emergency page. Large pulsing red circle. "Getting location..." becomes "Send SOS Alert" once GPS is ready.
2. In Tab 2: register and log in as Hospital Admin (`apollo_hospital@medlink.demo`). Go to Hospital Dashboard. Emergency queue shows "0 pending".
3. In Tab 1: click "Send SOS Alert".
4. In Tab 2 (no refresh): emergency appears in the queue instantly. Click "Accept".
5. Back in Tab 1: the SOS status changes from amber "pending" to green "accepted" — in real-time.

This 5-second demo is the most impressive thing to show to companies reviewing the project.

---

*End of Plan 4 Learning Guide*
