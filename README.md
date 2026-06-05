# Smart Project & Task Collaboration System

A premium, full-stack project and task coordination dashboard that helps teams manage projects, assign tasks, optimize workloads, and track progress with real-time feedback, task validation, and detailed analytics.

---

## 🌐 Live Deployed Links

*   **Frontend Client:** [https://smart-collaborate-frontend.vercel.app](https://smart-collaborate-frontend.vercel.app)
*   **Backend API Server:** [https://smart-collaborate-server.vercel.app](https://smart-collaborate-server.vercel.app)

---

## 🚀 Key Features

### 1. Robust Role-Based Access Control (RBAC)
*   **Admin:** Full system access (manage all projects, view analytics, add members, tasks, delete items).
*   **Project Manager:** Create and manage projects, assign tasks, view team workloads, and add project members.
*   **Team Member:** Personalized dashboard to update assigned task statuses only.

### 2. Smart Validation & Conflict Detection
*   **Due Date Limit:** Tasks cannot have a due date exceeding the project's end date.
*   **Overload Warnings:** Real-time notifications and alerts (non-blocking) when assigning more than **3 active tasks** (`IN_PROGRESS`) to a single user.

### 3. Rich Analytics & Insights
*   **KPI Cards:** Track Total Projects, Active Projects, Pending Tasks, and Completed Tasks.
*   **Task Status Distribution:** Interactive pie chart representing status allocation.
*   **Project Progress Hub:** Progress bars detailing completion rates for each project.
*   **Recent Activity Log:** Live feed detailing recent modifications across the workspace.
*   **Upcoming Deadlines:** Lists tasks across all assigned projects due within the next 48 hours.

### 4. Productivity Features
*   **My Tasks View:** Customized board grouping team members' tasks.
*   **Search, Filter, Sort, Pagination:**
    *   Search projects by title and tasks by title/description.
    *   Filter by priority, status, assignee, and project.
    *   Sort tasks by due date or priority.
    *   Full server-side pagination for listings.
*   **Dark & Light Mode Support** with persistent preference settings.
*   **Sandbox Demo Login:** Instantly login with pre-configured credentials for Admin, PM, and Member roles.

---

## 🛠️ Technology Stack

*   **Frontend:** Next.js (App Router), Redux Toolkit (RTK Query), Tailwind CSS, Lucide Icons, Recharts, Sonner.
*   **Backend:** Node.js, Express.js, TypeScript.
*   **Database & ORM:** PostgreSQL / SQLite with Prisma ORM.

---

## ⚙️ Local Setup Instructions

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### 1. Setup Backend Server
Navigate to the `server/` directory:
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory and configure your Postgres database connection:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=supersecretkey123
DATABASE_URL="postgresql://username:password@localhost:5432/db_name?schema=public"
```

Run database migrations and seed default records:
```bash
npx prisma migrate dev
```

Start the development backend server:
```bash
npm run dev
```

### 2. Setup Frontend Application
Navigate to the `frontend/` directory:
```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

Start the development Next.js app:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your browser.

---

## 🔑 Sandbox Credentials
Use the **Quick Sandbox Login** buttons on the login screen to sign in instantly, or manually use:
*   **Admin:** `admin@smart.com` / `demo123Password`
*   **Project Manager:** `pm@smart.com` / `demo123Password`
*   **Team Member:** `member@smart.com` / `demo123Password`
 
---
 
## 🌐 Deployment Instructions
 
This full-stack system is designed to be easily deployed to modern cloud platforms:
 
### 1. Backend Server Deployment (e.g., Render, Railway, or Heroku)
1. Provision a production PostgreSQL instance (e.g., Neon Postgres, Supabase, or Render Postgres).
2. Connect your repository and select the `/server` folder.
3. Configure the following environment variables in your hosting provider's panel:
   *   `NODE_ENV=production`
   *   `JWT_SECRET=your_production_secret_key`
   *   `DATABASE_URL="your_production_connection_url"`
   *   `DIRECT_URL="your_production_direct_migration_url"` (if using Neon connection pooler)
4. Add the following **Build Command** to automatically execute migrations:
   ```bash
   npx prisma migrate deploy
   ```
5. Set the **Start Command** to:
   ```bash
   npm run start
   ```
 
### 2. Frontend Client Deployment (e.g., Vercel or Netlify)
1. Connect your repository to Vercel and select the `/frontend` folder.
2. In the environment variables settings, add:
   *   `NEXT_PUBLIC_API_BASE_URL=https://your-deployed-backend-api.com/api/v1`
3. Vercel automatically detects Next.js build configuration:
   *   **Build Command:** `npm run build`
   *   **Output Directory:** `.next`
4. Click **Deploy**!
