import { addInventory } from "../db/inventory";
import { addMedal } from "../db/medal";
import { Chest } from "./Chest";
import { Player } from "./Player";

export const medals = ["BronzeMedal", "SilverMedal", "GoldMedal"];
export type MedalType = "BronzeMedal" | "SilverMedal" | "GoldMedal";


export class Medal {

  constructor(public medal: MedalType) {}
  
  static isValidMedal(medal: string) {
    return medals.includes(medal);
  }

  // returns text friendly alternate name
  get name() {
    switch (this.medal) {
      case "GoldMedal":
        return "Gold Medal";
      case "SilverMedal":
        return "Silver Medal";
      case "BronzeMedal":
        return "Bronze Medal";
    }
  }

  get chest() {
    return Chest.fromMedal(this.medal);
  }

  async give(player: Player, amount: number) {
    const chest = Chest.fromMedal(this.medal);
    await addMedal(player.id, this.medal, amount);
    await addInventory(player.id, chest.id);
  }
}
