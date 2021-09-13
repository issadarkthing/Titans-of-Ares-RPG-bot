import { dbRun } from "./promiseWrapper"

export function setFragmentReward($userID: string, $upperLimit: number) {
  const sql = `
  UPDATE Player
  SET FragmentReward = $upperLimit
  WHERE DiscordID = $userID
  `

  return dbRun(sql, { $userID, $upperLimit });
}
