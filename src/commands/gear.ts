import { Message, MessageEmbed } from "discord.js";
import { unequipGear } from "../db/gear";
import { ButtonHandler } from "../internals/ButtonHandler";
import { upgrade } from "../internals/multipleUpgrade";
import { Player } from "../internals/Player";
import { BLACK_BUTTON, BLUE_BUTTON, RED_BUTTON, RETURN_BUTTON, SILVER, WHITE_BUTTON } from "../internals/utils";


export async function gearCmd(msg: Message, args: string[]) {

  const player = await Player.getPlayer(msg.member!);

  const [index] = args;
  const gears = player.equippedGears;
  const gear = gears.get(parseInt(index) - 1);

  if (gear) {

    const scrollCount = player.inventory.all.count("scroll");
    const menu = new ButtonHandler(msg, gear.inspect(scrollCount), player.id);

    menu.addButton(BLUE_BUTTON, "unequip gear", () => {
      unequipGear(player.id, gear.id);
      msg.channel.send(
        `Successfully unequip **${gear.name}**!`
      )
    })

    menu.addButton(
      WHITE_BUTTON,
      "upgrade item using 1 scroll",
      upgrade(gear, msg, player, 1),
    );

    menu.addButton(
      RED_BUTTON,
      "upgrade item using 5 scrolls",
      upgrade(gear, msg, player, 5),
    );

    menu.addButton(
      BLACK_BUTTON,
      "upgrade item using 10 scrolls",
      upgrade(gear, msg, player, 10),
    );

    menu.addButton(RETURN_BUTTON, "return to menu", () => {
      gearCmd(msg, []);
    })

    menu.addCloseButton();
    menu.run();

    return;
  }
  
  const list = gears
    .map((gear, i) => `${i + 1}. \`Lvl ${gear.level} ${gear.name} ${gear.description}\``)
    .join("\n");

  const embed = new MessageEmbed()
    .setColor(SILVER)
    .setDescription("Showing all current equipped gear")
    .setTitle("Gear")
    .addField("\u200b", list || "none")
    .addField("Total stats from gear", player.gearStat || "none")
    .addField(`Apprentice Set Reflect Skill`, `${player.equippedGears.length}/11`)

  msg.channel.send(embed);
}
