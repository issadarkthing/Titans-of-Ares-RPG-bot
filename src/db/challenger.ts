import { dbGet, dbRun } from "./promiseWrapper";

export interface Challenger {
  ID: number;
  Name: string;
  Loot: number;
  HP: number;
  Strength: number;
  Speed: number;
  Armor: number;
  CritChance: number;
}

export async function getChallenger($level: number) {

  const sql = `
    SELECT *
    FROM Challenger
    WHERE ID = $level
  `;

  return dbGet<Challenger>(sql, { $level });
}

export function setMaxChallenger($userID: string, $level: number) {
  const sql = `
    UPDATE Player
    SET ChallengerMaxLevel = $level
    WHERE DiscordID = $userID
  `
  return dbRun(sql, { $userID, $level });
}
