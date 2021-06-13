import { db } from "../index";
import promiseWrapper from "./promiseWrapper";


export default async function(userId: string) {

  const sql = `
    SELECT 1
    FROM ChallengeEntry
    WHERE DiscordID = ${userId}
  `
  const result = await promiseWrapper(db, sql);
  return result.length > 0;
}
