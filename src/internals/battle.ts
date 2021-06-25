import { Message, MessageEmbed } from "discord.js";
import { RED, random } from "./utils";

export const CRIT_RATE = 2;

export interface IFighter {
  name: string;
  level: number;
  hp: number;
  strength: number;
  speed: number;
  armor: number;
  criticalChance: number;
  imageUrl: string;
}

// Fighter implements battle fight
export class Fighter {

  name: string;
  level: number;
  hp: number;
  readonly maxHp: number;
  strength: number;
  speed: number;
  armor: number;
  criticalChance: number;
  imageUrl: string;

  constructor(data: IFighter) {
    this.name = data.name;
    this.level = data.level;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.strength = data.strength;
    this.speed = data.speed;
    this.armor = data.armor;
    this.criticalChance = data.criticalChance;
    this.imageUrl = data.imageUrl;
  }

  isCriticalHit() {
    return random().bool(this.criticalChance);
  }

  // Attack mutates the challenger hp to simulate attack. It also accounts for
  // critical hit. This method returns true if the attack was a critical hit.
  attack(challenger: Fighter) {
    const isCrit = this.isCriticalHit();
    const attackRate = isCrit ? CRIT_RATE * this.strength : this.strength;
    challenger.hp -= attackRate;
    return isCrit;
  }
}


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

export async function battle(msg: Message, player: Fighter, challenger: Fighter) {

  let done = false;
  let round = 0;
  const message = await msg.channel.send("Battle start");

  // This determines whichever moves first. If the player has higher speed, it
  // returns 0, i.e, player moves first by default. Otherwise, it returns 1
  // which flips the value of isEven that makes the player move second. If both
  // has the same speed, it will be chosen randomly.
  const moveFirst = 
    player.speed === challenger.speed ?  random().pick([0, 1]) :
    player.speed > challenger.speed ? 0 : 1;

  const attack = async (p1: Fighter, p2: Fighter) => {
    const isCrit = p1.attack(p2);
    const damage = isCrit ? p1.strength * CRIT_RATE : p1.strength;
    const critText = isCrit ? " (x2 critical hit)" : "";
    const healthBar = bar(p2.hp, p2.maxHp);
    const remainingHp = p2.hp >= 0 ? p2.hp : 0;

    const embed = new MessageEmbed()
      .setColor(RED)
      .setThumbnail(p1.imageUrl)
      .addField("Name", p1.name)
      .addField("Attack Rate", `\`${damage}${critText}\``, true)
      .addField("Round", round + 1, true)
      .addField(`${p2.name}'s remaining HP`, 
        `${healthBar} \`${remainingHp}/${p2.maxHp}\``)

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

  const battleResult = player.hp > 0 ? "won over" : "lost to";
  await msg.channel.send(
    `${player.name} has ${battleResult} ${challenger.name}!`
  );
}
