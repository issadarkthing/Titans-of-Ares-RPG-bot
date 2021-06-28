import {
  deleteTimer,
  getAllTimers,
  getTimer,
  setEnergy,
  setTimer,
  TimerType,
} from "../db/cooldowns";
import { DateTime, DurationInput } from "luxon";

export const ENERGY_TIMEOUT: DurationInput = { hours: 8 };
export const MAX_ENERGY = 5;

export async function energyMainLoop() {
  const timers = await getAllTimers(TimerType.Charge);

  for (const timer of timers) {
    const expire = DateTime.fromISO(timer.Expires);
    const now = DateTime.now();

    // if the timer is expired
    if (expire.diffNow(["seconds"]).seconds <= 0) {
      deleteTimer(TimerType.Charge, timer.DiscordID);
      const energy = await setEnergy(timer.DiscordID, 1);
      if (energy < MAX_ENERGY) {
        const expiryDate = now.plus(ENERGY_TIMEOUT).toISO();
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
