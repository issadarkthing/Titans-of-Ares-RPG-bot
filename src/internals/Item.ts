import { Player } from "./Player";
import { Fighter } from "./Fighter";
import { addInventory } from "../db/inventory";
import { MessageEmbed } from "discord.js";



export abstract class Item {

  abstract get id(): string;
  abstract name: string;

  /** may mutate the argument passed */
  abstract use(fighter: Fighter): void;

  abstract show(count: number, options?: Record<string, unknown>): MessageEmbed;

  async save(player: Player) {
    await addInventory(player.id, this.id);
  }
}
