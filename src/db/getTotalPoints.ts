import { getActivity } from "./getActivity";
import { getConversions } from "./getConversions";


export async function getTotalPoints(userId: string) {

  const activities = await getActivity(userId);
  const conversions = await getConversions();
  const convertTable = new Map<string, number>();

  conversions.forEach(convert => {
    convertTable.set(convert.Name + convert.ChallengeId, convert.PointsValue);
  })

  let totalPoints = 0;

  activities.forEach(activity => {
    const multiplier = convertTable.get(activity.ValueType);
    if (multiplier) {
      totalPoints += multiplier * activity.Value;
    }
  })

  return totalPoints;
}
