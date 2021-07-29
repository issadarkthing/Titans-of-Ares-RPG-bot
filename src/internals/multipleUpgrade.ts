import { Message } from "discord.js";
import { levelupGear } from "../db/gear";
import { removeInventory } from "../db/inventory";
import { Gear } from "./Gear";
import { Player } from "./Player";
import { sleep } from "./utils";
import { onMultiUpgrade } from "../index";


export function upgrade(item: Gear, msg: Message, player: Player, count: number) {
  return async () => {

    if (onMultiUpgrade.has(player.id)) {
      return msg.channel.send("There is already multiple upgrade running");
    } else {
      onMultiUpgrade.add(player.id);
    }

    let scrollCount = player.inventory.all.count("scroll");
    let scrollLost = 0;
    let upgradeSuccess = false;

    for (let i = 0; i < count; i++) {
      if (item.level >= 10) {
        onMultiUpgrade.delete(player.id);
        return msg.channel.send("Gear is on max level");
      } else if (scrollCount === 0) {
        onMultiUpgrade.delete(player.id);
        await removeInventory(player.id, "scroll", scrollLost);
        return msg.channel.send("Insufficient scroll");
      }

      scrollLost++;
      scrollCount--;
      const animation = await msg.channel.send(item.upgradeAnimation());
      await sleep(5000);

      upgradeSuccess = item.upgrade();

      if (upgradeSuccess) {

        await animation.edit(
          `Successfully upgraded **${item.name}** to level ${item.level + 1}!`
        )
        break;

      } else {
        await animation.edit(`Upgrade process for ${item.name} failed`);
      }
    }

    onMultiUpgrade.delete(player.id);

    try {
      await removeInventory(player.id, "scroll", scrollLost);
      if (upgradeSuccess) {
        await levelupGear(player.id, item.id);
      }
    } catch (err) {
      console.error(err);
    }
  }
}
