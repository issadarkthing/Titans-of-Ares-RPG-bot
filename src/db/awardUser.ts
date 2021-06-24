import { dbRun } from "./promiseWrapper";

export function award($userId: string, $amount: number) {

  const sql = `
    INSERT INTO XP(DiscordID, XP)
    VALUES ( $userId, $amount )
    ON CONFLICT(DiscordID)
    DO UPDATE SET XP = XP + $amount
  `

  return dbRun(sql, { $userId, $amount });
}
