import { db } from "../index";
import promiseWrapper from "./promiseWrapper";


export function getUsers() {

  const sql = `
  SELECT DISTINCT CAST (DiscordID AS text) as DiscordID
  FROM ChallengeEntry
  `

  return promiseWrapper<{ DiscordID: string }>(db, sql);
}
