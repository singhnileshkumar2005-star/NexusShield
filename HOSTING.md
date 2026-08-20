# NexusSecure Cloud Hosting & Deployment Guide ($0 Cost, No Credit Card)

This guide shows you exactly **where and how to host every component of NexusSecure** for **$0 forever** without needing a credit card.

---

## 🗺️ Architecture & Hosting Overview

| Component | What it is | Recommended Free Host | Cost & Card Requirement |
| :--- | :--- | :--- | :--- |
| **1. Database & Auth** | Managed PostgreSQL + RLS Schema | **Supabase Free Tier** | **$0** (No credit card needed) |
| **2. Hub Coordinator** (`apps/hub`) | Node.js / TypeScript REST & SSE API | **Render.com Free Web Service** | **$0** (No credit card needed) |
| **3. Admin Dashboard** (`apps/admin-dashboard`) | Next.js 14 Central Ops Dashboard | **Vercel Hobby Tier** | **$0** (No credit card needed) |
| **4. Site Owner Portal** (`apps/site-portal`) | Next.js 14 Client Site Portal | **Vercel Hobby Tier** | **$0** (No credit card needed) |
| **5. Protected Websites** (`@nexussecure/agent`) | Your existing websites | Wherever they currently live | Embedded in your existing apps |

---

## Step 1: Set Up Free Database on Supabase (2 Minutes)

1. Go to **[supabase.com](https://supabase.com)** and click **"Start your project"** (Sign in with GitHub).
2. Click **"New Project"**, name it `NexusSecure`, set a strong database password, and choose your preferred region.
3. Once created, go to the **SQL Editor** tab on the left menu.
4. Open the file [`supabase/migrations/20260819_nexus_secure_schema.sql`](./supabase/migrations/20260819_nexus_secure_schema.sql) from your repository, paste its contents into the SQL Editor, and click **"Run"**.
5. Go to **Project Settings** -> **API**:
   - Copy your **Project URL** (`https://xyzcompany.supabase.co`).
   - Copy your **service_role (secret) key** (`eyJhbGci...`).

---

## Step 2: Host the Hub Coordinator on Render (3 Minutes)

1. Go to **[render.com](https://render.com)** and sign in with GitHub (no credit card required).
2. Click **"New +"** -> **"Web Service"**.
3. Connect your repository: `singhnileshkumar2005-star/NexusShield`.
4. Configure the settings:
   - **Name:** `nexussecure-hub`
   - **Region:** Same as your Supabase database (e.g. Frankfurt, Oregon, Singapore).
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm --workspace=packages/agent run build && npm --workspace=apps/hub run build`
   - **Start Command:** `node apps/hub/dist/server.js`
   - **Instance Type:** `Free` ($0/month)
5. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
6. Click **"Create Web Service"**.
7. Once deployed, copy your live Hub URL (e.g., `https://nexussecure-hub.onrender.com`).

---

## Step 3: Host the Dashboards on Vercel (3 Minutes)

Vercel provides instant 1-click deployments for Next.js with automatic SSL and zero configuration.

### A. Deploy Admin Dashboard (`apps/admin-dashboard`)
1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub (no credit card needed).
2. Click **"Add New..."** -> **"Project"**.
3. Select your `NexusShield` repository and click **Import**.
4. In the Project Configuration:
   - **Project Name:** `nexussecure-admin`
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and select `apps/admin-dashboard`.
5. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_HUB_URL=https://nexussecure-hub.onrender.com
   ```
   *(Use your live Render Hub URL from Step 2)*
6. Click **"Deploy"**.

---

### B. Deploy Client Site Owner Portal (`apps/site-portal`)
1. In Vercel, click **"Add New..."** -> **"Project"**.
2. Select your `NexusShield` repository again and click **Import**.
3. In the Project Configuration:
   - **Project Name:** `nexussecure-portal`
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and select `apps/site-portal`.
4. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_HUB_URL=https://nexussecure-hub.onrender.com
   ```
5. Click **"Deploy"**.

---

## Step 4: Protect Your Live Websites

Now that your Hub and Dashboards are live on the web:

1. Open your live **Client Site Owner Portal** (e.g., `https://nexussecure-portal.vercel.app/setup`).
2. Click **"+ Add Website"** and copy your generated **Site API Key** (`nx_live_...`).
3. Add the `@nexussecure/agent` middleware to your website:

### Next.js Website (`middleware.ts`)
```typescript
import { nexusSecureNext } from '@nexussecure/agent';

export const middleware = nexusSecureNext({
  apiKey: process.env.NEXUS_API_KEY!,
  hubUrl: process.env.NEXUS_HUB_URL || 'https://nexussecure-hub.onrender.com',
  siteName: 'My Live Website'
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
```

### Express.js Website (`server.js`)
```javascript
import express from 'express';
import { nexusSecureExpress } from '@nexussecure/agent';

const app = express();

app.use(nexusSecureExpress({
  apiKey: process.env.NEXUS_API_KEY,
  hubUrl: process.env.NEXUS_HUB_URL || 'https://nexussecure-hub.onrender.com',
  siteName: 'My Live Website'
}));
```

---

## 🐳 Alternative: 1-Click Self-Hosting with Docker (Any VPS)

If you have a Linux VPS (or an **Oracle Cloud Always-Free VM** with 4 ARM cores + 24GB RAM free forever):

1. Clone your repository on the server:
   ```bash
   git clone https://github.com/singhnileshkumar2005-star/NexusShield.git
   cd NexusShield
   ```
2. Start the entire mesh with Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
3. Your services are now live:
   - **Hub API:** `http://your-server-ip:3000`
   - **Admin Dashboard:** `http://your-server-ip:3010`
   - **Site Portal:** `http://your-server-ip:3020`
