import { Chest, Level } from "./Chest";
import { Item } from "../db/inventory";

// manages all items
export class Inventory {

  chest: Chest[];
  constructor(items: Item[]) {

    this.chest = items
      .filter(x => x.ItemID.startsWith("chest"))
      .map(x => {
        const [, level] = x.ItemID.split("_");
        return new Chest(level as Level);
      })
  }
}
