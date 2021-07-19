import { Chest, ChestID } from "./Chest";
import { Item } from "../db/inventory";
import { Fragment, FragmentID } from "./Fragment";
import { List } from "./List";
import { Gear } from "./Gear";

/** manage items to be easily filtered and accessed */
export class Inventory {

  chests: List<Chest>;
  fragments: List<Fragment>;
  gears: List<Gear>;
  constructor(items: Item[]) {

    this.chests = new List();
    this.fragments = new List();
    this.gears = new List();

    for (const item of items) {
      const itemID = item.ItemID;
      const category = item.ItemID.split("_")[0];
      switch (category) {
        case "chest":
          this.chests.push(Chest.fromChestID(itemID as ChestID));
          break;
        case "fragment":
          this.fragments.push(new Fragment(itemID as FragmentID));
          break;
        case "gear":
          this.gears.push(Gear.fromID(itemID));
          break;
      }
    }
  }

  get all() {
    return List.from([
      ...this.chests, 
      ...this.fragments,
      ...this.gears,
    ]);
  }
}
