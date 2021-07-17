import { dbGet, dbRun } from "./promiseWrapper"

export const XP_REWARD = 500;

interface XPReward {
  DiscordID: string;
  XP: number;
}

export function setFragmentReward($userID: string, $upperLimit: number) {
  const sql = `
  UPDATE Player
  SET FragmentReward = $upperLimit
  WHERE DiscordID = $userID
  `

  return dbRun(sql, { $userID, $upperLimit });
}

export async function addXPReward($userID: string, $xp: number) {
  const sql = `
  INSERT INTO FragmentReward (DiscordID, XP)
  VALUES ($userID, $xp)
  ON CONFLICT (DiscordID)
  DO UPDATE SET XP = XP + $xp
  `

  return dbRun(sql, { $userID, $xp });
}

export async function resetXPReward($userID: string) {
  const sql = `
  UPDATE FragmentReward
  SET XP = 0
  WHERE DiscordID = $userID
  `

  return dbRun(sql, { $userID });
}

export async function getXPReward($userID: string) {
  const sql = `
  SELECT XP FROM FragmentReward WHERE DiscordID = $userID
  `
  const result = await dbGet<XPReward>(sql, { $userID });
  return result?.XP;
}
