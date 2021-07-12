
interface Identifiable {
  id: string;
}


/** Utility array super class which provides extra helper methods */
export class List<T extends Identifiable> {

  private values: T[];
  constructor(values: T[] = []) {
    this.values = values;
  }

  /** finds first item from the array by id.
   *  if number is passed, it will find by index */
  get(id: string | number) {
    if (typeof id === "number")
      return this.values[id];

    return this.values.find(x => x.id === id);
  }

  /** counts item based on id */
  count(id: string) {
    return this.values.reduce((acc, item) => item.id === id ? acc + 1 : acc, 0);
  }

  find(pred: (x: T, i: number) => boolean) {
    return this.values.find(pred);
  }

  map<V>(fn: (x: T, i: number) => V) {
    return this.values.map(fn);
  }

  filter(fn: (x: T, i: number) => boolean) {
    return this.values.filter(fn);
  }

  forEach(fn: (x: T, i: number) => void) {
    this.values.forEach(fn);
  }

  push(x: T) {
    this.values.push(x);
  }

  reduce(fn: (acc: T, current: T, i: number) => T, acc?: T) {
    if (acc) return this.values.reduce(fn, acc);
    return this.values.reduce(fn);
  }

  aggregate() {

    type Acc = {
      value: T,
      count: number,
    };

    const aggregate = new Map<string, Acc>();

    this.forEach(v => {
      const acc = aggregate.get(v.id);
      if (acc) {
        aggregate.set(v.id, {
          value: v,
          count: acc.count + 1,
        })

        return;
      }

      aggregate.set(v.id, { value: v, count: 1 });
    })

    return [...aggregate.values()];
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator]();
  }

  get length() {
    return this.values.length;
  }

  static from<T extends Identifiable>(arr: T[]) {
    return new List(arr);
  }
}
