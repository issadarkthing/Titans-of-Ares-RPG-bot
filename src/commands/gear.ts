import { Message, MessageEmbed } from "discord.js";
import { unequipGear } from "../db/gear";
import { ButtonHandler } from "../internals/ButtonHandler";
import { Player } from "../internals/Player";
import { BLUE_BUTTON, RETURN_BUTTON, SILVER } from "../internals/utils";


export async function gearCmd(msg: Message, args: string[]) {

  const player = await Player.getPlayer(msg.member!);

  const [index] = args;
  const gears = player.equippedGears;
  const gear = gears.get(parseInt(index) - 1);

  if (gear) {

    const menu = new ButtonHandler(msg, gear.show(1), player.id);

    menu.addButton(BLUE_BUTTON, "unequip gear", () => {
      unequipGear(player.id, gear.id);
      msg.channel.send(
        `Successfully unequip **${gear.name}**!`
      )
    })

    menu.addButton(RETURN_BUTTON, "return to menu", () => {
      gearCmd(msg, []);
    })

    menu.addCloseButton();
    menu.run();

    return;
  }
  
  const list = gears
    .map((gear, i) => `${i + 1}. \`Lvl ${gear.level} ${gear.name}\``)
    .join("\n");

  const embed = new MessageEmbed()
    .setColor(SILVER)
    .setDescription("Showing all currently equipped gears")
    .setTitle("Gears")
    .addField("\u200b", list || "none")

  msg.channel.send(embed);
}
