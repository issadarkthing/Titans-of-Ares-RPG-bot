import { Player } from "./Player";
import { Fighter } from "./Fighter";



export abstract class Item {

  abstract get id(): string;

  // this method should be destructive
  abstract use(fighter: Fighter): void;

  save(player: Player) {

  }
}
