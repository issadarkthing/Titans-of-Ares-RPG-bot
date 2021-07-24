import { Message } from "discord.js";
import { levelupGear } from "../db/gear";
import { removeInventory } from "../db/inventory";
import { Gear } from "./Gear";
import { Player } from "./Player";
import { sleep } from "./utils";


export function upgrade(item: Gear, msg: Message, player: Player, count: number) {
  return async () => {

    for (let i = 0; i < count; i++) {
      await player.sync();
      const itemCount = player.inventory.all.count("scroll");
      if (itemCount === 0) return msg.channel.send("Insufficient scroll");
      if (item.level >= 10) return msg.channel.send("Gear is on max level");

      await removeInventory(player.id, "scroll");
      const animation = await msg.channel.send(item.upgradeAnimation());
      await sleep(5000);

      const upgradeSuccess = item.upgrade();

      if (upgradeSuccess) {

        await levelupGear(player.id, item.id);
        await animation.edit(
          `Successfully upgraded **${item.name}** to level ${item.level + 1}!`
        )
        break;

      } else {
        await animation.edit(
          `Upgrade process for ${item.name} failed`
        )
      }
    }
  }
}
