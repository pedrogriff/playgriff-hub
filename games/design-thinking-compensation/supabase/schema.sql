-- supabase/schema.sql - 100% Anonymized PostgreSQL Schema & RLS

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_handle TEXT UNIQUE NOT NULL,      -- e.g., a.mercer@emberkeep.io
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  level TEXT NOT NULL,
  division_lead TEXT NOT NULL,
  talent_designation TEXT NOT NULL,
  peer_percentile TEXT NOT NULL,
  current_cycle_tdr NUMERIC(12,2) NOT NULL,
  previous_cycle_tdr NUMERIC(12,2) NOT NULL,
  intended_cash_flows JSONB NOT NULL,
  benchmarks JSONB NOT NULL,
  has_prior_off_cycle_award BOOLEAN DEFAULT false,
  prior_off_cycle_award_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.retention_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_handle TEXT REFERENCES public.employees(employee_handle) ON DELETE CASCADE,
  grant_amount NUMERIC(12,2) NOT NULL,
  target_percentile TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  justification TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to employees" 
  ON public.employees FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to awards" 
  ON public.retention_awards FOR SELECT USING (true);

CREATE POLICY "Allow authenticated division leads to insert awards" 
  ON public.retention_awards FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated division leads to update awards" 
  ON public.retention_awards FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- For public interactive showcase: Allow anonymous visitors to submit demo awards
CREATE POLICY "Allow anonymous insert access to awards" 
  ON public.retention_awards FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to awards" 
  ON public.retention_awards FOR UPDATE USING (true) WITH CHECK (true);

-- Fallback Demo Data Insert
INSERT INTO public.employees (
  employee_handle, name, role, level, division_lead, talent_designation, peer_percentile, current_cycle_tdr, previous_cycle_tdr, intended_cash_flows, benchmarks
) VALUES (
  'a.mercer@emberkeep.io',
  'Alex Mercer',
  'Principal Distributed Systems Engineer',
  'L6',
  'Cloud Infrastructure',
  'Strategic Key Talent - P0',
  '42nd',
  350000,
  330000,
  '{"year0Total": 330000, "year1Total": 350000, "year2Total": 280000, "year3Total": 290000}'::jsonb,
  '{"50th": 370000, "75th": 420000, "90th": 480000}'::jsonb
) ON CONFLICT (employee_handle) DO NOTHING;
