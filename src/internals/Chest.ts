import { MedalType } from "./Medal";
import { Fighter } from "./Fighter";
import { Item } from "./Item";
import { capitalize } from "./utils";

export type Level = "bronze" | "silver" | "gold";

export class Chest extends Item {

  private level: Level;
  constructor(level: Level) {
    super();
    this.level = level;
  }

  get id() {
    return `chest_${this.level}`
  }

  get name() {
    return `${capitalize(this.level)} Treasure Chest`
  }

  static fromMedal(medal: MedalType) {
    switch (medal) {
      case "GoldMedal":
        return new Chest("gold");
      case "SilverMedal":
        return new Chest("silver");
      case "BronzeMedal":
        return new Chest("bronze");
      default:
        throw Error("invalid medal");
    }
  }

  use(fighter: Fighter) {
    throw new Error("not implemented");
  }
}
