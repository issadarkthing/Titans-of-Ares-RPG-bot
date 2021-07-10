import { Chest, ChestID } from "./Chest";
import { Item } from "../db/inventory";
import { Fragment, FragmentID } from "./Fragment";
import { List } from "./List";

/** manage items to be easily filtered and accessed */
export class Inventory {

  chests: List<Chest>;
  fragments: List<Fragment>;
  items: Item[];
  constructor(items: Item[]) {

    this.items = items;
    this.chests = new List();
    this.fragments = new List();

    for (const item of items) {
      const itemID = item.ItemID;
      const category = item.ItemID.split("_")[0];
      switch (category) {
        case "chest":
          this.chests.push(Chest.fromChestID(itemID as ChestID));
          break;
        case "fragment":
          this.fragments.push(new Fragment(itemID as FragmentID));
      }
    }
  }

  get all() {
    return List.from([...this.chests, ...this.fragments]);
  }

  itemsCount() {

    type Acc = {
      id: string;
      name: string;
      count: number;
    }

    const aggregate = new Map<string, Acc>();

    this.all.forEach(item => {

      const acc = aggregate.get(item.id);
      if (acc) {
        aggregate.set(item.id, { 
          id: item.id, 
          name: item.name, 
          count: acc.count + 1, 
        })

        return;
      }

      aggregate.set(item.id, { id: item.id, name: item.name, count: 1 });
    })

    return [...aggregate.values()];
  }
}
