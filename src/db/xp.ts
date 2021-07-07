import { dbRun } from "./promiseWrapper";

export function addXP($userId: string, $amount: number) {

  const sql = `
    INSERT INTO Player(DiscordID, XP)
    VALUES ($userId, $amount)
    ON CONFLICT(DiscordID)
    DO UPDATE SET XP = XP + $amount
  `

  return dbRun(sql, { $userId, $amount });
}
