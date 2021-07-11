import { getLevel, getStats, GOLD, numberFormat, STAR } from "./utils";
import { GuildMember, MessageEmbed } from "discord.js";
import { IFighter, Fighter, BaseStats } from "./Fighter";
import { setCoin } from "../db/coin";
import { createUser, getTotalPoints, getTotalXp, getUser, getUsers } from "../db/player";
import { stripIndents } from "common-tags";
import { MAX_ENERGY, showTimeLeft } from "./energy";
import { Buff, BuffID } from "./Buff";
import { TimerType } from "../db/timer";
import { Profile } from "./Profile";
import { Inventory } from "./Inventory";
import { getInventory, Item } from "../db/inventory";
import { Pet } from "./Pet";
import { getAllPets } from "../db/pet";
import { List } from "./List"

export const CRIT_RATE = 0.1;
export const CRIT_DAMAGE = 2;

export interface IPlayer extends IFighter {
  xp: number;
  points: number;
  energy: number;
  coins: number;
  userID: string;
  challengerMaxLevel: number;
  member: GuildMember;
  buff: BuffID | null;
  inventory: Item[];
  goldMedal: number;
  silverMedal: number;
  bronzeMedal: number;
  pets: List<Pet>;
}

export class Player extends Fighter {

  xp: number;
  points: number;
  coins: number;
  energy: number;
  challengerMaxLevel: number;
  buff: Buff | null;
  inventory: Inventory;
  goldMedal: number;
  silverMedal: number;
  bronzeMedal: number;
  pets: List<Pet>;
  baseStats: BaseStats;
  readonly id: string;
  readonly member: GuildMember;

  constructor(data: IPlayer) {
    super(data);
    this.xp = data.xp;
    this.points = data.points;
    this.coins = data.coins;
    this.id = data.userID;
    this.member = data.member;
    this.energy = data.energy;
    this.challengerMaxLevel = data.challengerMaxLevel;
    this.inventory = new Inventory(data.inventory);
    this.goldMedal = data.goldMedal;
    this.silverMedal = data.silverMedal;
    this.bronzeMedal = data.bronzeMedal;
    this.pets = data.pets;
    this.buff = data.buff && new Buff(data.buff);
    this.baseStats = {
      hp: this.hp,
      strength: this.strength,
      speed: this.speed,
      armor: this.armor,
      critRate: this.critRate,
      critDamage: this.critDamage,
    }

    this.buff?.use(this);
  }

  static async getPlayer(member: GuildMember): Promise<Player> {
    const userId = member.user.id;
    const totalXp = await getTotalXp(userId);
    const totalPoints = await getTotalPoints(userId);
    const level = getLevel(totalXp);
    const stats = getStats(level);
    const inventory = await getInventory(userId);
    const pets = (await getAllPets(userId)).map(x => Pet.fromDB(x));

    let player = await getUser(userId);
    if (!player) {
      player = await createUser(userId);
    }

    return new Player({
      name: member.displayName,
      member,
      level,
      hp: stats.hp,
      strength: stats.strength,
      speed: stats.speed,
      armor: stats.armor,
      critRate: CRIT_RATE,
      critDamage: CRIT_DAMAGE,
      imageUrl: member.user.displayAvatarURL({ format: "jpg" }),
      points: totalPoints,
      xp: totalXp,
      coins: player.Coin,
      userID: member.user.id,
      energy: player.Energy,
      challengerMaxLevel: player.ChallengerMaxLevel,
      buff: player.Buff,
      inventory,
      goldMedal: player.GoldMedal,
      silverMedal: player.SilverMedal,
      bronzeMedal: player.BronzeMedal,
      pets: List.from(pets),
    })
  }

  get activePet() {
    return this.pets.find(x => x.active);
  }

  async sync() {
    const data = (await getUser(this.id))!;
    const inventory = await getInventory(this.id);
    const pets = (await getAllPets(this.id)).map(x => Pet.fromDB(x));

    this.xp = await getTotalXp(this.id);
    this.points = await getTotalPoints(this.id);
    this.level = getLevel(this.xp);
    this.coins = data.Coin;
    this.energy = data.Energy;
    this.challengerMaxLevel = data.ChallengerMaxLevel;
    this.inventory = new Inventory(inventory);
    this.goldMedal = data.GoldMedal;
    this.silverMedal = data.SilverMedal;
    this.bronzeMedal = data.BronzeMedal;
    this.buff = data.Buff && new Buff(data.Buff);
    this.pets = List.from(pets);
    this.baseStats = {
      hp: this.hp,
      strength: this.strength,
      speed: this.speed,
      armor: this.armor,
      critRate: this.critRate,
      critDamage: this.critDamage,
    }

    this.buff?.use(this);
  }

  async getRank() {

    const users = await getUsers();
    const cards: { 
      id: string,
      point: number,
      xp: number,
    }[] = [];


    for (const user of users) {
      const xp = await getTotalXp(user.DiscordID);
      const point = await getTotalPoints(user.DiscordID);
      cards.push({ id: user.DiscordID, xp, point });
    }

    cards.sort((a, b) => b.xp - a.xp);

    const rank = cards.findIndex(x => x.id === this.id);
    return rank + 1;
  }

  async getProfile() {

    const profile = new Profile({
      name: this.name,
      xp: this.xp,
      level: this.level,
      rank: await this.getRank(),
      imageUrl: this.imageUrl,
      userID: this.id,
      gold: this.goldMedal,
      silver: this.silverMedal,
      bronze: this.bronzeMedal,
    });

    return profile.build();
  }

  async getStats() {
    const energyTimer = await showTimeLeft(TimerType.Energy, this.id);
    const buffTimer = await this.buff?.getTimeLeft(this);
    const xp = numberFormat(this.xp);
    const hp = numberFormat(this.hp);
    const strength = numberFormat(this.strength);
    const speed = numberFormat(this.speed);
    const armor = numberFormat(this.armor);
    const critRate = numberFormat(this.critRate * 100);
    const critDamage = numberFormat(this.critDamage);
    const petName = this.activePet ? 
      `${this.activePet.name} \`${this.activePet.star} ${STAR}\`` : "None"

    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle(this.name)
      .addField("-----", stripIndents`
        **Stats**
        XP: \`${xp}\` HP: \`${hp}\` Strength: \`${strength}\`
        Speed: \`${speed}\` Armor: \`${armor}\` 
        Crit Rate: \`${critRate}%\` Crit Damage: \`x${critDamage}\` 
        
        **Inventory**
        \`${this.inventory.chests.length}\` Treasure Chests
        \`${this.inventory.fragments.length}\` Pet Fragments
        \`${this.coins}\` Coins

        **Energy**
        ${this.energy}/${MAX_ENERGY} ${energyTimer}

        **Buffs**
        ${this.buff?.name || "None"} ${buffTimer || ""}

        **Pet**
        ${petName}
      `);

    return embed;
  }

  // this adds or deduces the amount of coins of a player
  async addCoin(amount: number) {
    await setCoin(this.id, this.coins + amount);
    this.coins += amount;
  }
}


