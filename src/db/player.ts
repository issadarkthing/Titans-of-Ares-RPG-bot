import { BuffID } from "../internals/Buff";
import { getXp } from "../internals/utils";
import { getActivity } from "./activity";
import { getConvertTable } from "./monthlyChallenge";
import { dbAll, dbGet, dbRun } from "./promiseWrapper";

export interface Player {
  DiscordID: string;
  XP: number;
  ArenaCoin: number;
  Coin: number;
  Energy: number;
  ChallengerMaxLevel: number;
  Buff: BuffID | null;
  Profile: Buffer;
  GoldMedal: number;
  SilverMedal: number;
  BronzeMedal: number;
  FragmentReward: number;
  MiningPickReward: number;
}

export function getUsers() {

  const sql = `
  SELECT DISTINCT CAST (DiscordID AS text) as DiscordID
  FROM ChallengeEntry
  UNION
  SELECT DiscordID
  FROM Player;
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

export default async function($userId: string) {

  const sql = `
    SELECT 1
    FROM ChallengeEntry
    WHERE DiscordID = $userId
  `
  const result = await dbAll(sql, { $userId });
  return result.length > 0;
}


export async function getTotalPoints(userId: string) {

  const activities = await getActivity(userId);
  const convertTable = await getConvertTable();

  let totalPoints = 0;

  activities.forEach(activity => {
    const tag = `${activity.ValueType}-${activity.ChallengeID}`;
    const multiplier = convertTable.get(tag);
    if (multiplier) {
      totalPoints += multiplier * activity.Value;
    }
  })

  return Math.round(totalPoints);
}


export async function getXpFromTable($userId: string): Promise<number> {

  const sql = `
    SELECT XP
    FROM Player
    WHERE DiscordID = $userId
  `;

  return dbGet<{ XP: number }>(sql, { $userId })
    .then(row => row?.XP || 0);
}

export async function getTotalXp(userId: string) {
  const xp = await getXpFromTable(userId);
  return getTotalPoints(userId)
    .then(points => getXp(points) + xp);
}
