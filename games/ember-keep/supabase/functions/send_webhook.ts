// ================================================================
// EMBER KEEP — Supabase Edge Function: Discord Webhook Notification System
// File: supabase/functions/send_webhook.ts
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  event: string;
  account_id: string;
  character_name?: string;
  details?: Record<string, unknown>;
}

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // SECURITY: Verify JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const payload: WebhookPayload = await req.json();
    const { event, account_id, character_name, details } = payload;

    if (!account_id || !event) {
      return new Response(JSON.stringify({ error: "Missing account_id or event" }), { status: 400, headers: CORS_HEADERS });
    }

    // SECURITY: Ensure the authenticated user matches the account_id in the payload
    if (user.id !== account_id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: account_id does not match authenticated user" }),
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Build Discord Rich Embed
    let title = "🔥 Ember Keep Notification";
    let color = 0xf59e0b; // Gold
    let description = `Event triggered: **${event}**`;

    if (event === "dungeon_mastered") {
      title = "👑 Dungeon Mastered!";
      color = 0xf59e0b; // Gold
      const dName = details?.dungeonName || "a Dungeon";
      const floors = details?.floorCount || 10;
      description = `**${character_name || "Hero"}** conquered & mastered **${dName}** (${floors} Floors Defeated)!`;
    } else if (event === "rebirth") {
      title = "🔥 Glorious Ember Rebirth!";
      color = 0xef4444; // Red/Fire
      description = `**${character_name || "Hero"}** ignited a Rebirth and earned **+1 Ember Shard**!`;
    } else if (event === "rift_kill") {
      title = "🐲 World Rift Boss Defeated!";
      color = 0x8b5cf6; // Purple
      description = `The server has slayed the World Boss! Hero **${character_name || "Hero"}** dealt the final blow!`;
    } else if (event === "bounty_completed") {
      title = "📦 The King's Bounty Completed!";
      color = 0x10b981; // Green
      description = `Community target achieved! **+15% Gold & Drop Rate Buff** unlocked for 24 Hours!`;
    } else if (event === "hearth_visit") {
      title = "🏡 Hearth Ignited!";
      color = 0x38bdf8; // Cyan
      description = `A friend visited your Hearth! Both heroes gained **+15% Production Speed** for 2 Hours!`;
    }

    const discordBody = {
      embeds: [
        {
          title,
          description,
          color,
          footer: { text: "Ember Keep Engine Notification" },
          timestamp: new Date().toISOString()
        }
      ]
    };

    return new Response(JSON.stringify({ success: true, embed: discordBody }), {
      headers: CORS_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
});
