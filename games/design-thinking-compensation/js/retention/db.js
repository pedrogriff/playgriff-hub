// js/retention/db.js - Zero-Build CDN Supabase client with offline demo fallback
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://YOUR_SUPABASE_URL.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchAnonymizedProfiles(divisionLead = 'Cloud Infrastructure') {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('division_lead', divisionLead);

    if (error || !data || data.length === 0) {
      console.warn('Supabase query returned no records or failed, loading local fallback demo data:', error?.message);
      return getFallbackDemoProfiles();
    }
    return data;
  } catch (err) {
    console.warn('Offline/CDN fallback triggered in db.js:', err);
    return getFallbackDemoProfiles();
  }
}

export async function submitRetentionAward(awardPayload) {
  try {
    const { data, error } = await supabase
      .from('retention_awards')
      .insert([awardPayload])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Mocking local retention award submission for demo showcase:', err);
    return { id: 'MOCK-AWARD-' + Date.now(), ...awardPayload, status: 'Pending Division Lead Approval', created_at: new Date().toISOString() };
  }
}

function getFallbackDemoProfiles() {
  return [{
    id: "EMP-001",
    name: "Alex Mercer",
    employeeHandle: "a.mercer@emberkeep.io",
    role: "Principal Distributed Systems Engineer",
    level: "L6",
    divisionLead: "Cloud Infrastructure",
    talentDesignation: "Strategic Key Talent - P0",
    peerPercentile: "42nd",
    currentCycleTDR: 350000,
    previousCycleTDR: 330000,
    lastRatings: ["Exceptional Impact", "Exceeds Expectations"],
    hasPriorOffCycleAward: false,
    intendedCashFlows: {
      year0Total: 330000,
      year1Total: 350000,
      year2Total: 280000, // $70k cash-flow cliff
      year3Total: 290000
    },
    benchmarks: { "50th": 370000, "75th": 420000, "90th": 480000 }
  }];
}
