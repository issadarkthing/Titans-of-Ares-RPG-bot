import { Message } from "discord.js";
import { levelupGear } from "../db/gear";
import { removeInventory } from "../db/inventory";
import { Gear } from "./Gear";
import { Player } from "./Player";
import { sleep } from "./utils";
import { client } from "../main";


export function upgrade(
  item: Gear, 
  msg: Message, 
  player: Player, 
  count: number,
) {
  return async () => {

    if (client.onMultiUpgrade.has(player.id)) {
      return msg.channel.send("There is already multiple upgrade running");
    } else {
      client.onMultiUpgrade.add(player.id);
    }

    const scroll = item.scroll;
    let scrollCount = player.inventory.all.count(scroll.id);
    let scrollLost = 0;
    let upgradeSuccess = false;

    for (let i = 0; i < count; i++) {
      if (item.level >= 10) {
        client.onMultiUpgrade.delete(player.id);
        return msg.channel.send("Gear is on max level");
      } else if (scrollCount === 0) {
        client.onMultiUpgrade.delete(player.id);
        // bulk remove on failed upgrade midway
        await removeInventory(player.id, scroll.id, scrollLost);
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

    client.onMultiUpgrade.delete(player.id);

    try {
      // bulk remove on finish
      await removeInventory(player.id, scroll.id, scrollLost);
      if (upgradeSuccess) {
        await levelupGear(player.id, item.id);
      }
    } catch (err) {
      console.error(err);
    }
  }
}
