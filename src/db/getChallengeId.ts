import { dbAll, dbGet } from "./promiseWrapper";

export async function getChallengeId($channelId: string) {

  const sql = `
    SELECT ID
    FROM Challenge
    WHERE ProofChannel = $channelId
  `

  const result = await dbAll<{ID: number}>(sql, { $channelId });
  return result[0]?.ID;
}

interface Challenge {
  ID: number;
  Name: string;
  Days: number;
  Goal: number;
  ProofChannel: string;
  LeaderBoardChannel: string;
  Active: number;
  GoldCutoff: number;
  SilverCutoff: number;
  BronzeCutoff: number;
}

export async function getCurrentChallenge() {
  const sql = `
  SELECT
    ID,
    Name,
    Days,
    Goal,
    CAST(ProofChannel AS TEXT) AS ProofChannel,
    CAST(LeaderBoardChannel AS TEXT) AS LeaderBoardChannel,
    Active,
    GoldCutoff,
    SilverCutoff,
    BronzeCutoff
  FROM Challenge 
  ORDER BY ID DESC LIMIT 1
  `

  return dbGet<Challenge>(sql);
}
