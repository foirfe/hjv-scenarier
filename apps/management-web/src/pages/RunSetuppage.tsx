import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { apiFetch } from "../api/apiFetch";
import styles from "./RunSetupPage.module.css";

type ScenarioRole = "PARTICIPANT" | "TEAM_LEADER" | "INSTRUCTOR";

type RunStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ABORTED";

type User = {
  id: string;
  username: string;
  displayName: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
};

type RunUser = {
  role: ScenarioRole;
  createdAt: string;
  user: User;
};

type ScenarioRun = {
  id: string;
  status: RunStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  scenario: {
    id: string;
    name: string;
    description: string | null;
    status: "DRAFT" | "READY" | "ARCHIVED";
  };
  users: RunUser[];
};

function runStatusLabel(status: RunStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "Ikke startet";
    case "IN_PROGRESS":
      return "I gang";
    case "COMPLETED":
      return "Afsluttet";
    case "ABORTED":
      return "Afbrudt";
    default:
      return status;
  }
}

export default function RunSetupPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState<ScenarioRun | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ScenarioRole>("PARTICIPANT");
  const [savingUser, setSavingUser] = useState(false);
  const [starting, setStarting] = useState(false);

  const loadRun = useCallback(async () => {
    if (!runId) return;

    const [runData, usersData] = await Promise.all([
      apiFetch<ScenarioRun>(`/scenario-runs/${runId}`),
      apiFetch<User[]>("/users"),
    ]);

    setRun(runData);
    setUsers(usersData);
  }, [runId]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");
        await loadRun();
      } catch {
        setError("Kunne ikke hente afviklingen");
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [loadRun]);

  const assignedUserIds = new Set(
    run?.users.map((runUser) => runUser.user.id) ?? []
  );

  const availableUsers = users.filter(
    (user) => user.status === "ACTIVE" && !assignedUserIds.has(user.id)
  );

  async function addUser() {
    if (!runId || !selectedUserId) return;
    try {
      setSavingUser(true);
      setError("");

      await apiFetch(`/scenario-runs/${runId}/users`, {
        method: "POST",
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      });
      setSelectedUserId("");
      setSelectedRole("PARTICIPANT");
      await loadRun();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Brugeren kunne ikke tilføjes"
      );
    } finally {
      setSavingUser(false);
    }
  }

  async function updateUserRole(userId: string, role: ScenarioRole) {
    if (!runId) return;
    try {
      setError("");
      await apiFetch(`/scenario-runs/${runId}/user/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await loadRun();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Rollen kunne ikke ændres"
      );
    }
  }

  async function removeUser(user: User) {
    if (!runId) return;
    const confirmed = window.confirm(
      `Vil du fjerne ${user.displayName} fra afviklingen?`
    );
    if (!confirmed) return;
    try {
      setError("");
      await apiFetch(`/scenario-runs/${runId}/user`, {
        method: "DELETE",
        body: JSON.stringify({ userId: user.id }),
      });
      await loadRun();
    } catch {
      setError("Brugeren kunne ikke fjernes");
    }
  }

  async function startRun() {
    if (!runId || !run) return;
    const confirmed = window.confirm(
      "Vil du starte afviklingen? Brugere og roller kan ikke længere ændres bagefter."
    );

    if (!confirmed) return;
    try {
      setStarting(true);
      setError("");
      await apiFetch(`/scenario-runs/${runId}/start`, {
        method: "PATCH",
      });
      await loadRun();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Afviklingen kunne ikke startes"
      );
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return <div className={styles.runSetupPage}>Henter afvikling...</div>;
  }

  if (error && !run) {
    return <div className={styles.runSetupPage}>{error}</div>;
  }

  if (!run) {
    return <div className={styles.runSetupPage}>Afviklingen blev ikke fundet.</div>;
  }

  return (
    <div className={styles.runSetupPage}>
      <header className={styles.header}>
        <div>
          <button onClick={() => navigate("/runs")}>
            &larr; Afviklinger
          </button>

          <h1>{run.scenario.name}</h1>

          <p>{run.scenario.description ?? "Ingen beskrivelse"}</p>
        </div>

        <div className={styles.headerActions}>
          <span className={styles.statusBadge}>
            {runStatusLabel(run.status)}
          </span>

          {run.status === "NOT_STARTED" && (
            <button
              className={styles.startButton}
              disabled={starting}
              onClick={() => void startRun()}
            >
              {starting ? "Starter..." : "Start afvikling"}
            </button>
          )}
        </div>
      </header>

      {error && <p className={styles.errorMessage}>{error}</p>}

      <section className={styles.usersSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Brugere</h2>
            <p>Tildel roller til deltagerne før afviklingen startes.</p>
          </div>

          <span>{run.users.length} brugere</span>
        </div>

        {run.status === "NOT_STARTED" && (
          <div className={styles.addUser}>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Vælg bruger...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName} - {u.username}
                </option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ScenarioRole)}
            >
              <option value="PARTICIPANT">Deltager</option>
              <option value="TEAM_LEADER">Holdleder</option>
              <option value="INSTRUCTOR">Instruktør</option>
            </select>

            <button
              disabled={!selectedUserId || savingUser}
              onClick={() => void addUser()}
            >
              {savingUser ? "Tilføjer..." : "+ Tilføj"}
            </button>
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Navn</th>
                <th>Brugernavn</th>
                <th>Rolle i afviklingen</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {run.users.map((runUser) => (
                <tr key={runUser.user.id}>
                  <td>
                    <strong>{runUser.user.displayName}</strong>
                  </td>

                  <td>{runUser.user.username}</td>

                  <td>
                    <select
                      value={runUser.role}
                      disabled={run.status !== "NOT_STARTED"}
                      onChange={(e) =>
                        void updateUserRole(
                          runUser.user.id,
                          e.target.value as ScenarioRole
                        )
                      }
                    >
                      <option value="PARTICIPANT">Deltager</option>
                      <option value="TEAM_LEADER">Holdleder</option>
                      <option value="INSTRUCTOR">Instruktør</option>
                    </select>
                  </td>

                  <td>
                    {run.status === "NOT_STARTED" && (
                      <button
                        className={styles.removeButton}
                        onClick={() => void removeUser(runUser.user)}
                      >
                        Fjern
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}