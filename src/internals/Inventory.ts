import { Chest, Level } from "./Chest";
import { Item } from "../db/inventory";

// manages all items
export class Inventory {

  chest: Chest[];
  items: Item[];
  constructor(items: Item[]) {

    this.items = items;
    this.chest = items
      .filter(x => x.ItemID.startsWith("chest"))
      .map(x => {
        const [, level] = x.ItemID.split("_");
        return new Chest(level as Level);
      })
  }

  itemsCount() {
    const allItems = [...this.chest];

    type Acc = {
      name: string;
      count: number;
    }

    const aggregate = new Map<string, Acc>();

    allItems.forEach(item => {

      const acc = aggregate.get(item.id);
      if (acc) {
        aggregate.set(item.id, { name: item.name, count: acc.count + 1 });
        return;
      }

      aggregate.set(item.id, { name: item.name, count: 1 });
    })

    return [...aggregate.values()];
  }
}
