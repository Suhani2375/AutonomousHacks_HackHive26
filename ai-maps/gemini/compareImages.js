export function isCleaned(before, after) {
  if (!before.hasWaste) return false;

  if (!after.hasWaste && after.confidence > 0.7) {
    return true;
  }

  if (after.severity === "green" && after.confidence > 0.8) {
    return true;
  }

  return false;
}
