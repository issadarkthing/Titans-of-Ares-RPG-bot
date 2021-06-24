import { oneLine } from "common-tags";
import { Message } from "discord.js";
import { CRIT_RATE, Player } from "./player";

function isEven(num: number) {
  return num % 2 === 0;
}

function sleep(seconds: number) {
  return new Promise<void>(resolve => {
    return setTimeout(() => resolve(), seconds)
  })
}

export async function battle(msg: Message, player: Player, challenger: Player) {

  let done = false;
  let round = 0;
  const message = await msg.channel.send("Battle start");

  const attack = async (p1: Player, p2: Player) => {
    const isCrit = p1.attack(p2);
    const damage = isCrit ? p1.strength * CRIT_RATE : p1.strength;
    const critText = isCrit ? "(x2 damage)" : "";
    await message.edit(oneLine`
      ${p1.name} dealt **${damage}** ${critText} damage! 
      ${p2.name} health is now on **${p2.hp}** hp.
    `);
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
