export let DM: string | null = null;
export const DMHistory = new Map<string, string[]>();
export function AddToDMHistory(user: string, value: string) {
  if (!DMHistory.has(user)) {
    DMHistory.set(user, [value]);
  } else {
    DMHistory.get(user)!.push(value);
  }
}
export function SetDM(value: string | null) {
  DM = value;
}
