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


export class Battle {

  private round = 0;
  private playerRound = 0;
  private battleMsg?: Message;
  private battleEmbed?: MessageEmbed;
  private playerMaxHP: number;
  private challengerMaxHP: number;
  
  constructor(
    private msg: Message,
    private player: Player,
    private challenger: Challenger,
  ) {
    this.playerMaxHP = this.player.hp;
    this.challengerMaxHP = this.challenger.hp;
  }

  private isEven(num: number) {
    return num % 2 === 0;
  }

  private bar(progress: number, maxProgress: number) {
    if (progress < 0) progress = 0;

    const maxFill = 20;
    const fill = "█";
    const path = " ";
    const fillProgress = Math.round((progress * maxFill) / maxProgress);

    return Array(maxFill)
      .fill(fill)
      .map((v, i) => (fillProgress > i ? v : path))
      .join("");
  }

  /** adds progress bar to battleEmbed */ 
  private progressBar(name: string, hp: number, maxHP: number) {

    const maxHPStr = numberFormat(maxHP);
    const healthBar = this.bar(hp, maxHP);
    const remainingHP = hp >= 0 ? numberFormat(hp) : 0;

    this.battleEmbed?.addField(
      `${name}'s remaining HP`,
      `\`${healthBar}\` \`${remainingHP}/${maxHPStr}\``
    );
  }

  async attack(p1: Fighter, p2: Fighter) {

    const isCrit = p1.isCriticalHit();
    const attackRate = isCrit ? p1.critDamage * p1.strength : p1.strength;
    const damageReduction = p1.getArmorReduction(attackRate);
    const damageDone = (attackRate - damageReduction);
    p2.hp -= damageDone;

    const critText = isCrit ? ` (x${p1.critDamage} critical hit)` : "";

    this.battleEmbed = new MessageEmbed()
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

      await this.battleMsg?.edit(critEmbed);
    };

    const player = p1 instanceof Player ? p1 : p2;
    const challenger = p2 instanceof Challenger ? p2 : p1;

    if (p1 instanceof Player) {
      this.playerRound++;
    }

    this.progressBar(player.name, player.hp, this.playerMaxHP);
    this.progressBar(challenger.name, challenger.hp, this.challengerMaxHP);

    if (isCrit) {
      if (p1.name === this.player.name) {
        await createCritEmbed(PLAYER_CRIT_GIF);
      } else {
        await createCritEmbed(CHALLENGER_CRIT_GIF);
      }

      await sleep(4000);
    }

    await this.battleMsg?.edit(this.battleEmbed);
  }

  async run() {
    let done = false;
    this.battleEmbed = new MessageEmbed();
    this.battleMsg = await this.msg.channel.send("Battle start");
    this.playerMaxHP = this.player.hp;
    this.challengerMaxHP = this.challenger.hp;

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

    while (!done) {
      if (this.isEven(this.round + moveFirst)) {
        await this.attack(this.player, this.challenger);
      } else {
        await this.attack(this.challenger, this.player);
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
      this.battleEmbed.setColor(GOLD);
      await this.battleMsg.edit(this.battleEmbed);
      await this.player.addCoin(loot);
      await setMaxChallenger(this.player.id, this.challenger.level);
      this.player.challengerMaxLevel = this.challenger.level;
      await this.msg.channel.send(
        `${this.player.name} has earned **${loot}** coins!`
      );
    }
  }
}


