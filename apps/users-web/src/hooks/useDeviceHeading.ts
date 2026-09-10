import {useCallback,useEffect,useState} from "react";

type DeviceOrientationEventWithCompass =
  DeviceOrientationEvent & {
    webkitCompassHeading?: number;
  };

export function useDeviceHeading() {
  const [heading, setHeading] =
    useState<number | null>(null);

  const [enabled, setEnabled] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const requestPermission =
    useCallback(async () => {
      try {
        const OrientationEvent =
          DeviceOrientationEvent as typeof DeviceOrientationEvent & {
            requestPermission?: () =>
              Promise<"granted" | "denied">;
          };

        if (
          typeof OrientationEvent.requestPermission ===
          "function"
        ) {
          const permission =
            await OrientationEvent.requestPermission();

          if (permission !== "granted") {
            setError(
              "Adgang til kompas blev afvist.",
            );

            return;
          }
        }

        setEnabled(true);
        setError(null);
      } catch {
        setError(
          "Kompasset kunne ikke aktiveres.",
        );
      }
    }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleOrientation(
      event: DeviceOrientationEvent,
    ) {
      const compassEvent =
        event as DeviceOrientationEventWithCompass;

      if (
        typeof compassEvent.webkitCompassHeading ===
        "number"
      ) {
        setHeading(
          compassEvent.webkitCompassHeading,
        );

        return;
      }

      if (event.alpha !== null) {
        setHeading(
          (360 - event.alpha) % 360,
        );
      }
    }

    window.addEventListener(
      "deviceorientationabsolute",
      handleOrientation,
      true,
    );

    window.addEventListener(
      "deviceorientation",
      handleOrientation,
      true,
    );

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
        true,
      );

      window.removeEventListener(
        "deviceorientation",
        handleOrientation,
        true,
      );
    };
  }, [enabled]);

  return {
    heading,
    enabled,
    error,
    requestPermission,
  };
}