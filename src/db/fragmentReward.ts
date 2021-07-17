import { dbRun } from "./promiseWrapper"

export const XP_REWARD = 500;

export function setFragmentReward($userID: string, $upperLimit: number) {
  const sql = `
  UPDATE Player
  SET FragmentReward = $upperLimit
  WHERE DiscordID = $userID
  `

  return dbRun(sql, { $userID, $upperLimit });
}
