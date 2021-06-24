import { oneLine } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { CRIT_RATE, Player } from "./player";
import { RED } from "./utils";

function isEven(num: number) {
  return num % 2 === 0;
}

function sleep(seconds: number) {
  return new Promise<void>(resolve => {
    return setTimeout(() => resolve(), seconds)
  })
}

function bar(progress: number, maxProgress: number) {

  const maxFill = 20;
  const fill = "█";
  const path = "░";
  const fillProgress = Math.round(progress * progress / maxProgress);

  return Array(maxFill)
    .fill(fill)
    .map((v, i) => (fillProgress > i ? v : path))
    .join("");
}

export async function battle(msg: Message, player: Player, challenger: Player) {

  let done = false;
  let round = 0;
  const message = await msg.channel.send("Battle start");

  const attack = async (p1: Player, p2: Player) => {
    const isCrit = p1.attack(p2);
    const damage = isCrit ? p1.strength * CRIT_RATE : p1.strength;
    const critText = isCrit ? " (critical hit)" : "";
    const healthBar = bar(p2.hp, p2.maxHp);
    const remainingHp = p2.hp >= 0 ? p2.hp : 0;

    const embed = new MessageEmbed()
      .setColor(RED)
      .setThumbnail(p1.imageUrl)
      .addField("Name", p1.name)
      .addField("Attack Rate", `\`${damage}${critText}\``)
      .addField(`${p2.name}'s remaining HP`, 
        `${healthBar} \`${remainingHp}/${p2.maxHp}\``)

    await message.edit(embed);
  }

  while (!done) {

    if (isEven(round)) {
      await attack(player, challenger);
    } else {
      await attack(challenger, player);
    }

    if (player.hp <= 0 || challenger.hp <= 0)
      break;

    await sleep(2000);

    round++;
  }

  const battleResult = player.hp > 0 ? "won over" : "lost to";
  await msg.channel.send(
    `${player.name} has ${battleResult} ${challenger.name}!`
  );
}
