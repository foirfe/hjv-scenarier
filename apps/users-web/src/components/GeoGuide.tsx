import { useState } from "react";
import type { RunTask } from "../types/scenarioRun";
import type { UserPosition } from "../hooks/useGeolocation";
import { getDistanceMeters } from "../utils/getDistanceMeters";
import { getBearingDegrees } from "../utils/getBearingDegrees";
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);


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

  const selectedTarget =
    targets.find(
      (target) =>
        target.task.id ===
        selectedTaskId,
    );

  const target = selectedTarget ?? targets[0];

  const bearing =
    getBearingDegrees(
      position.latitude,
      position.longitude,
      target.latitude,
      target.longitude,
    );

  const compassReady = compassEnabled && heading !== null;

  const arrowRotation = compassReady ? (bearing - heading + 360) % 360 : 0;

  const northRotation = compassReady ? -heading : 0;

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

      {targets.length > 1 && (
        <div className={styles.targetSelector }>
          <span>
            Vælg GPS-post
          </span>

          <div className={styles.targetList}>
            {targets.map(
              (candidate) => {
                const selected =
                  candidate.task.id ===
                  target.task.id;

                return (
                  <button
                    key={candidate.task.id}
                    type="button"
                    className={`${styles.targetButton} ${selected ? styles.targetButtonActive : ""}`}
                    onClick={() => setSelectedTaskId(candidate.task.id)}>
                    <span>
                      {candidate.task.name}
                    </span>

                    <strong>
                      {Math.round(candidate.distance)}{" "}
                      m
                    </strong>
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}

      <div className={`${styles.compass} ${!compassReady ? styles.compassInactive : ""}`}>
        {compassReady ? (
          <>
            <div
              className={styles.northOrbit}
              style={{ transform: `rotate(${northRotation}deg)`, }}>
              <span className={styles.north} style={{ transform: `translateX(-50%) rotate(${heading}deg)` }}>
                N
              </span>
            </div>

            <div
              className={styles.arrow}
              style={{ transform: `rotate(${arrowRotation}deg)` }}
              aria-hidden="true"
            >
              ↑
            </div>

            <div className={styles.compassCenter} />
          </>
        ) : (
          <span className={styles.compassPlaceholder}>
            {compassEnabled
              ? "Finder retning..."
              : "Kompas ikke aktiveret"}
          </span>
        )}
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