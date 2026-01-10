export function isLocationSuspicious(uploadTime, gpsTime, accuracy) {
  if (Math.abs(uploadTime - gpsTime) > 2 * 60 * 1000) return true;
  if (accuracy > 100) return true;
  return false;
}
