import {useEffect, useState} from "react";

export type UserPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export function useGeolocation(
  enabled: boolean,
) {
  const supported =
    typeof navigator !== "undefined" &&
    "geolocation" in navigator;

  const [position, setPosition] =
    useState<UserPosition | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !supported) {
      return;
    }

    const watchId =
      navigator.geolocation.watchPosition(
        (result) => {
          setPosition({
            latitude:
              result.coords.latitude,
            longitude:
              result.coords.longitude,
            accuracy:
              result.coords.accuracy,
          });

          setError(null);
        },

        (geoError) => {
          setError(
            getGeolocationErrorMessage(
              geoError,
            ),
          );
        },

        {
          enableHighAccuracy: true,
          maximumAge: 5_000,
          timeout: 15_000,
        },
      );

    return () => {
      navigator.geolocation.clearWatch(
        watchId,
      );
    };
  }, [enabled, supported]);

  return {
    supported,
    position,
    error,

    locating:
      enabled &&
      supported &&
      position === null &&
      error === null,
  };
}

function getGeolocationErrorMessage(
  error: GeolocationPositionError,
) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Adgang til GPS blev afvist.";
    case error.POSITION_UNAVAILABLE:
      return "Din position kunne ikke bestemmes.";
    case error.TIMEOUT:
      return "Det tog for lang tid at finde din position.";
    default:
      return "Der opstod en fejl ved GPS.";
  }
}