import { addInventory, removeInventory } from "../db/inventory";
import { addMedal } from "../db/medal";
import { addXP } from "../db/xp";
import { Chest } from "./Chest";
import { Player } from "./Player";

export const medals = ["BronzeMedal", "SilverMedal", "GoldMedal"];
export type MedalType = "BronzeMedal" | "SilverMedal" | "GoldMedal";

const medalInfo = {
  GoldMedal: {
    name: "Gold Medal",
    xp: 175,
  },
  SilverMedal: {
    name: "Silver Medal",
    xp: 125,
  },
  BronzeMedal: {
    name: "Bronze Medal",
    xp: 75,
  }
}

export class Medal {

  medal: MedalType;
  data: { name: string, xp: number };

  constructor(medal: MedalType) {
    this.medal = medal;
    this.data = medalInfo[this.medal];
  }
  
  static isValidMedal(medal: string) {
    return medals.includes(medal);
  }

  // returns text friendly alternate name
  get name() {
    return this.data.name;
  }

  get xp() {
    return this.data.xp;
  }

  get chest() {
    return Chest.fromMedal(this.medal);
  }

  async give(player: Player) {
    await addMedal(player.id, this.medal, 1);
    await addXP(player.id, this.xp);
    await addInventory(player.id, this.chest.id);
  }

  async revert(player: Player) {
    await addMedal(player.id, this.medal, -1);
    await addXP(player.id, -this.xp);
    await removeInventory(player.id, this.chest.id);
  }
}
