import { stripIndents } from "common-tags";
import { MessageEmbed } from "discord.js";
import { PREFIX } from "..";
import { removeInventory } from "../db/inventory";
import { Item } from "./Item";
import { Player } from "./Player";
import { BROWN, CDN_LINK } from "./utils";


export class Scroll extends Item {
  id = "scroll";
  name = "Upgrade Scroll";
  description = stripIndents`
  Upgrade scroll is used to upgrade normal gear up to level 10

  To upgrade gear, inspect the item in the \`${PREFIX}inventory\` or \`${PREFIX}gear\` menu`;
  price = 25;
  imageUrl = CDN_LINK + 
    "852530378916888626/868333533951840286/704a20ac63fa90bb65cbc06a40e2b452.jpg";

  show(count: number) {
    
    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle("Upgrade Scroll")
      .setThumbnail(this.imageUrl)
      .setDescription(this.description)
      .addField("Price", `${this.price} Coins`, true)
      .addField("Owned", count, true)

    return embed;
  }

  use(player: Player) {
    return removeInventory(player.id, this.id);
  }
}
