import type {RunTask} from "../types/scenarioRun";
import type {UserPosition} from "../hooks/useGeolocation";
import {getDistanceMeters} from "../utils/getDistanceMeters";
import {getBearingDegrees} from "../utils/getBearingDegrees";
import styles from "./GeoGuide.module.css"

type GeoGuideProps = {
  tasks: RunTask[];
  position: UserPosition | null;
  heading: number | null;
  compassEnabled: boolean;
  onEnableCompass: () => void;
  compassError: string | null;
};

export default function GeoGuide({
  tasks,
  position,
  heading,
  compassEnabled,
  onEnableCompass,
  compassError,
}: GeoGuideProps) {
  if (!position) {
    return null;
  }

  const geoTasks = tasks.filter(
    (task) =>
      task.status === "AVAILABLE" &&
      task.activationMode === "GEO" &&
      task.latitude !== null &&
      task.longitude !== null &&
      task.radiusMeters !== null,
  );

  if (geoTasks.length === 0) {
    return null;
  }

  const targets = geoTasks
    .map((task) => {
      const latitude =
        Number(task.latitude);

      const longitude =
        Number(task.longitude);

      return {
        task,
        latitude,
        longitude,

        distance:
          getDistanceMeters(
            position.latitude,
            position.longitude,
            latitude,
            longitude,
          ),
      };
    })
    .sort(
      (a, b) =>
        a.distance - b.distance,
    );

  const target = targets[0];

  const bearing =
    getBearingDegrees(
      position.latitude,
      position.longitude,
      target.latitude,
      target.longitude,
    );

  const arrowRotation = heading === null ? bearing : (bearing - heading + 360) % 360;

 return (
  <section className={styles.guide}>
    <div className={styles.header}>
      <div>
        <span className={styles.eyebrow}>
          Nærmeste GPS-post
        </span>

        <h3>{target.task.name}</h3>
      </div>

      <span className={styles.gpsAccuracy}>
        GPS ±{Math.round(position.accuracy)} m
      </span>
    </div>

    <div className={styles.compass}>
      <span className={styles.north}>N</span>

      <div
        className={styles.arrow}
        style={{
          transform: `rotate(${arrowRotation}deg)`,
        }}
        aria-hidden="true"
      >
        ↑
      </div>

      <div className={styles.compassCenter} />
    </div>

    <div className={styles.distance}>
      <strong>
        {Math.round(target.distance)}
      </strong>
      <span>meter til posten</span>
    </div>

    <div className={styles.radius}>
      Aktiveres inden for{" "}
      <strong>{target.task.radiusMeters} m</strong>
    </div>

    {!compassEnabled && (
      <button
        type="button"
        className={styles.compassButton}
        onClick={onEnableCompass}
      >
        Aktivér kompas
      </button>
    )}

    {compassError && (
      <p className={styles.error} role="alert">
        {compassError}
      </p>
    )}
  </section>
);
}