import { db } from "../index";
import promisify from "./promiseWrapper";

interface Row {
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

  return promisify<Row>(db, sql);
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
