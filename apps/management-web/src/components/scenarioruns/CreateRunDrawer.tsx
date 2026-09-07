import {
    useEffect,
    useState,
    type SubmitEvent,
} from "react";

import { apiFetch } from "../../api/apiFetch";
import styles from "./RunDrawer.module.css";

type Scenario = {
    id: string;
    name: string;
    description: string | null;
    status:
    | "DRAFT"
    | "READY"
    | "ARCHIVED";

    _count: {
        scenarioTasks: number;
    };
};

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
};

export default function CreateRunDrawer({
    open,
    onClose,
    onCreated,
}: Props) {
    const [scenarios, setScenarios] =
        useState<Scenario[]>([]);

    const [scenarioId, setScenarioId] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        async function loadScenarios() {
            try {
                setLoading(true);

                const data =
                    await apiFetch<Scenario[]>(
                        "/scenarios",
                    );

                setScenarios(
                    data.filter(
                        (scenario) =>
                            scenario.status ===
                            "READY",
                    ),
                );
            } catch {
                setError(
                    "Kunne ikke hente scenarier",
                );
            } finally {
                setLoading(false);
            }
        }

        void loadScenarios();
    }, [open]);

    async function handleSubmit(
        event: SubmitEvent,
    ) {
        event.preventDefault();

        if (!scenarioId) {
            setError(
                "Vælg et scenarie",
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            await apiFetch(
                "/scenario-runs",
                {
                    method: "POST",
                    body: JSON.stringify({
                        scenarioId,
                    }),
                },
            );

            setScenarioId("");
            onCreated();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Afviklingen kunne ikke oprettes",
            );
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

   return (
    <div className={styles.drawerLayer}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label="Luk"
      />

      <aside className={styles.drawer}>
        <form onSubmit={handleSubmit}>
          <header className={styles.header}>
            <div>
              <h2>Opret afvikling</h2>

              <p>
                Vælg det scenarie, der skal oprettes en afvikling af.
              </p>
            </div>

            <button type="button" onClick={onClose}>
              x
            </button>
          </header>

          <div className={styles.content}>
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <label>
              <span>Scenarie *</span>

              <select
                value={scenarioId}
                onChange={(event) =>
                  setScenarioId(
                    event.target.value,
                  )
                }
                disabled={loading}
              >
                <option value="">
                  Vælg scenarie...
                </option>

                {scenarios.map(
                  (scenario) => (
                    <option
                      key={scenario.id}
                      value={scenario.id}
                    >
                      {scenario.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            {scenarioId && (
              <div className={styles.infoBox}>
                {scenarios.find(
                  (scenario) =>
                    scenario.id === scenarioId,
                )?._count.scenarioTasks ?? 0}{" "}
                opgaver i scenariet.
              </div>
            )}

            <div className={styles.infoBox}>
              Brugere og roller tilføjes,
              før afviklingen startes.
            </div>
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
            >
              Annuller
            </button>

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Opretter..."
                : "Opret afvikling"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}