import {
  useEffect,
  useState,
  useCallback
} from "react";

import PageHeader from "../components/Pageheader";
import { apiFetch } from "../api/apiFetch";
import CreateRunDrawer from "../components/scenarioruns/CreateRunDrawer";
import styles from "./RunsPage.module.css";
import { useNavigate } from "react-router";


type RunStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABORTED";

type ScenarioRun = {
  id: string;
  status: RunStatus;

  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;

  scenario: {
    id: string;
    name: string;
    status:
      | "DRAFT"
      | "READY"
      | "ARCHIVED";
  };

  _count: {
    users: number;
    tasks: number;
  };
};

export default function RunsPage() {
  const [runs, setRuns] = useState<ScenarioRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

    const getRunsData = useCallback(async () => {return await apiFetch<ScenarioRun[]>("/scenario-runs");
    }, []);

    const refreshRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getRunsData();
      setRuns(data);
    } catch {
      setError("Kunne ikke hente afviklinger");
    } finally {
      setLoading(false);
    }
  }, [getRunsData]);

  useEffect(() => {
    let isMounted = true;
    getRunsData()
      .then((data) => {
        if (isMounted) {
          setRuns(data);
          setError("");
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Kunne ikke hente opgaver");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [getRunsData]);

    const handleCreated = () => {
    setCreateOpen(false);
    refreshRuns();
  };


  //RUN STATUS HELPER FUNKTION
  function runStatusLabel(
  status: RunStatus,
) {
  switch (status) {
    case "NOT_STARTED":
      return "Ikke startet";

    case "IN_PROGRESS":
      return "I gang";

    case "COMPLETED":
      return "Afsluttet";

    case "ABORTED":
      return "Afbrudt";
  }
}

  return (
    <div className={styles.page}>
      <PageHeader
        title="Afviklinger"
        description="Opret og administrér aktive og tidligere scenarieafviklinger"
        actions={
            <div className={styles.actionButtons}>
          <button
            className={
              styles.createButton
            }
            onClick={() =>
              setCreateOpen(true)
            }
          >
            + Ny afvikling
          </button>
          </div>
        }
      />

     <section className={styles.content}>
  {loading && (
    <p>Henter afviklinger...</p>
  )}

  {error && (
    <p className={styles.error}>
      {error}
    </p>
  )}

  {!loading && !error && (
    <table>
      <thead>
        <tr>
          <th>Scenarie</th>
          <th>Status</th>
          <th>Brugere</th>
          <th>Oprettet</th>
          <th>Startet</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        {runs.map((run) => (
          <tr key={run.id}>
            <td>
              <strong>
                {run.scenario.name}
              </strong>
            </td>

            <td>
              <span
                className={
                  styles.statusBadge
                }
              >
                {runStatusLabel(
                  run.status,
                )}
              </span>
            </td>

            <td>
              {run._count.users}
            </td>

            <td>
              {new Intl.DateTimeFormat(
                "da-DK",
              ).format(
                new Date(
                  run.createdAt,
                ),
              )}
            </td>

            <td>
              {run.startedAt
                ? new Intl.DateTimeFormat(
                    "da-DK",
                    {
                      dateStyle: "short",
                      timeStyle: "short",
                    },
                  ).format(
                    new Date(
                      run.startedAt,
                    ),
                  )
                : "—"}
            </td>

            <td>
              <button onClick={()=>
                navigate(`/runs/${run.id}`)
              }>
                Åbn
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</section>

      <CreateRunDrawer
        open={createOpen}
        onClose={() =>
          setCreateOpen(false)
        }
        onCreated={() => {
         handleCreated()
        }}
      />
    </div>
  );
}