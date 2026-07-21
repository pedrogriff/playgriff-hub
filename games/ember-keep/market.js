// ================================================================
// EMBER KEEP — Economy, Market & Gold Sinks Engine (market.js)
// Native ES Module
// ================================================================

import { AccountStore } from "./account.js";

const MARKET_TAX_RATE = 0.075; // 7.5% transaction tax

export const REFINING_FLUX = {
  id: "item_refining_flux",
  name: "Refining Flux",
  type: "catalyst",
  cost: 50,
  icon: "🧪",
  desc: "Non-refundable NPC catalyst required for high-tier smelting and forging."
};

export const MarketEngine = {
  /**
   * Calculate distance-scaled world map teleport fee
   */
  calculateTeleportFee(charLevel, sourceRegionId, targetRegionId) {
    if (sourceRegionId === targetRegionId) return 0;

    const regionOrder = ["greenhollow", "frosthold", "ashenvale", "shadowmere", "emberpeak"];
    const idx1 = regionOrder.indexOf(sourceRegionId);
    const idx2 = regionOrder.indexOf(targetRegionId);

    const distance = Math.abs((idx1 === -1 ? 0 : idx1) - (idx2 === -1 ? 0 : idx2));

    const baseCost = charLevel * 5;
    const distanceCost = distance * 20;

    return baseCost + distanceCost;
  },

  /**
   * Teleport character to a new world node
   */
  teleportToRegion(slotId, targetRegionId) {
    const char = AccountStore.getCharacter(slotId);
    if (!char) return { success: false, reason: "Character not found" };

    const currentRegion = char.locationNode || "greenhollow";
    const fee = this.calculateTeleportFee(char.level, currentRegion, targetRegionId);

    if (char.gold < fee) {
      return { success: false, reason: `Insufficient gold for teleport fee (${fee}g required)` };
    }

    char.gold -= fee;
    char.locationNode = targetRegionId;
    AccountStore.save();

    return { success: true, fee, targetRegionId };
  },

  /**
   * Post an item listing to the Player Market with 7.5% tax calculation
   */
  postMarketListing(item, priceGold) {
    const char = AccountStore.getActiveCharacter();
    if (!char) return { success: false, reason: "Character state not loaded" };

    const taxAmount = Math.floor(priceGold * MARKET_TAX_RATE);
    const netPayout = priceGold - taxAmount;

    const listing = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sellerName: char.name,
      item: { ...item },
      priceGold,
      taxAmount,
      netPayout,
      createdAt: Date.now()
    };

    // Store listing in market state
    const account = AccountStore.getAccount();
    account.marketListings = account.marketListings || [];
    account.marketListings.push(listing);

    AccountStore.save();
    return { success: true, listing };
  }
};
