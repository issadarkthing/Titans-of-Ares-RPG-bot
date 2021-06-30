import { Message, MessageEmbed } from "discord.js";
import { setMaxChallenger } from "../db/getChallenger";
import { Challenger } from "./challenger";
import { Player } from "./player";
import { RED, random, GOLD, PLAYER_CRIT_GIF, CHALLENGER_CRIT_GIF, numberFormat } from "./utils";
import { Fighter } from "./fighter";

export const CRIT_RATE = 2;


function isEven(num: number) {
  return num % 2 === 0;
}

function sleep(seconds: number) {
  return new Promise<void>(resolve => {
    return setTimeout(() => resolve(), seconds)
  })
}

function bar(progress: number, maxProgress: number) {

  if (progress < 0)
    progress = 0;

  const maxFill = 20;
  const fill = "█";
  const path = "░";
  const fillProgress = Math.round(progress * maxFill / maxProgress);

  return Array(maxFill)
    .fill(fill)
    .map((v, i) => (fillProgress > i ? v : path))
    .join("");
}

export async function battle(msg: Message, player: Player, challenger: Challenger) {

  let done = false;
  let round = 0;
  let embed = new MessageEmbed();
  const message = await msg.channel.send("Battle start");

  // This determines whichever moves first. If the player has higher speed, it
  // returns 0, i.e, player moves first by default. Otherwise, it returns 1
  // which flips the value of isEven that makes the player move second. If both
  // has the same speed, it will be chosen randomly.
  const moveFirst = 
    player.speed === challenger.speed ?  random().pick([0, 1]) :
    player.speed > challenger.speed ? 0 : 1;

  const attack = async (p1: Fighter, p2: Fighter) => {
    const [
      isCrit,
      attackRate,
      damageReduction,
      damageDone,
    ] = p1.attack(p2);
    const critText = isCrit ? " (x2 critical hit)" : "";

    const p1HealthBar = bar(p1.hp, p1.maxHp);
    const p1RemainingHp = p1.hp >= 0 ? numberFormat(p1.hp) : 0;
    const p2HealthBar = bar(p2.hp, p2.maxHp);
    const p2RemainingHp = p2.hp >= 0 ? numberFormat(p2.hp) : 0;

    embed = new MessageEmbed()
      .setColor(RED)
      .setThumbnail(p1.imageUrl)
      .addField("Attacking Player", p1.name)
      .addField("Attack Rate", `\`${attackRate}${critText}\``, true)
      .addField("Damage Reduction", `\`${damageReduction}\``, true)
      .addField("Damage Done", `\`${damageDone}\``, true)
      .addField("Round", round + 1, true)

    const createCritEmbed = async (url: string) => {
      const critEmbed = new MessageEmbed()
        .setTitle(`${p1.name} Critical Attack`)
        .setColor(RED)
        .setImage(url);

      await message.edit(critEmbed);
    }

    if (p1.name === player.name) {

      embed.addField(`${p1.name}'s remaining HP`, 
        `${p1HealthBar} \`${p1RemainingHp}/${p1.maxHp}\``)
      embed.addField(`${p2.name}'s remaining HP`, 
        `${p2HealthBar} \`${p2RemainingHp}/${p2.maxHp}\``)

    } else {

      embed.addField(`${p2.name}'s remaining HP`, 
        `${p2HealthBar} \`${p2RemainingHp}/${p2.maxHp}\``)
      embed.addField(`${p1.name}'s remaining HP`, 
        `${p1HealthBar} \`${p1RemainingHp}/${p1.maxHp}\``)
    }



    if (isCrit) {
      if (p1.name === player.name) {
        await createCritEmbed(PLAYER_CRIT_GIF);
      } else {
        await createCritEmbed(CHALLENGER_CRIT_GIF);
      }

      await sleep(4000);
    }

    await message.edit(embed);
  }

  while (!done) {

    if (isEven(round + moveFirst)) {
      await attack(player, challenger);
    } else {
      await attack(challenger, player);
    }

    if (player.hp <= 0 || challenger.hp <= 0)
      break;

    await sleep(2000);

    round++;
  }

  const isWon = player.hp > 0;
  const battleResult = isWon ? "won over" : "lost to";
  await msg.channel.send(
    `${player.name} has ${battleResult} ${challenger.name}!`
  );

  if (isWon) {
    const loot = challenger.loot;
    embed.setColor(GOLD);
    await message.edit(embed);
    await player.addCoin(loot);
    await setMaxChallenger(player.userID, challenger.level);
    player.challengerMaxLevel = challenger.level;
    await msg.channel.send(
      `${player.name} has earned **${loot}** coins!`
    );
  }

}
