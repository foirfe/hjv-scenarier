export function getBearingDegrees(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const toRadians = (degrees: number) =>
    degrees * (Math.PI / 180);

  const toDegrees = (radians: number) =>
    radians * (180 / Math.PI);

  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);

  const deltaLongitude = toRadians(
    longitude2 - longitude1,
  );

  const y =
    Math.sin(deltaLongitude) *
    Math.cos(lat2);

  const x =
    Math.cos(lat1) *
      Math.sin(lat2) -
    Math.sin(lat1) *
      Math.cos(lat2) *
      Math.cos(deltaLongitude);

  const bearing =
    toDegrees(Math.atan2(y, x));

  return (bearing + 360) % 360;
}