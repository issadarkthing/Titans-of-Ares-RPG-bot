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
import { Dragon, Golem, Gryphon, Manticore, Minotaur, Wisp } from "./Pet";
import { oneLine, stripIndents } from "common-tags";


export class Battle {

  private round = 0;
  private playerRound = 0;
  private challengerRound = 0;
  private PET_INTERCEPT = 6_000; // 6 seconds
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

  static bar(progress: number, maxProgress: number) {
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

    const maxHPStr = Math.round(maxHP);
    const healthBar = Battle.bar(hp, maxHP);
    const remainingHP = hp >= 0 ? Math.round(hp) : 0;

    this.battleEmbed?.addField(
      `${name}'s remaining HP`,
      `\`${healthBar}\` \`${remainingHP}/${maxHPStr}\``
    );
  }

  async attack(p1: Fighter, p2: Fighter) {

    if (p1 instanceof Player) {
      this.playerRound++;
    } else {
      this.challengerRound++;
    }

    let isCrit = p1.isCriticalHit();

    const pet = this.player.activePet;
    // offensive
    if (pet && p1 instanceof Player) {

      if (pet instanceof Wisp) {
        const isSpawn = pet.isSpawn(this.playerRound);
        if (isSpawn) {
          let healed = this.playerMaxHP * 0.4;
          const isOverHeal = healed + p1.hp > this.playerMaxHP;
          if (isOverHeal) {
            healed = this.playerMaxHP - p1.hp;
          }

          p1.hp += healed;
          await this.battleMsg?.edit(pet.interceptCard(
            `${this.player.name} is being healed \`(+${Math.round(healed)} hp)\``
          ));
          await sleep(this.PET_INTERCEPT);
        }

      } else if (pet instanceof Minotaur) {
        const isSpawn = pet.isSpawn(this.playerRound);
        if (isSpawn) {
          const dmg = p1.strength * 0.5;
          const damageReduction = p2.getArmorReduction(dmg);
          p2.hp -= damageReduction;
          await this.battleMsg?.edit(pet.interceptCard(
            stripIndents`${this.player.name} has been favoured! 
            ${pet.name} attacks with \`${Math.round(dmg)} strength\``
          ))
          await sleep(this.PET_INTERCEPT);

        }

      } else if (pet instanceof Manticore) {
        const isSpawn = pet.isSpawn(this.playerRound);
        if (isSpawn) {
          isCrit = true;
          await this.battleMsg?.edit(pet.interceptCard(
            `${pet.name} has scared the opponent! \`100%\` critical hit`
          ))
          await sleep(this.PET_INTERCEPT);
        }

      } else if (pet instanceof Dragon) {
        const isSpawn = pet.isSpawn(this.playerRound);
        if (isSpawn) {
          const burn = p2.hp * pet.burn;
          const damage = pet.damage;
          p2.hp -= burn;
          p2.hp -= damage;
          await this.battleMsg?.edit(pet.interceptCard(
            oneLine`Dragon is using Flame Breath dealing \`${Math.round(damage)}\` damage and 
            burns \`${pet.burn * 100}% (${burn})\` enemy's hp`
          ))
          await sleep(this.PET_INTERCEPT);

        }

      }

      // defensive
    } else if (pet && p1 instanceof Challenger) {

      if (pet instanceof Golem) {
        if (isCrit) {
          const isSpawn = pet.isSpawn(this.challengerRound);

          if (isSpawn) {
            isCrit = false;
            await this.battleMsg?.edit(pet.interceptCard(
              `Critical hit has been blocked!`
            ))
            await sleep(this.PET_INTERCEPT);
          }
        }

      } else if (pet instanceof Gryphon) {
        const isSpawn = pet.isSpawn(this.challengerRound);

        if (isSpawn) {

          await this.battleMsg?.edit(pet.interceptCard(
            `${this.player.name} has been saved from ${this.challenger.name}'s attack!`
          ))
          await sleep(this.PET_INTERCEPT);
          return;
        }
      }
    }

    const attackRate = isCrit ? p1.critDamage * p1.strength : p1.strength;
    const damageReduction = p2.getArmorReduction(attackRate);
    const damageDone = attackRate - damageReduction;
    p2.hp -= damageDone;

    const critText = isCrit ? ` (x${p1.critDamage} critical hit)` : "";

    this.battleEmbed = new MessageEmbed()
      .setColor(RED)
      .setThumbnail(p1.imageUrl)
      .addField("Attacking Player", p1.name)
      .addField("Attack Rate", `\`${Math.round(attackRate)}${critText}\``, true)
      .addField("Damage Reduction", `\`${Math.round(damageReduction)}\``, true)
      .addField("Damage Done", `\`${Math.round(damageDone)}\``, true)
      .addField("Round", this.round + 1, true);

    const player = p1 instanceof Player ? p1 : p2;
    const challenger = p2 instanceof Challenger ? p2 : p1;

    this.progressBar(player.name, player.hp, this.playerMaxHP);
    this.progressBar(challenger.name, challenger.hp, this.challengerMaxHP);

    if (isCrit) {

      const critGIF = p1 instanceof Player ? PLAYER_CRIT_GIF : CHALLENGER_CRIT_GIF;

      const critEmbed = new MessageEmbed()
        .setTitle(`${p1.name} Critical Attack`)
        .setColor(RED)
        .setImage(critGIF);

      await this.battleMsg?.edit(critEmbed);
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


