// A clock the app reads "now" from. The app uses systemClock; tests pass a
// controllable clock so time-dependent rules (Low, 24-hour Not-sent expiry)
// can be checked at exact moments.

export const systemClock = {
  now: () => new Date(),
};

export function createTestClock(start = new Date()) {
  let current = new Date(start).getTime();
  return {
    now: () => new Date(current),
    set(date) {
      current = new Date(date).getTime();
    },
    advance(ms) {
      current += ms;
    },
  };
}

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
