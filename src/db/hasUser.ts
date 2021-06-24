import { dbAll } from "./promiseWrapper";


export default async function($userId: string) {

  const sql = `
    SELECT 1
    FROM ChallengeEntry
    WHERE DiscordID = $userId
  `
  const result = await dbAll(sql, { $userId });
  return result.length > 0;
}
