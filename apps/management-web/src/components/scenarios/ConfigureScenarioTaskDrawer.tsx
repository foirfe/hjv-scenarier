import { useState, type SubmitEvent } from "react";

import { apiFetch } from "../../api/apiFetch";
import styles from "./ConfigureScenarioTaskDrawer.module.css";

type ActivationMode = "GEO" | "AUTOMATIC" | "MANUAL";

type ScenarioTask = {
  id: string;
  activationMode: ActivationMode;

  latitude: string | null;
  longitude: string | null;
  radiusMeters: number | null;

  task: {
    id: string;
    name: string;
    description: string | null;
  };
  dependencies: {
    prerequisiteTaskId: string;
  }[];
};

type Props = {
  scenarioId: string;
  scenarioTask: ScenarioTask | null;
  scenarioTasks: ScenarioTask[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export default function ConfigureScenarioTaskDrawer({
  scenarioId,
  scenarioTask,
  scenarioTasks,
  onClose,
  onSaved,
}: Props) {
  const [activationMode, setActivationMode] = useState<ActivationMode>(scenarioTask?.activationMode ?? "AUTOMATIC");
  const [latitude, setLatitude] = useState(scenarioTask?.latitude ?? "");
  const [longitude, setLongitude] = useState(scenarioTask?.longitude ?? "");
  const [radiusMeters, setRadiusMeters] = useState(
    scenarioTask?.radiusMeters !== null && scenarioTask?.radiusMeters !== undefined
      ? String(scenarioTask.radiusMeters)
      : ""
  );
  const [prerequisiteIds, setPrerequisiteIds] = useState<string[]>(scenarioTask?.dependencies.map((dependency) => dependency.prerequisiteTaskId,) ?? [],);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  const availablePrerequisites =
    scenarioTasks.filter(
      (task) =>
        task.id !== scenarioTask?.id,
    );

  function togglePrerequisite(id: string) {
    setPrerequisiteIds((current) =>
      current.includes(id)
        ? current.filter(
          (currentId) =>
            currentId !== id,
        )
        : [...current, id],
    );
  }
  //HELPER TIL AKTIVERINGSLABEL
  function activationLabel(
    mode: ActivationMode,
  ) {
    switch (mode) {
      case "GEO":
        return "GPS";
      case "AUTOMATIC":
        return "Automatisk";
      case "MANUAL":
        return "Manuel";
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!scenarioTask) return;

    if (activationMode === "GEO") {
      if (!latitude || !longitude || !radiusMeters) {
        setError("GPS-aktivering kræver latitude, longitude og radius");
        return;
      }

      const latitudeNumber = Number(latitude);
      const longitudeNumber = Number(longitude);
      const radiusNumber = Number(radiusMeters);

      if (
        Number.isNaN(latitudeNumber) ||
        latitudeNumber < -90 ||
        latitudeNumber > 90
      ) {
        setError("Latitude skal være mellem -90 og 90");
        return;
      }

      if (
        Number.isNaN(longitudeNumber) ||
        longitudeNumber < -180 ||
        longitudeNumber > 180
      ) {
        setError("Longitude skal være mellem -180 og 180");
        return;
      }

      if (Number.isNaN(radiusNumber) || radiusNumber <= 0) {
        setError("Radius skal være større end 0 meter");
        return;
      }
    }
    const originalPrerequisiteIds =
      scenarioTask.dependencies.map(
        (dependency) =>
          dependency.prerequisiteTaskId,
      );

    const dependenciesToAdd =
      prerequisiteIds.filter(
        (id) =>
          !originalPrerequisiteIds.includes(
            id,
          ),
      );

    const dependenciesToRemove =
      originalPrerequisiteIds.filter(
        (id) =>
          !prerequisiteIds.includes(id),
      );

    try {
      setSaving(true);
      setError("");
      await apiFetch(
        `/scenarios/${scenarioId}/tasks/${scenarioTask.id}/activation`,
        {
          method: "PATCH",
          body: JSON.stringify({
            activationMode,
            ...(activationMode === "GEO"
              ? {
                latitude: Number(latitude),
                longitude: Number(longitude),
                radiusMeters: Number(radiusMeters),
              }
              : {}),
          }),
        }
      );
      await Promise.all([
        ...dependenciesToAdd.map(
          (prerequisiteTaskId) =>
            apiFetch(
              `/scenarios/${scenarioId}/tasks/${scenarioTask.id}/dependencies`,
              {
                method: "POST",

                body: JSON.stringify({
                  prerequisiteTaskId,
                }),
              },
            ),
        ),

        ...dependenciesToRemove.map(
          (prerequisiteTaskId) =>
            apiFetch(
              `/scenarios/${scenarioId}/tasks/${scenarioTask.id}/dependencies/${prerequisiteTaskId}`,
              {
                method: "DELETE",
              },
            ),
        ),
      ]);
      await onSaved();
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError("Opgavens konfiguration kunne ikke gemmes");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!scenarioTask) {
    return null;
  }

  return (
    <div className={styles.drawerLayer}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Luk"
        onClick={onClose}
      />

      <aside className={styles.drawer}>
        <form onSubmit={handleSubmit}>
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>Konfigurer opgave</span>

              <h2>{scenarioTask.task.name}</h2>

              {scenarioTask.task.description && (
                <p>{scenarioTask.task.description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
            >
              x
            </button>
          </header>

          <div className={styles.content}>
            {error && <div className={styles.error}>{error}</div>}

            <section>
              <h3>Aktivering</h3>

              <p className={styles.hint}>
                Vælg hvordan opgaven bliver aktiveret under scenariet.
              </p>

              <div className={styles.activationOptions}>
                <label
                  className={`${styles.activationCard} ${activationMode === "AUTOMATIC" ? styles.selected : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="activationMode"
                    value="AUTOMATIC"
                    checked={activationMode === "AUTOMATIC"}
                    onChange={() => setActivationMode("AUTOMATIC")}
                  />

                  <div>
                    <strong>Automatisk</strong>
                    <span>
                      Opgaven aktiveres automatisk, når dens forudsætninger er
                      opfyldt.
                    </span>
                  </div>
                </label>

                <label
                  className={`${styles.activationCard} ${activationMode === "GEO" ? styles.selected : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="activationMode"
                    value="GEO"
                    checked={activationMode === "GEO"}
                    onChange={() => setActivationMode("GEO")}
                  />
                  <div>
                    <strong>GPS-position</strong>
                    <span>
                      Opgaven bliver tilgængelig, når deltageren befinder sig
                      inden for området.
                    </span>
                  </div>
                </label>

                <label
                  className={`${styles.activationCard} ${activationMode === "MANUAL" ? styles.selected : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="activationMode"
                    value="MANUAL"
                    checked={activationMode === "MANUAL"}
                    onChange={() => setActivationMode("MANUAL")}
                  />

                  <div>
                    <strong>Manuel</strong>

                    <span>
                      Opgaven aktiveres manuelt af en instruktør under
                      scenarieafviklingen.
                    </span>
                  </div>
                </label>
              </div>
            </section>

            {activationMode === "GEO" && (
              <section className={styles.geoSection}>
                <div>
                  <h3>GPS-område</h3>

                  <p className={styles.hint}>
                    Angiv centrum og radius for aktiveringsområdet.
                  </p>
                </div>

                <div className={styles.coordinates}>
                  <label>
                    <span>Latitude *</span>

                    <input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={latitude}
                      onChange={(event) => setLatitude(event.target.value)}
                      placeholder="55.512345"
                      required
                    />
                  </label>

                  <label>
                    <span>Longitude *</span>

                    <input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={longitude}
                      onChange={(event) => setLongitude(event.target.value)}
                      placeholder="9.712345"
                      required
                    />
                  </label>
                </div>

                <label>
                  <span>Aktiveringsradius *</span>
                  <div className={styles.radiusInput}>
                    <input
                      type="number"
                      min="1"
                      value={radiusMeters}
                      onChange={(event) => setRadiusMeters(event.target.value)}
                      placeholder="100"
                      required
                    />

                    <span>meter</span>
                  </div>
                </label>
              </section>
            )}
            <section className={styles.dependenciesSection}>
              <h3>Forudsætninger</h3>

              <p className={styles.hint}>
                Opgaven bliver først tilgængelig,
                når alle valgte forudsætninger er
                gennemført.
              </p>

              {availablePrerequisites.length > 0 ? (
                <div className={styles.dependenciesList}>
                  {availablePrerequisites.map(
                    (task) => (
                      <label
                        key={task.id}
                        className={
                          styles.dependencyOption
                        }
                      >
                        <input
                          type="checkbox"
                          checked={prerequisiteIds.includes(
                            task.id,
                          )}
                          onChange={() =>
                            togglePrerequisite(
                              task.id,
                            )
                          }
                        />

                        <div>
                          <strong>
                            {task.task.name}
                          </strong>

                          <span>
                            {activationLabel(
                              task.activationMode,
                            )}
                          </span>
                        </div>
                      </label>
                    ),
                  )}
                </div>
              ) : (
                <p className={styles.hint}>
                  Der er ingen andre opgaver i
                  scenariet endnu.
                </p>
              )}
            </section>
          </div>

          <footer className={styles.footer}>
            <button type="button" onClick={onClose}>
              Annuller
            </button>

            <button
              type="submit"
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? "Gemmer..." : "Gem konfiguration"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}