-- =============================================================
-- Kukoo (FP-2026) - Supabase PostgreSQL Schema & Auth Setup
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff' CHECK (role IN ('Admin', 'Staff', 'Veterinarian')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of profiles for authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 2. Trigger to automatically create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Batches (Flocks)
CREATE TABLE IF NOT EXISTS public.batches (
  id BIGSERIAL PRIMARY KEY,
  batch_name TEXT NOT NULL,
  shed_name TEXT NOT NULL,
  hen_count INTEGER NOT NULL CHECK (hen_count >= 0),
  initial_hen_count INTEGER NOT NULL CHECK (initial_hen_count >= 0),
  breed TEXT NOT NULL,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Culled', 'Sold', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users to read batches" ON public.batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to insert batches" ON public.batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update batches" ON public.batches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to delete batches" ON public.batches FOR DELETE TO authenticated USING (true);

-- 4. Feed Stock
CREATE TABLE IF NOT EXISTS public.feed_stock (
  id BIGSERIAL PRIMARY KEY,
  feed_type TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'Tons',
  supplier TEXT NOT NULL,
  date_received DATE NOT NULL,
  batch_id BIGINT REFERENCES public.batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feed_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users on feed_stock" ON public.feed_stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Feed Consumption
CREATE TABLE IF NOT EXISTS public.feed_consumption (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  feed_type TEXT NOT NULL,
  quantity_used NUMERIC(10, 2) NOT NULL CHECK (quantity_used > 0),
  unit TEXT NOT NULL DEFAULT 'Tons',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feed_consumption ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users on feed_consumption" ON public.feed_consumption FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Egg Production
CREATE TABLE IF NOT EXISTS public.egg_production (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  eggs_collected INTEGER NOT NULL CHECK (eggs_collected >= 0),
  eggs_damaged INTEGER NOT NULL DEFAULT 0 CHECK (eggs_damaged >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.egg_production ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users on egg_production" ON public.egg_production FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Vaccinations
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  dosage TEXT NOT NULL DEFAULT '0.5ml Eye-drop',
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Administered', 'Overdue')),
  administered_by TEXT,
  administered_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users on vaccinations" ON public.vaccinations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Health Records
CREATE TABLE IF NOT EXISTS public.health_records (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  date_observed DATE NOT NULL,
  symptoms TEXT NOT NULL,
  diagnosed_disease TEXT NOT NULL,
  treatment_given TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Under Treatment' CHECK (status IN ('Under Treatment', 'Recovered', 'Critical', 'Closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users on health_records" ON public.health_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Daily Operations Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id BIGSERIAL PRIMARY KEY,
  task_description TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users on tasks" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Optional Seed Data for Instant Exploration
INSERT INTO public.batches (batch_name, shed_name, hen_count, initial_hen_count, breed, start_date, status)
VALUES
  ('Alpha Layers 01', 'Shed A - BioSecure Layer Bay', 5000, 5200, 'BV 300 White', '2026-01-10', 'Active'),
  ('Bravo Pullets 02', 'Shed B - Controlled Environment', 4500, 4500, 'Hy-Line Brown', '2026-02-01', 'Active'),
  ('Charlie Broilers 03', 'Shed C - Eco Flow Aviary', 3200, 3200, 'Cobb 500 Fast-Grow', '2026-02-15', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO public.feed_stock (feed_type, quantity, unit, supplier, date_received, batch_id)
VALUES
  ('Layer Crumble Plus (18% CP)', 24.5, 'Tons', 'Godrej Agrovet Supreme Feed', '2026-03-01', 1),
  ('Pullet Grower Mash (16% CP)', 18.0, 'Tons', 'Kargill Precision Nutrition', '2026-03-05', 2),
  ('Broiler Finisher Pellets', 12.5, 'Tons', 'Shanthi Feeds Ltd', '2026-03-10', 3)
ON CONFLICT DO NOTHING;
