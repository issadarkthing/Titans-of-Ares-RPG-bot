import { Player } from "./Player";
import { Fighter } from "./Fighter";
import { addInventory } from "../db/inventory";



export abstract class Item {

  abstract get id(): string;
  abstract name: string;

  /** may mutate the argument passed */
  abstract use(fighter: Fighter): void;

  async save(player: Player) {
    await addInventory(player.id, this.id);
  }
}
