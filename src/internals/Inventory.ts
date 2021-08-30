import { Chest, ChestID } from "./Chest";
import { Item } from "../db/inventory";
import { Fragment, FragmentID } from "./Fragment";
import { List } from "./List";
import { Gear } from "./Gear";
import { Gear as GearDB } from "../db/gear";
import { ArenaScroll, Scroll } from "./Scroll";
import { MiningPick, Stone, Gem } from "./Mining";

/** manage items to be easily filtered and accessed */
export class Inventory {

  chests = new List<Chest>();
  fragments = new List<Fragment>();
  gears = new List<Gear>();
  scrolls = new List<Scroll>();
  picks = new List<MiningPick>();
  stones = new List<Stone>();

  constructor(items: Item[]) {

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
          this.gears.push(Gear.fromDB(item as GearDB));
          break;
        case "scroll":
          if (itemID === "scroll_arena") {
            this.scrolls.push(new ArenaScroll());
          } else {
            this.scrolls.push(new Scroll());
          }
          break;
        case "pick":
          this.picks.push(new MiningPick());
          break;
        case "gem":
          this.stones.push(Gem.fromID(itemID));
      }
    }
  }

  get all() {
    return List.from([
      ...this.chests, 
      ...this.fragments,
      ...this.gears,
      ...this.scrolls,
    ]);
  }
}
