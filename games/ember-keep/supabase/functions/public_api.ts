// ================================================================
// EMBER KEEP — Supabase Edge Function: Read-Only Public Community API
// File: supabase/functions/public_api.ts
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    if (path.endsWith("/leaderboard")) {
      return new Response(JSON.stringify({
        status: "success",
        leaderboard: [
          { rank: 1, name: "Valerius Flame", class: "Warrior", level: 30, power: 12500 },
          { rank: 2, name: "Shadowbane", class: "Ranger", level: 29, power: 11800 },
          { rank: 3, name: "Ember Queen", class: "Mage", level: 28, power: 10900 }
        ]
      }), { headers });
    }

    if (path.endsWith("/rift/current")) {
      return new Response(JSON.stringify({
        status: "success",
        boss_name: "Malakor the Ember Tyrant",
        total_hp: 10000000000,
        current_hp: 7500000000,
        active: true
      }), { headers });
    }

    return new Response(JSON.stringify({
      version: "v1",
      endpoints: [
        "/api/v1/leaderboard",
        "/api/v1/rift/current",
        "/api/v1/market/prices"
      ]
    }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
});
