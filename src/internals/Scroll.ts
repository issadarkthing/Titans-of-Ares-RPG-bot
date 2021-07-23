import { MessageEmbed } from "discord.js";
import { removeInventory } from "../db/inventory";
import { Item } from "./Item";
import { Player } from "./Player";
import { BROWN } from "./utils";


export class Scroll extends Item {
  id = "scroll";
  name = "Upgrade Scroll";
  price = 25;

  show(count: number) {
    
    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle("Upgrade Scroll")
      .setDescription("Scroll is used to upgrade normal gears")
      .addField("Price", this.price, true)
      .addField("Count", count, true)

    return embed;
  }

  use(player: Player) {
    return removeInventory(player.id, this.id);
  }
}
