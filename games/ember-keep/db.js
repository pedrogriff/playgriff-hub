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
    inventory: charData.inventory,
    equipped: charData.equipped,
    professions: charData.professions,
    location_node: charData.locationNode || charData.location_node || "greenhollow",
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("characters")
    .update(updates)
    .eq("id", charData.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCharacter(characterId) {
  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", characterId);

  if (error) throw error;
  return true;
}
