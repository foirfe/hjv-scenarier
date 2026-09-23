import {
  useCallback,
  useEffect,
  useState,
} from "react";

type DeviceOrientationEventWithCompass =
  DeviceOrientationEvent & {
    webkitCompassHeading?: number;
    webkitCompassAccuracy?: number;
  };

type OrientationEventConstructor =
  typeof DeviceOrientationEvent & {
    requestPermission?: (
      absolute?: boolean,
    ) => Promise<
      "granted" | "denied"
    >;
  };

function normalizeDegrees(
  degrees: number,
) {
  return (
    ((degrees % 360) + 360) %
    360
  );
}

function smoothHeading(
  previous: number,
  next: number,
  factor = 0.2,
) {
  const difference =
    ((next -
      previous +
      540) %
      360) -
    180;

  return normalizeDegrees(
    previous +
    difference * factor,
  );
}

function getCompassHeading(
  event: DeviceOrientationEvent,
): number | null {
  const compassEvent =
    event as DeviceOrientationEventWithCompass;

  // iPhone / Safari
  if (
    typeof compassEvent.webkitCompassHeading ===
    "number" &&
    Number.isFinite(
      compassEvent.webkitCompassHeading,
    )
  ) {
    return normalizeDegrees(
      compassEvent.webkitCompassHeading,
    );
  }

  // Android / standard absolute orientation
  const isAbsolute =
    event.type ===
    "deviceorientationabsolute" ||
    event.absolute === true;

  if (
    isAbsolute &&
    event.alpha !== null
  ) {
    return normalizeDegrees(
      360 - event.alpha,
    );
  }

  // BRUGES TIL LOKAL UDVIKLING
  if (
    import.meta.env.DEV &&
    event.alpha !== null
  ) {
    return normalizeDegrees(
      360 - event.alpha,
    );
  }

  return null;
}

export function useDeviceHeading() {
  const [heading, setHeading] =
    useState<number | null>(null);

  const [enabled, setEnabled] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const requestPermission =
    useCallback(async () => {
      if (
        typeof DeviceOrientationEvent ===
        "undefined"
      ) {
        setError(
          "Denne enhed understøtter ikke kompas.",
        );

        return;
      }

      try {
        const OrientationEvent =
          DeviceOrientationEvent as OrientationEventConstructor;

        if (
          typeof OrientationEvent.requestPermission ===
          "function"
        ) {
          const permission =
            await OrientationEvent.requestPermission(
              true,
            );

          if (
            permission !==
            "granted"
          ) {
            setError(
              "Adgang til kompas blev afvist.",
            );

            return;
          }
        }

        setHeading(null);
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
      const nextHeading =
        getCompassHeading(event);

      if (
        nextHeading === null
      ) {
        return;
      }

      setHeading(
        (previous) =>
          previous === null
            ? nextHeading
            : smoothHeading(
              previous,
              nextHeading,
            ),
      );
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