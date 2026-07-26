// ================================================================
// EMBER KEEP — Supabase Client & Auth Database Module (db.js)
// Native ES Module
// ================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ixlfhisrxmsmkwciynys.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bGZoaXNyeG1zbWt3Y2l5bnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NjM1OTQsImV4cCI6MjEwMDIzOTU5NH0.MRTrcX--xxdSeud2eG4i2x4r-c9LCkPWLfrnPcHXbr8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * AUTH HELPERS
 */

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * DATABASE HELPERS: ACCOUNT & CHARACTERS
 */

export async function getAccountProfile() {
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("accounts_profile")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCharacters() {
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("account_id", user.id)
    .order("slot_index", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCharacter(slotIndex, name, classId) {
  const user = await getUser();
  if (!user) throw new Error("User not authenticated");

  const newChar = {
    account_id: user.id,
    slot_index: slotIndex,
    name: name,
    class_id: classId,
    level: 1,
    exp: 0,
    max_exp: 100,
    stamina: 100,
    max_stamina: 100,
    mana: classId === "Mage" ? 100 : classId === "Paladin" ? 70 : 50,
    max_mana: classId === "Mage" ? 100 : classId === "Paladin" ? 70 : 50,
    hp: classId === "Warrior" ? 120 : classId === "Paladin" ? 140 : 100,
    max_hp: classId === "Warrior" ? 120 : classId === "Paladin" ? 140 : 100,
    power: classId === "Mage" ? 15 : classId === "Ranger" ? 12 : 10,
    defense: classId === "Warrior" ? 8 : classId === "Paladin" ? 10 : 5,
    gold: 50,
    gems: 0,
    skill_points: 0,
    allocated_stats: { hp: 0, power: 0, defense: 0 },
    house: { tier: 0, name: "No Housing", slots: [], decorations: [] },
    inventory: [
      { id: "potion_hp_small", name: "Small HP Potion", type: "consumable", qty: 3, icon: "🧪", value: 30 }
    ],
    equipped: { weapon: null, armor: null, ring: null },
    professions: {
      mining: { level: 1, xp: 0 },
      woodcutting: { level: 1, xp: 0 },
      fishing: { level: 1, xp: 0 },
      smelting: { level: 1, xp: 0 },
      cooking: { level: 1, xp: 0 },
      alchemy: { level: 1, xp: 0 },
      forge: { level: 1, xp: 0 },
    },
    location_node: "greenhollow"
  };

  const { data, error } = await supabase
    .from("characters")
    .insert([newChar])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveCharacter(charData) {
  if (!charData || !charData.id) return null;

  const updates = {
    level: charData.level,
    exp: charData.exp || charData.xp || 0,
    max_exp: charData.max_exp || charData.maxXp || 100,
    stamina: charData.stamina,
    hp: charData.hp,
    gold: charData.gold,
    gems: charData.gems,
    power: charData.power,
    defense: charData.defense,
    skill_points: charData.skillPoints !== undefined ? charData.skillPoints : charData.skill_points || 0,
    allocated_stats: charData.allocatedStats || charData.upgrades || charData.allocated_stats || { hp: 0, power: 0, defense: 0 },
    house: charData.house || { tier: 0, name: "No Housing", slots: [], decorations: [] },
    unlocked_level: charData.unlockedLevel || charData.unlocked_level || 1,
    completed_side_zones: charData.completedSideZones || charData.completed_side_zones || [],
    inventory: charData.inventory,
    equipped: charData.equipped,
    professions: charData.professions,
    location_node: charData.locationNode || charData.location_node || "greenhollow",
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from("characters")
      .update(updates)
      .eq("id", charData.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    if (err && (err.code === "PGRST204" || (err.message && err.message.includes("completed_side_zones")))) {
      delete updates.completed_side_zones;
      delete updates.unlocked_level;
      const { data, error } = await supabase
        .from("characters")
        .update(updates)
        .eq("id", charData.id)
        .select()
        .single();
      if (!error) return data;
    }
    throw err;
  }
}

export async function deleteCharacter(characterId) {
  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", characterId);

  if (error) throw error;
  return true;
}

/**
 * SERVER TIME & IDLE TASK HELPERS (PHASE 2)
 */

export async function getServerTime() {
  try {
    const { data, error } = await supabase.rpc("get_server_time");
    if (!error && data) {
      return new Date(data).getTime();
    }
  } catch (err) {
    console.warn("Supabase RPC get_server_time failed, falling back to local time:", err);
  }
  return Date.now();
}

export async function startTask(characterId, taskType, targetId, durationSeconds, foodAmount = 0) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  // 1. Cancel any existing running tasks for this character to enforce single active task
  try {
    await supabase
      .from("active_tasks")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("character_id", characterId)
      .eq("status", "running");
  } catch (e) {
    console.warn("Could not clear existing active tasks:", e);
  }

  // 2. Insert new running task
  const newTask = {
    character_id: characterId,
    task_type: taskType || "mining",
    target_id: targetId || taskType || "default_target",
    started_at: new Date().toISOString(),
    duration_seconds: durationSeconds || 0,
    allocated_food: foodAmount || 0,
    status: "running"
  };

  const { data, error } = await supabase
    .from("active_tasks")
    .insert([newTask])
    .select()
    .single();

  if (error) {
    console.error("Error starting active task in Supabase:", error);
    throw error;
  }
  return data;
}

export async function getActiveTasks(characterIdList = []) {
  const validIds = (characterIdList || []).filter(id => typeof id === "string" && id.includes("-"));
  if (validIds.length === 0) return [];

  const { data, error } = await supabase
    .from("active_tasks")
    .select("*")
    .in("character_id", validIds)
    .eq("status", "running");

  if (error) {
    console.error("Error fetching active tasks from Supabase:", error);
    return [];
  }
  return data || [];
}

export async function claimTaskRewards(taskId) {
  if (!taskId) return null;

  const { data, error } = await supabase
    .from("active_tasks")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error claiming task rewards in Supabase:", error);
    return null;
  }
  return data;
}

/**
 * INVENTORY & ATOMIC REWARD CLAIM HELPERS (PHASE 3)
 */

export async function getCharacterInventory(characterId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return [];

  const { data, error } = await supabase
    .from("character_inventories")
    .select("*")
    .eq("character_id", characterId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching character inventory from Supabase:", error);
    return [];
  }
  return data || [];
}

export async function claimTaskRewardsRPC(characterId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("claim_task_rewards", {
      p_character_id: characterId
    });

    if (error) {
      console.error("Error calling claim_task_rewards RPC:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Failed to execute claim_task_rewards RPC:", err);
    return null;
  }
}

/**
 * EQUIPMENT ATOMIC RPC HELPERS (PHASE 4)
 */

export async function equipItemRPC(characterId, inventoryItemId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("equip_item", {
      p_character_id: characterId,
      p_inventory_item_id: inventoryItemId
    });

    if (error) {
      console.error("Error executing equip_item RPC:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("equip_item RPC execution failed:", err);
    throw err;
  }
}

export async function unequipItemRPC(characterId, slotName) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("unequip_item", {
      p_character_id: characterId,
      p_slot_name: slotName
    });

    if (error) {
      console.error("Error executing unequip_item RPC:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("unequip_item RPC execution failed:", err);
    throw err;
  }
}

/**
 * DUNGEON & COMBAT ATOMIC RPC HELPERS (PHASE 5)
 */

export async function getDungeonProgress(characterId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return [];

  const { data, error } = await supabase
    .from("dungeon_progress")
    .select("*")
    .eq("character_id", characterId);

  if (error) {
    console.error("Error fetching dungeon progress from Supabase:", error);
    return [];
  }
  return data || [];
}

export async function runDungeonEncounterRPC(characterId, dungeonId, floor) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("run_dungeon_encounter", {
      p_character_id: characterId,
      p_dungeon_id: dungeonId,
      p_floor: floor
    });

    if (error) {
      console.error("Error executing run_dungeon_encounter RPC:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("run_dungeon_encounter RPC execution failed:", err);
    throw err;
  }
}

/**
 * PROFESSIONS & CRAFTING ATOMIC RPC HELPERS (PHASE 6)
 */

export async function craftItemRPC(characterId, recipeId, amount = 1) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("craft_item", {
      p_character_id: characterId,
      p_recipe_id: recipeId,
      p_amount: amount
    });

    if (error) {
      console.error("Error executing craft_item RPC:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("craft_item RPC execution failed:", err);
    throw err;
  }
}

/**
 * SHOP & LOOT EXPANSION ATOMIC RPC HELPERS
 */

export async function getShopInventoryRPC(characterId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return [];

  try {
    const { data, error } = await supabase.rpc("get_shop_inventory", {
      p_character_id: characterId
    });

    if (error) {
      console.error("Error executing get_shop_inventory RPC:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("get_shop_inventory RPC execution failed:", err);
    return [];
  }
}

export async function buyShopItemRPC(characterId, itemId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("buy_shop_item", {
      p_character_id: characterId,
      p_item_id: itemId
    });

    if (error) {
      console.error("Error executing buy_shop_item RPC:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("buy_shop_item RPC execution failed:", err);
    throw err;
  }
}

/**
 * SUGGESTED PLAYERS FROM OTHER ACCOUNTS
 */
export async function getSuggestedPlayersFromDB() {
  try {
    const user = await getUser();
    const currentUserId = user ? user.id : null;

    const { data, error } = await supabase.rpc("get_suggested_players", {
      p_account_id: currentUserId
    });

    if (error) {
      console.warn("RPC get_suggested_players unavailable, querying characters:", error.message);
      const { data: directData } = await supabase
        .from("characters")
        .select("id, account_id, name, class_id, level, power")
        .limit(20);
      if (directData && directData.length) {
        return directData.map(c => ({
          id: c.id,
          name: c.name,
          class: c.class_id ? c.class_id.charAt(0).toUpperCase() + c.class_id.slice(1) : "Warrior",
          level: c.level || 1,
          power: c.power || (c.level * 50 + 100),
          isBot: false,
          isOnline: true
        }));
      }
      return [];
    }

    if (!data || !data.length) return [];

    return data.map(char => ({
      id: char.character_id,
      name: char.character_name,
      class: char.class_id ? char.class_id.charAt(0).toUpperCase() + char.class_id.slice(1) : "Warrior",
      level: char.level || 1,
      power: char.power || (char.level * 50 + 100),
      isBot: false,
      isOnline: true
    }));
  } catch (err) {
    console.warn("Failed to load suggested players from DB:", err);
    return [];
  }
}

/**
 * REBIRTH & DIFFICULTY RPC HELPERS (PHASE 10)
 */
export async function performRebirthRPC(characterId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("perform_rebirth", {
      p_character_id: characterId
    });

    if (error) {
      console.error("Error executing perform_rebirth RPC:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("perform_rebirth RPC execution failed:", err);
    throw err;
  }
}

export async function updateLootFilterRPC(characterId, lootFilter) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase
      .from("characters")
      .update({ loot_filter: lootFilter, updated_at: new Date().toISOString() })
      .eq("id", characterId)
      .select()
      .single();

    if (error) {
      console.error("Error updating loot filter:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("updateLootFilterRPC failed:", err);
    throw err;
  }
}

export async function updateActiveDifficultyRPC(difficulty) {
  const user = await getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("accounts_profile")
      .update({ active_difficulty: difficulty, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating active difficulty:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("updateActiveDifficultyRPC failed:", err);
    throw err;
  }
}

/**
 * THE FORGE RPC HELPERS (PHASE 11)
 */
export async function reforgeItemRPC(characterId, inventoryItemId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("reforge_item", {
      p_character_id: characterId,
      p_inventory_item_id: inventoryItemId
    });

    if (error) {
      console.error("Error executing reforge_item RPC:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("reforge_item RPC execution failed:", err);
    throw err;
  }
}

export async function enhanceItemRPC(characterId, inventoryItemId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("enhance_item", {
      p_character_id: characterId,
      p_inventory_item_id: inventoryItemId
    });

    if (error) {
      console.error("Error executing enhance_item RPC:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("enhance_item RPC execution failed:", err);
    throw err;
  }
}

export async function transmuteItemsRPC(characterId, itemIds) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("transmute_items", {
      p_character_id: characterId,
      p_item_ids: itemIds
    });

    if (error) {
      console.error("Error executing transmute_items RPC:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("transmute_items RPC execution failed:", err);
    throw err;
  }
}

export async function syncLocalClanToSupabaseRPC(localClan) {
  if (!localClan || !localClan.name || !localClan.tag) return null;
  const user = await getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("clans")
      .insert({
        name: localClan.name,
        tag: localClan.tag,
        icon: localClan.icon || "⚔️",
        leader_account_id: user.id,
        max_members: localClan.maxMembers || 20,
        siege_points: localClan.siegePoints || 0,
        total_power: localClan.totalPower || 0,
        fortresses: localClan.fortresses || [],
        members: localClan.members || []
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Could not sync local clan to Supabase:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("syncLocalClanToSupabaseRPC error:", err);
    return null;
  }
}

export async function enqueueTaskRPC(characterId, queuePos, taskType, targetId, targetName, totalCycles = 50, allocatedFood = 0) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("enqueue_task", {
      p_character_id: characterId,
      p_queue_position: queuePos,
      p_task_type: taskType,
      p_target_id: targetId,
      p_target_name: targetName,
      p_total_cycles: totalCycles,
      p_allocated_food: allocatedFood
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("enqueueTaskRPC failed:", err);
    throw err;
  }
}

export async function clearTaskQueueRPC(characterId) {
  if (!characterId || typeof characterId !== "string" || !characterId.includes("-")) return null;

  try {
    const { data, error } = await supabase.rpc("clear_task_queue", {
      p_character_id: characterId
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("clearTaskQueueRPC failed:", err);
    throw err;
  }
}

export async function updateWebhookSettingsRPC(webhookUrl, events) {
  const user = await getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase.rpc("update_webhook_settings", {
      p_webhook_url: webhookUrl,
      p_events: events
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("updateWebhookSettingsRPC failed:", err);
    throw err;
  }
}

export async function visitHousingHearthRPC(hostAccountId) {
  if (!hostAccountId) return null;

  try {
    const { data, error } = await supabase.rpc("visit_housing_hearth", {
      p_host_account_id: hostAccountId
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("visitHousingHearthRPC failed:", err);
    throw err;
  }
}

if (typeof window !== "undefined") {
  window.getSuggestedPlayersFromDB = getSuggestedPlayersFromDB;
  window.performRebirthRPC = performRebirthRPC;
  window.updateLootFilterRPC = updateLootFilterRPC;
  window.updateActiveDifficultyRPC = updateActiveDifficultyRPC;
  window.reforgeItemRPC = reforgeItemRPC;
  window.enhanceItemRPC = enhanceItemRPC;
  window.transmuteItemsRPC = transmuteItemsRPC;
  window.syncLocalClanToSupabaseRPC = syncLocalClanToSupabaseRPC;
  window.enqueueTaskRPC = enqueueTaskRPC;
  window.clearTaskQueueRPC = clearTaskQueueRPC;
  window.updateWebhookSettingsRPC = updateWebhookSettingsRPC;
  window.visitHousingHearthRPC = visitHousingHearthRPC;
}





