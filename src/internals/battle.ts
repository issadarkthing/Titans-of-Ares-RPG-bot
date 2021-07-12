import { Message, MessageEmbed } from "discord.js";
import { setMaxChallenger } from "../db/challenger";
import { Challenger } from "./Challenger";
import { Player } from "./Player";
import {
  RED,
  random,
  GOLD,
  PLAYER_CRIT_GIF,
  CHALLENGER_CRIT_GIF,
  numberFormat,
} from "./utils";
import { Fighter } from "./Fighter";
import { sleep } from "./utils";

export const CRIT_RATE = 2;

export class Battle {

  private round = 0;
  private playerRound = 0;
  
  constructor(
    private msg: Message,
    private player: Player,
    private challenger: Challenger,
  ) {}

  private isEven(num: number) {
    return num % 2 === 0;
  }

  private bar(progress: number, maxProgress: number) {
    if (progress < 0) progress = 0;

    const maxFill = 20;
    const fill = "█";
    const path = "░";
    const fillProgress = Math.round((progress * maxFill) / maxProgress);

    return Array(maxFill)
      .fill(fill)
      .map((v, i) => (fillProgress > i ? v : path))
      .join("");
  }

  async run() {
    let done = false;
    let embed = new MessageEmbed();
    const message = await this.msg.channel.send("Battle start");
    const playerMaxHP = this.player.hp;
    const challengerMaxHP = this.challenger.hp;

    // This determines whichever moves first. If the player has higher speed, it
    // returns 0, i.e, player moves first by default. Otherwise, it returns 1
    // which flips the value of isEven that makes the player move second. If both
    // has the same speed, it will be chosen randomly.
    const moveFirst =
      this.player.speed === this.challenger.speed
      ? random().pick([0, 1])
      : this.player.speed > this.challenger.speed
      ? 0
      : 1;

    const attack = async (p1: Fighter, p2: Fighter) => {
      const isCrit = p1.isCriticalHit();
      const attackRate = isCrit ? CRIT_RATE * p1.strength : p1.strength;
      const damageReduction = p1.getArmorReduction(attackRate);
      const damageDone = (attackRate - damageReduction);
      p2.hp -= damageDone;

      const critText = isCrit ? " (x2 critical hit)" : "";

      embed = new MessageEmbed()
        .setColor(RED)
        .setThumbnail(p1.imageUrl)
        .addField("Attacking Player", p1.name)
        .addField("Attack Rate", `\`${attackRate}${critText}\``, true)
        .addField("Damage Reduction", `\`${damageReduction}\``, true)
        .addField("Damage Done", `\`${damageDone}\``, true)
        .addField("Round", this.round + 1, true);

      const createCritEmbed = async (url: string) => {
        const critEmbed = new MessageEmbed()
          .setTitle(`${p1.name} Critical Attack`)
          .setColor(RED)
          .setImage(url);

        await message.edit(critEmbed);
      };

      if (p1.name === this.player.name) {
        const p1MaxHP = numberFormat(playerMaxHP);
        const p1HealthBar = this.bar(p1.hp, playerMaxHP);
        const p1RemainingHp = p1.hp >= 0 ? numberFormat(p1.hp) : 0;

        const p2MaxHP = numberFormat(challengerMaxHP);
        const p2HealthBar = this.bar(p2.hp, challengerMaxHP);
        const p2RemainingHp = p2.hp >= 0 ? numberFormat(p2.hp) : 0;


        embed.addField(
          `${p1.name}'s remaining HP`,
          `${p1HealthBar} \`${p1RemainingHp}/${p1MaxHP}\``
        );
        embed.addField(
          `${p2.name}'s remaining HP`,
          `${p2HealthBar} \`${p2RemainingHp}/${p2MaxHP}\``
        );

      } else {
        const p1MaxHP = numberFormat(challengerMaxHP);
        const p1HealthBar = this.bar(p1.hp, challengerMaxHP);
        const p1RemainingHp = p1.hp >= 0 ? numberFormat(p1.hp) : 0;

        const p2MaxHP = numberFormat(playerMaxHP);
        const p2HealthBar = this.bar(p2.hp, playerMaxHP);
        const p2RemainingHp = p2.hp >= 0 ? numberFormat(p2.hp) : 0;

        embed.addField(
          `${p2.name}'s remaining HP`,
          `${p2HealthBar} \`${p2RemainingHp}/${p2MaxHP}\``
        );
        embed.addField(
          `${p1.name}'s remaining HP`,
          `${p1HealthBar} \`${p1RemainingHp}/${p1MaxHP}\``
        );
      }

      if (isCrit) {
        if (p1.name === this.player.name) {
          await createCritEmbed(PLAYER_CRIT_GIF);
        } else {
          await createCritEmbed(CHALLENGER_CRIT_GIF);
        }

        await sleep(4000);
      }

      await message.edit(embed);
    };

    while (!done) {
      if (this.isEven(this.round + moveFirst)) {
        await attack(this.player, this.challenger);
      } else {
        await attack(this.challenger, this.player);
      }

      if (this.player.hp <= 0 || this.challenger.hp <= 0) break;

      await sleep(2000);

      this.round++;
    }

    const isWon = this.player.hp > 0;
    const battleResult = isWon ? "won over" : "lost to";
    await this.msg.channel.send(
      `${this.player.name} has ${battleResult} ${this.challenger.name}!`
    );

    if (isWon) {
      const loot = this.challenger.loot;
      embed.setColor(GOLD);
      await message.edit(embed);
      await this.player.addCoin(loot);
      await setMaxChallenger(this.player.id, this.challenger.level);
      this.player.challengerMaxLevel = this.challenger.level;
      await this.msg.channel.send(
        `${this.player.name} has earned **${loot}** coins!`
      );
    }
  }
}


