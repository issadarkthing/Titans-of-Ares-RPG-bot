import { setMiningPickReward } from "../db/gem";
import { addInventory } from "../db/inventory";
import { MiningPick } from "./Mining";
import { Player } from "./Player";
import { upperLimit } from "./utils";


export class MiningPickReward {

  /** reward every 10 xp */
  static XP_REWARD = 10;

  static upperLimit(xp: number) {
    return upperLimit(xp, this.XP_REWARD);
  }

  static async reward(player: Player) {
    const pick = new MiningPick();
    await addInventory(player.id, pick.id);
  }

  static setUpperLimit(player: Player) {
    return setMiningPickReward(player.id, MiningPickReward.upperLimit(player.xp));
  }
}
