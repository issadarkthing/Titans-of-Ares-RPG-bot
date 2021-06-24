import { dbAll } from "./promiseWrapper";


export function getUsers() {

  const sql = `
  SELECT DISTINCT CAST (DiscordID AS text) as DiscordID
  FROM ChallengeEntry
  `

  return dbAll<{ DiscordID: string }>(sql);
}
