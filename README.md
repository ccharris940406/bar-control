# Bar Control

A full-featured bar management system built with Next.js 16 and Supabase. Handles daily operations including cash register management, sales tracking, inventory control, purchasing, and expense reporting — with a dedicated mobile-optimized interface for waitstaff.

## Features

- **Dashboard** — Real-time overview of daily sales, expenses, cash register status, and inventory alerts
- **Cash Register** — Open/close register with balance validation and full session history
- **Sales** — Cart-based sales with ingredient tracking, payment method selection, and thermal ticket printing (58mm)
- **Products** — Full catalog management with soft delete and category organization
- **Inventory** — Two-tier stock system (warehouse boxes → cooler units) with low-stock alerts
- **Purchases** — Flexible purchase logging with configurable units per box
- **Expenses** — Expense tracking linked to cash register sessions
- **Reports** — Daily summary of sales, expenses, and net balance
- **Analytics** — Bar charts with weekly, monthly, and yearly views for sales vs expenses
- **Waitress Interface** — Mobile-optimized ordering screen at `/mesera` with ingredient support

## Auth & Roles

Authentication is handled via Supabase Auth with proxy-level route protection.

| Role | Access |
|------|--------|
| `admin` | Full access to all features |
| `encargado` | Same as admin, excluding user management |
| `mesera` | Waitress interface only (`/mesera`) |

## Tech Stack

- **Framework** — Next.js 16 (App Router, Server Components)
- **Database** — Supabase (PostgreSQL)
- **Auth** — Supabase Auth with `@supabase/ssr`
- **Styling** — Tailwind CSS + shadcn/ui
- **Charts** — Recharts
- **Package Manager** — pnpm

## Getting Started

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to the login page.

## Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Profiles table with role-based access
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL DEFAULT 'mesera'
    CHECK (role IN ('admin', 'encargado', 'mesera')),
  name text
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, role) VALUES (new.id, 'mesera');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

Create your first admin user in Supabase → Authentication → Users, then assign the role:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';
```

## Deployment

Deploy to Vercel with one click. Add your environment variables in the Vercel dashboard and configure the Supabase Auth redirect URLs to match your production domain.
