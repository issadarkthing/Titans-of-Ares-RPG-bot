import { getActivity } from "./getActivity";
import { getConversions } from "./getConversions";


export async function getTotalPoints(userId: string) {

  const activities = await getActivity(userId);
  const conversions = await getConversions();
  const convertTable = new Map<string, number>();

  conversions.forEach(convert => {
    const tag = `${convert.Name}-${convert.ChallengeID}`;
    convertTable.set(tag, convert.PointsValue);
  })

  let totalPoints = 0;

  activities.forEach(activity => {
    const tag = `${activity.ValueType}-${activity.ChallengeID}`;
    const multiplier = convertTable.get(tag);
    if (multiplier) {
      totalPoints += multiplier * activity.Value;
    }
  })

  return Math.round(totalPoints);
}
