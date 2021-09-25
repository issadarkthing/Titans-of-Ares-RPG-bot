import { oneLine } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { addGem, removeGem } from "../db/gem";
import { ButtonHandler } from "../internals/ButtonHandler";
import Command from "../internals/Command";
import { List } from "../internals/List";
import { Gem, Legendary } from "../internals/Mining";
import { Player } from "../internals/Player";
import { BLUE_BUTTON, bold, BROWN, capitalize, GREEN, inlineCode, NUMBER_BUTTONS, sleep } from "../internals/utils";

export default class Combine extends Command {
  name = "combine";
  aliases = ["comb"];

  async exec(msg: Message, args: string[]) {

    const [arg1, ...args2] = args;
    const quality = arg1.toLowerCase();
    const indexes = args2.map(x => parseInt(x));

    if (!Gem.isValidQuality(quality))
      return msg.channel.send("invalid Gem quality");
    else if (indexes.some(x => Number.isNaN(x)))
      return msg.channel.send("invalid index was given");
    else if (indexes.length === 0)
      return msg.channel.send("you need to pick gems you want to combine");

    const player = await Player.getPlayer(msg.member!);
    const gems = player.inventory.gems.filter(x => x.quality === quality);

    if (gems.length <= 0)
      return msg.channel.send(`You don't have any gem of ${quality} quality`);

    const gemList = List.from(gems).aggregate();
    const selected = new List<Gem>();

    for (const index of indexes) {
      const gem = gemList[index - 1]
      if (!gem) 
        return msg.channel.send(`cannot find gem on index ${index}`);

      selected.push(gem.value);
    }

    const aggregatedSelectedGem = selected.aggregate();

    // check for owned gem quantity
    for (const { value: gem, count } of aggregatedSelectedGem) {
      const ownedGemCount = player.inventory.all.count(gem.id);

      if (count > ownedGemCount) {
        return msg.channel.send(`insufficient gem`);
      }
    }

    // check for gem upgrade requirement
    const gem = selected.get(0)!;
    if (selected.length !== gem.requirement) {
      const errMsg = oneLine`${gem.requirement} ${capitalize(gem.quality)} Gems
      are required to upgrade to 1 ${capitalize(gem.product.quality)} Gem`;

      msg.channel.send(errMsg);
      return;
    }

    const gemListText = aggregatedSelectedGem
      .map(x => inlineCode(`${x.count}x ${x.value.name}`))
      .join(", ");

    const confirmationText = 
      `You are about to combine ${gemListText}, do you want to continue?`;

    const embed = new MessageEmbed()
      .setTitle("Gem Combine")
      .setColor(BROWN)
      .setDescription(confirmationText);

    const confirmMenu = new ButtonHandler(msg, embed, player.id);
    
    confirmMenu.addButton(BLUE_BUTTON, "yes", async () => { 
      const gem = gemList[0].value;

      for (const gem of selected) {
        await removeGem(player.id, gem.id);
      }

      let upgrade = gem.product;

      if (gem instanceof Legendary) {

        const embed = new MessageEmbed()
          .setTitle("Legendary Upgrade")
          .setColor(GREEN)
          .setDescription("Which type of gem you want to cast into?");

        const menu = new ButtonHandler(msg, embed, player.id);

        for (let i = 0; i < Legendary.all.length; i++) {
          const gem = Legendary.all.get(i)!;
          menu.addButton(NUMBER_BUTTONS[i + 1], gem.name, () => {
            upgrade = gem;
          })
        }

        await menu.run();
      }

      const combineAnimation = gem.showCombineAnimation();
      const animation = await msg.channel.send(combineAnimation);
      await sleep(6000);
      await animation.delete();


      await addGem(player.id, upgrade.id);
      await msg.channel.send(`You obtained ${bold(upgrade.name)}!`);
      await msg.channel.send(upgrade.show(-1));
    })

    confirmMenu.addCloseButton();
    await confirmMenu.run();
  }
}
