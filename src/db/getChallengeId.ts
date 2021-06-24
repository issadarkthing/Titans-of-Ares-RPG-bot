import { dbAll } from "./promiseWrapper";

export async function getChallengeId($channelId: string) {

  const sql = `
    SELECT ID
    FROM Challenge
    WHERE ProofChannel = $channelId
  `

  const result = await dbAll<{ID: string}>(sql, { $channelId });
  return result[0]?.ID;
}
