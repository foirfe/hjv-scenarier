import type {UserPosition} from "../hooks/useGeolocation";

type GpsStatusProps = {
  supported: boolean;
  locating: boolean;
  position: UserPosition | null;
  error: string | null;
  activationError: string | null;
};

export default function GpsStatus({
  supported,
  locating,
  position,
  error,
  activationError,
}: GpsStatusProps) {
  if (!supported) {
    return (
      <p role="status">
        GPS understøttes ikke af denne browser.
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert">
        {error}
      </p>
    );
  }

  if (locating) {
    return (
      <p role="status">
        Finder din position...
      </p>
    );
  }

  return (
    <div aria-live="polite">
      {position && (
        <p>
          GPS aktiv
          {" · "}
          nøjagtighed ca.{" "}
          {Math.round(
            position.accuracy,
          )} m
        </p>
      )}

      {activationError && (
        <p role="alert">
          {activationError}
        </p>
      )}
    </div>
  );
}