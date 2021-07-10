import { Chest, ChestID } from "./Chest";
import { Item } from "../db/inventory";
import { Fragment, FragmentID } from "./Fragment";

/** manage items to be easily filtered and accessed */
export class Inventory {

  chests: Chest[];
  fragments: Fragment[];
  items: Item[];
  constructor(items: Item[]) {

    this.items = items;
    this.chests = [];
    this.fragments = [];

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

  private get all() {
    return [...this.chests, ...this.fragments];
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

  getItem(id: string) {
    return this.all.find(x => x.id === id);
  }

  getItemCount(id: string) {
    return this.all.reduce((acc, item) => item.id === id ? acc + 1 : acc, 0);
  }
}
