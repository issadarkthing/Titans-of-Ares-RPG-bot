import { db } from "../index";
import promiseWrapper from "./promiseWrapper";


export async function getChallengeId(channelId: string) {

  const sql = `
    SELECT ID
    FROM Challenge
    WHERE ProofChannel = ${channelId}
  `

  const result = await promiseWrapper<{ID: string}>(db, sql);
  return result[0]?.ID;
}
