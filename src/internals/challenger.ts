import { Fighter } from "./battle";
import { getChallenger as dbGetChallenger } from "../db/getChallenger";

const imageUrl = "https://cdn.discordapp.com/attachments/607917288527626250/857580537131958282/unknown.png";

export class Challenger extends Fighter {

  static async getChallenger(level: number) {
    const challenger = await dbGetChallenger(level);
    return new Challenger({
      name: challenger.Name,
      level: challenger.ID,
      hp: challenger.HP,
      strength: challenger.Strength,
      speed: challenger.Speed,
      armor: challenger.Armor,
      criticalChance: challenger.CritChance,
      imageUrl: imageUrl,
    })
  }
}
