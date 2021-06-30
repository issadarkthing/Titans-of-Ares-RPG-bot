import { BuffID } from "../internals/buff";
import { dbAll, dbGet, dbRun } from "./promiseWrapper";

export interface Player {
  DiscordID: string;
  XP: number;
  Coin: number;
  Energy: number;
  ChallengerMaxLevel: number;
  Buff: BuffID | null;
}

export function getUsers() {

  const sql = `
  SELECT DISTINCT CAST (DiscordID AS text) as DiscordID
  FROM ChallengeEntry
  `

  return dbAll<{ DiscordID: string }>(sql);
}

export function getUser($userID: string) {

  const sql = `
  SELECT * FROM Player WHERE DiscordID = $userID
  `

  return dbGet<Player | undefined>(sql, { $userID });
}

export async function createUser($userID: string) {
  const sql = `
  INSERT OR IGNORE INTO Player (DiscordID)
  VALUES ($userID)
  `

  await dbRun(sql, { $userID });
  const user = await getUser($userID);
  return user!;
}

export function addBuff($userID: string, $buffID: string) {
  const sql = `
  UPDATE Player
  SET Buff = $buffID
  WHERE DiscordID = $userID
  `
  return dbRun(sql, { $userID, $buffID });
}

export function deleteBuff($userID: string) {
  const sql = `
  UPDATE Player
  SET Buff = NULL
  WHERE DiscordID = $userID
  `

  return dbRun(sql, { $userID });
}
