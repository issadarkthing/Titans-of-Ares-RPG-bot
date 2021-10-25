import { dbAll, dbGet, dbRun } from "./promiseWrapper";

export type ChallengeName =
    "steps"
  | "cyclingkm"
  | "cyclingmi"
  | "meditation"
  | "weightlift"
  | "ringbonus"
  | "weekstreak"
  | "levelup"
  | "rankup"
  | "workout"
  | "othercardio"
  | "strength"
  | "yoga10"
  | "yoga30"
  | "meditation10"
  | "meditation30"
  | "rowingkm"
  | "rowingmi"
  | "get10walks"
  | "get10cycling"
  | "readabook"
  | "diary"
  | "workoutselfie"
;

export async function getChallengeId($channelId: string) {

  const sql = `
    SELECT ID
    FROM Challenge
    WHERE ProofChannel = $channelId
  `

  const result = await dbAll<{ID: number}>(sql, { $channelId });
  return result[0]?.ID;
}

export async function getChallengeByChannelID($channelId: string) {

  const sql = `
    SELECT *
    FROM Challenge
    WHERE ProofChannel = $channelId
  `

  return dbGet<Challenge>(sql, { $channelId });
}

export interface Challenge {
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
  Month: number;
  Year: number;
}

export interface DayEntry {
  ID: number;
  EntryID: number;
  Day: number;
  ValueType: ChallengeName;
  Value: number;
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
    BronzeCutoff,
    Month,
    Year
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

export async function getEntryID($userID: string, $challengeID: number) {
  const sql = `
    SELECT ID
    FROM ChallengeEntry
    WHERE DiscordID = $userID AND ChallengeID = $challengeID
  `;

  const result = await dbGet<{ ID?: number }>(sql, { $userID, $challengeID });
  return result?.ID;
}

export async function registerChallenge($userID: string, $challengeID: number) {
  const sql = `
    INSERT INTO ChallengeEntry (DiscordID, ChallengeID)
    VALUES ($userID, $challengeID)
  `

  return dbRun(sql, { $userID, $challengeID });
}

export async function deleteDayEntry(
  $userID: string,
  $day: number,
  $challengeID: number,
  $challengeName: ChallengeName,
) {
  const sql = `
    DELETE FROM DayEntry
    WHERE EntryID = $entryID AND Day = $day AND ValueType = $challengeName
  `

  const $entryID = await getEntryID($userID, $challengeID);

  return dbRun(sql, { $entryID, $day, $challengeName });
}

export async function replaceDayEntry(
  $userID: string,
  $day: number,
  $challengeID: number,
  $challengeName: ChallengeName,
  $value: number,
) {
  const sql = `
    UPDATE DayEntry
    SET Value = $value
    WHERE EntryID = $entryID AND Day = $day AND ValueType = $challengeName
  `

  const $entryID = await getEntryID($userID, $challengeID);

  return dbRun(sql, { $entryID, $day, $challengeName, $value });
}

export async function addDayEntry(
  $userID: string,
  $day: number,
  $challengeID: number,
  $challengeName: ChallengeName,
  $value: number,
) {
  const sql = `
    UPDATE DayEntry
    SET Value = Value + $value
    WHERE EntryID = $entryID AND Day = $day AND ValueType = $challengeName
  `

  const $entryID = await getEntryID($userID, $challengeID);

  return dbRun(sql, { $entryID, $day, $challengeName, $value });
}

export async function getDayEntries($userID: string, $challengeID: number) {
  const sql = `
    SELECT *
    FROM DayEntry
    WHERE EntryID = $entryID
  `
  const $entryID = await getEntryID($userID, $challengeID);

  return dbAll<DayEntry>(sql, { $entryID });
}

export class OverlapError extends Error {
  dayEntry: DayEntry;

  constructor(dayEntry: DayEntry) {
    super("overlap error");
    this.dayEntry = dayEntry;
  }
}

/**
 * Adds point for a particular challenge, day and challenge type.
 * Throws DayEntry there is conflict. Conflict should be handled.
 * */
export async function registerDayEntry(
  $userID: string,
  $day: number,
  $challengeID: number,
  $valueType: ChallengeName,
  $value: number,
) {

  let $entryID = await getEntryID($userID, $challengeID);

  if ($entryID === undefined) {
    $entryID = await registerChallenge($userID, $challengeID);
  }

  let sql = `
    SELECT * FROM DayEntry
    WHERE EntryID = $entryID AND Day = $day AND ValueType = '${$valueType}'
  `

  const conflict = await dbGet<DayEntry>(sql, { $entryID, $day });

  if (conflict !== undefined) {
    throw new OverlapError(conflict);
  }

  sql = `
    INSERT INTO DayEntry (EntryID, Day, ValueType, Value)
    VALUES ($entryID, $day, '${$valueType}', $value)
  `

  return dbRun(sql, { $entryID, $day, $value });
}
