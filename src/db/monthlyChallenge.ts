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

interface Conversion {
  Name: string;
  PointsValue: number;
  DailyLimit: number;
  ChallengeID: number;
}

export async function getConversions() {

  const sql = `
  SELECT ChallengeId, Name, PointsValue, DailyLimit
  FROM Conversion
  `

  return dbAll<Conversion>(sql);
}

export async function getConvertTable() {

  const conversions = await getConversions();
  const convertTable = new Map<string, number>();

  conversions.forEach(convert => {
    const tag = `${convert.Name}-${convert.ChallengeID}`;
    convertTable.set(tag, convert.PointsValue);
  })

  return convertTable;
}
