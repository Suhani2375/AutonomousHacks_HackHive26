export function getPriority(severity) {
  if (severity === "red") return "IMMEDIATE";
  if (severity === "yellow") return "URGENT";
  return "ROUTINE";
}
