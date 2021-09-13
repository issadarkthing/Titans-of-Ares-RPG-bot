import { Message, MessageEmbed } from "discord.js";
import { client } from "../main";
import { unequipGear } from "../db/gear";
import { ButtonHandler } from "../internals/ButtonHandler";
import { Gear } from "../internals/Gear";
import { ApprenticeGear } from "../internals/ApprenticeGear";
import { upgrade } from "../internals/multipleUpgrade";
import { Player } from "../internals/Player";
import { BLACK_BUTTON, BLUE_BUTTON, bold, RED_BUTTON, RETURN_BUTTON, SILVER, WHITE_BUTTON } from "../internals/utils";
import Command from "../internals/Command";
import { ArenaGear } from "../internals/ArenaGear";
import { desocketGem } from "../db/gem";
import { stripIndents } from "common-tags";

export default class extends Command {
  name = "gear";

  async exec(msg: Message, args: string[]) {

    const player = await Player.getPlayer(msg.member!);

    const [index] = args;
    const gears = player.equippedGears;
    const gear = gears.get(parseInt(index) - 1);

    if (gear) {

      const scrollCount = player.inventory.all.count(gear.scroll.id);
      const menu = new ButtonHandler(msg, gear.inspect(scrollCount), player.id);

      menu.addButton(BLUE_BUTTON, "unequip gear", () => {
        unequipGear(player.id, gear.id);
        msg.channel.send(
          `Successfully unequip **${gear.name}**!`
        )

        if (gear.gem) {
          desocketGem(player.id, gear.gem.id, gear.id);
          msg.channel.send(`Successfully desocket ${bold(gear.gem.name)}!`);
        }
      })

      if (gear.level < 10) {
        menu.addButton(
          WHITE_BUTTON,
          "upgrade item using 1 scroll",
          upgrade(gear, msg, player, 1),
        );

        menu.addButton(
          RED_BUTTON,
          "upgrade item using 10 scrolls",
          upgrade(gear, msg, player, 10),
        );

        menu.addButton(
          BLACK_BUTTON,
          "upgrade item using 50 scrolls",
          upgrade(gear, msg, player, 50),
        );
      }

      menu.addButton(RETURN_BUTTON, "return to menu", () => {
        this.exec(msg, []);
      })

      menu.addCloseButton();
      await menu.run();

      return;

    } else if (index === "bonus") {

      // TODO remove code duplication
      let equipped = player.equippedGears.filter(x => x instanceof ApprenticeGear);
      let lvl1 = equipped.length;
      let lvl2 = equipped.filter(x => x.level >= 5).length;
      let lvl3 = equipped.filter(x => x.level >= 10).length;

      let active = 0;
      for (const lvl of [lvl1, lvl2, lvl3]) {
        if (lvl === 11) {
          active++;
        }
      }

      const apprenticeBonus = stripIndents`
      Full Apprentice Set +0  | 10% reflect | \`${lvl1}/11\` ${active === 1 ? "Active" : ""}
      Full Apprentice Set +5  | 30% reflect | \`${lvl2}/11\` ${active === 2 ? "Active" : ""}
      Full Apprentice Set +10 | 50% reflect | \`${lvl3}/11\` ${active === 3 ? "Active" : ""}`

      equipped = player.equippedGears.filter(x => x instanceof ArenaGear);
      lvl1 = equipped.length;
      lvl2 = equipped.filter(x => x.level >= 5).length;
      lvl3 = equipped.filter(x => x.level >= 10).length;

      active = 0;
      for (const lvl of [lvl1, lvl2, lvl3]) {
        if (lvl === 11) {
          active++;
        }
      }

      const arenaBonus = stripIndents`
      Full Arena Set +0  | +20% armor penetration | \`${lvl1}/11\` ${active === 1 ? "Active" : ""}
      Full Arena Set +5  | +40% armor penetration | \`${lvl2}/11\` ${active === 2 ? "Active" : ""}
      Full Arena Set +10 | +60% armor penetration | \`${lvl3}/11\` ${active === 3 ? "Active" : ""}`

      const embed = new MessageEmbed()
        .setColor(SILVER)
        .addField("Apprentice Set Reflect Skill", apprenticeBonus)
        .addField("Arena Set Penetrate Skill", arenaBonus)

      msg.channel.send(embed);
      return;
    }
    
    const list = gears
      .map((gear, i) => { 

        const socket = gear.gem ? 
          `\n${Gear.socketEmoji} ${gear.gem.name} ${gear.gem.stat}` : "";

        const stat = 
          gear.attribute.format(gear.attributeValue, { suffix: true, prefix: true });
        
        return `${i + 1}. \`Lvl ${gear.level} ${gear.name} ${stat} ${socket}\``;
      })
      .join("\n");

    const setBonus = Gear.getBonus(player.equippedGears);
    const armorBonusSetDesc = setBonus?.description || "None";

    const embed = new MessageEmbed()
      .setColor(SILVER)
      .setDescription("Showing all current equipped gear")
      .setTitle("Gear")
      .addField("\u200b", list || "none")
      .addField("Total stats from gear", player.gearStat || "none")
      .addField(`Apprentice Set Reflect Skill`, 
        `Current active set bonus: ${armorBonusSetDesc}`)
      .addField("---", stripIndents`
        Use \`${client.prefix}gear bonus\` to see more info about the set bonus
        Use \`${client.prefix}gear <number>\` to inspect and upgrade item`)

    msg.channel.send(embed);
  }
}

