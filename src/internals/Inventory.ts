import { Chest } from "./Chest";
import { Item } from "./Item";
import { Fragment } from "./Fragment";
import { List } from "./List";
import { Gear } from "./Gear";
import { ArenaScroll, Scroll } from "./Scroll";
import { MiningPick, Stone, Gem, RoughStone } from "./Mining";

/** manage items to be easily filtered and accessed */
export class Inventory {
  chests = new List<Chest>();
  fragments = new List<Fragment>();
  gears = new List<Gear>();
  scrolls = new List<Scroll>();
  picks = new List<MiningPick>();
  stones = new List<Stone>();
  gems = new List<Gem>();

  constructor(items: Item[]) {

    for (const item of items) {
      const itemID = item.id;
      const category = itemID.split("_")[0];
      switch (category) {
        case "chest":
          this.chests.push(item as Chest);
          break;
        case "fragment":
          this.fragments.push(item as Fragment);
          break;
        case "gear":
          this.gears.push(item as Gear);
          break;
        case "scroll":
          if (itemID === "scroll_arena") {
            this.scrolls.push(item as ArenaScroll);
          } else {
            this.scrolls.push(item as Scroll);
          }
          break;
        case "pick":
          this.picks.push(item as MiningPick);
          break;
        case "stone":
          this.stones.push(item as RoughStone);
          break
        case "gem":
          this.gems.push(item as Gem);
          break;
      }
    }

    // sort gems
    this.gems.sort((a, b) => b.rarity - a.rarity);
  }

  get all() {
    return List.from([
      ...this.chests, 
      ...this.fragments,
      ...this.gears,
      ...this.scrolls,
      ...this.stones,
      ...this.gems,
      ...this.picks,
    ]);
  }
}
