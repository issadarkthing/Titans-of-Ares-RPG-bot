import { setFragmentReward, XP_REWARD } from "../db/fragmentReward";
import { addInventory } from "../db/inventory";
import { Pet } from "./Pet";
import { Player } from "./Player";
import { random, totalLevelPassed, upperLimit } from "../internals/utils";


export class FragmentReward {

  static upperLimit(xp: number) {
    return upperLimit(xp, XP_REWARD);
  }

  static totalLevelPassed(xp: number) {
    return totalLevelPassed(xp, XP_REWARD);
  }

  static async reward(player: Player) {
    const fragment = Pet.random().fragment;
    await addInventory(player.id, fragment.id);
    return fragment;
  }

  static setUpperLimit(player: Player) {
    return setFragmentReward(player.id, FragmentReward.upperLimit(player.xp));
  }

  /** 20% chance to earn fragment reward */
  static random() {
    return random().bool(0.2);
  }
}
