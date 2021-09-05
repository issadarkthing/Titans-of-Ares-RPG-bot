
type Fn = () => Promise<unknown>;

/** SafeFn prevents same async function to be executed while other is running */
export class SafeFn {
  private fn = new Map<string, Fn>();
  private running = new Set<string>();

  add(id: string, fn: Fn) {
    this.fn.set(id, fn);
  }

  async exec(id: string) {
    if (!this.fn.has(id)) {
      throw new Error(`cannot find "${id}"`);
    }

    if (this.running.has(id)) {
      throw new Error(`"${id}" is already running`);
    }

    const fn = this.fn.get(id)!;

    try {
      this.running.add(id);
      const result = await fn();
      return result;
    } finally {
      this.running.delete(id);
    }
  }
}
