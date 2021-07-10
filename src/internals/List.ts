
interface Identifiable {
  id: string;
}

/** Utility array super class which provides extra helper methods */
export class List<T extends Identifiable> extends Array<T> {

  /** finds first item from the array by id */
  get(id: string) {
    return this.find(x => x.id === id);
  }

  /** counts item based on id */
  count(id: string) {
    return this.reduce((acc, item) => item.id === id ? acc + 1 : acc, 0);
  }

  static from<T extends Identifiable>(arr: T[]) {
    const list = new List<T>();
    for (const item of arr)
      list.push(item);

    return list;
  }
}
