import { deleteTimer, getAllTimers, getTimer, setEnergy, setTimer, TimerType } from "../db/cooldowns";
import { DateTime } from "luxon";

export const timerPeriod = 8; // hours

export async function energyMainLoop() {

  const timers = await getAllTimers(TimerType.Charge);

  for (const timer of timers) {

    const expire = DateTime.fromISO(timer.Expires);
    const now = DateTime.now();

    // if the timer is expired
    if (now > expire) {

      deleteTimer(TimerType.Charge, timer.DiscordID);
      const energy = await setEnergy(timer.DiscordID, 1);
      if (energy < 3) {
        const expiryDate = now.plus({ hours: timerPeriod }).toISO();
        setTimer(TimerType.Charge, timer.DiscordID, expiryDate);
      }
    }
  }
}

export async function showTimeLeft(userID: string) {
  const timer = await getTimer(TimerType.Charge, userID);
  if (!timer) return "";
  const expiryDate = DateTime.fromISO(timer.Expires);
  const diff = expiryDate.diffNow();
  return diff.toFormat("`(hh:mm:ss)`");
}
