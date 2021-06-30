import {
  deleteTimer,
  getAllTimers,
  getTimer,
  setEnergy,
  setTimer,
  TimerType,
} from "../db/timer";
import { DateTime, DurationInput } from "luxon";

export const ENERGY_TIMEOUT: DurationInput = { hours: 8 };
export const MAX_ENERGY = 5;

export async function energyMainLoop() {
  const timers = await getAllTimers(TimerType.Energy);

  for (const timer of timers) {
    const now = DateTime.now();

    // if the timer is expired
    if (isExpired(timer.Expires)) {
      deleteTimer(TimerType.Energy, timer.DiscordID);
      const energy = await setEnergy(timer.DiscordID, 1);
      if (energy < MAX_ENERGY) {
        const expiryDate = now.plus(ENERGY_TIMEOUT).toISO();
        setTimer(TimerType.Energy, timer.DiscordID, expiryDate);
      }
    }
  }
}

// Check if the date is expired. Accepts ISO date string as the only argument.
export function isExpired(expiryDate: string) {
  const expire = DateTime.fromISO(expiryDate);
  return expire.diffNow(["seconds"]).seconds <= 0;
}

export async function showTimeLeft(timerType: TimerType, userID: string) {
  const timer = await getTimer(timerType, userID);
  if (!timer) return "";
  const expiryDate = DateTime.fromISO(timer.Expires);
  const diff = expiryDate.diffNow();
  return diff.toFormat("`(hh:mm:ss)`");
}
