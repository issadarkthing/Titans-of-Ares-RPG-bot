import { Player } from "./Player";
import { addInventory } from "../db/inventory";
import { MessageEmbed } from "discord.js";



export abstract class Item {
  abstract get id(): string;
  abstract name: string;
  abstract show(count: number, options?: Record<string, unknown>): MessageEmbed;

  async save(player: Player) {
    await addInventory(player.id, this.id);
  }
}
