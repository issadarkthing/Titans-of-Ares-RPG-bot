import { getActivity } from "./getActivity";
import { getConvertTable } from "./getConversions";


export async function getTotalPoints(userId: string) {

  const activities = await getActivity(userId);
  const convertTable = await getConvertTable();

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
