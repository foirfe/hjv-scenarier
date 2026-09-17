import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { apiFetch } from "../api/apiFetch";
import styles from "./RunSetupPage.module.css";

type ScenarioRole = "PARTICIPANT" | "TEAM_LEADER" | "INSTRUCTOR";

type RunStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ABORTED";

type TaskProgressStatus = "LOCKED" | "AVAILABLE" | "ACTIVE" | "COMPLETED";

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
  name: string | null;
  status: RunStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  tasks: RunTask[];
  scenario: {
    id: string;
    name: string;
    description: string | null;
    status: "DRAFT" | "READY" | "ARCHIVED";
  };
  users: RunUser[];
};

type RunTaskProgress = {
  userId: string;
  status: TaskProgressStatus;
  availableAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

type RunTask = {
  id: string;
  name: string;
  activationMode:
  | "GEO"
  | "AUTOMATIC"
  | "MANUAL";

  progress: RunTaskProgress[];
};
//HELPERS
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

function scenarioRoleLabel(
  role: ScenarioRole,
) {
  switch (role) {
    case "PARTICIPANT":
      return "Deltager";

    case "TEAM_LEADER":
      return "Holdleder";

    case "INSTRUCTOR":
      return "Instruktør";
  }
}

function getUserProgress(
  run: ScenarioRun,
  userId: string,
) {
  const progress = run.tasks.flatMap(
    (task) =>
      task.progress.filter(
        (row) => row.userId === userId,
      ),
  );

  const completed = progress.filter((row) => row.status === "COMPLETED",).length;
  const active = progress.filter((row) => row.status === "ACTIVE",).length;
  const available = progress.filter((row) => row.status === "AVAILABLE",).length;
  const locked = progress.filter((row) => row.status === "LOCKED",).length;
  const total = progress.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100,);
  return {
    completed,
    active,
    available,
    locked,
    total,
    percentage,
  };
}

export default function RunSetupPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState<ScenarioRun | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [runName, setRunName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ScenarioRole>("PARTICIPANT");
  const [savingUser, setSavingUser] = useState(false);
  const [starting, setStarting] = useState(false);
  const [runAction, setRunAction] = useState<"complete" | "abort" | null>(null);

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
  //EDIT OG GEM NYT SCENARIE NAVN
  function startEditingName() {
    setRunName(run?.name ?? run?.scenario.name ?? "");
    setEditingName(true);
  }

  async function saveRunName() {
    if (!runId) return;
    try {
      setSavingName(true);
      setError("");
      await apiFetch(
        `/scenario-runs/${runId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name:
              runName.trim() || null,
          }),
        },
      );
      setEditingName(false);
      await loadRun();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Navnet kunne ikke gemmes",
      );
    } finally {
      setSavingName(false);
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

  async function completeRun() {
    if (
      !runId ||
      !run ||
      run.status !== "IN_PROGRESS"
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Vil du afslutte afviklingen? Deltagerne kan ikke fortsætte bagefter.",
    );

    if (!confirmed) return;

    try {
      setRunAction("complete");
      setError("");

      await apiFetch(
        `/scenario-runs/${runId}/complete`,
        {
          method: "PATCH",
        },
      );

      await loadRun();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Afviklingen kunne ikke afsluttes",
      );
    } finally {
      setRunAction(null);
    }
  }

  async function abortRun() {
    if (
      !runId ||
      !run ||
      run.status !== "IN_PROGRESS"
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Vil du afbryde afviklingen? Den markeres som afbrudt, og deltagerne kan ikke fortsætte.",
    );

    if (!confirmed) return;

    try {
      setRunAction("abort");
      setError("");

      await apiFetch(
        `/scenario-runs/${runId}/abort`,
        {
          method: "PATCH",
        },
      );

      await loadRun();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Afviklingen kunne ikke afbrydes",
      );
    } finally {
      setRunAction(null);
    }
  }


  if (loading) {
    return <div className={styles.runSetupPage}>Henter afvikling...</div>;
  }

  if (error && !run) {
    return <div className={styles.runSetupPage}>{error}</div>;
  }

  if (!run) {
    return (
      <div className={styles.runSetupPage}>
        Afviklingen blev ikke fundet.
      </div>
    );
  }

  const trackedUsers = run.users.filter(
    (runUser) =>
      runUser.role !== "INSTRUCTOR",
  );

  const instructorCount = run.users.filter(
    (runUser) =>
      runUser.role === "INSTRUCTOR",
  ).length;

  const allProgress = run.tasks.flatMap(
    (task) => task.progress,
  );

  const completedProgress = allProgress.filter(
    (progress) =>
      progress.status === "COMPLETED",
  ).length;

  const overallPercentage =
    allProgress.length === 0
      ? 0
      : Math.round(
        (completedProgress /
          allProgress.length) *
        100,
      );

  return (
    <div className={styles.runSetupPage}>
      <header className={styles.header}>
        <div>
          <button onClick={() => navigate("/runs")}>
            &larr; Afviklinger
          </button>
          <div className={styles.runTitleArea}>
            <span className={styles.scenarioReference}>
              Scenarie: {run.scenario.name}
            </span>

            {editingName ? (
              <div className={styles.titleEditRow}>
                <input
                  className={styles.titleInput}
                  value={runName}
                  autoFocus
                  onChange={(event) =>
                    setRunName(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void saveRunName();
                    }

                    if (event.key === "Escape") {
                      setRunName(
                        run.name ??
                        run.scenario.name,
                      );
                      setEditingName(false);
                    }
                  }}
                />

                <button
                  type="button"
                  className={styles.saveNameButton}
                  disabled={savingName}
                  onClick={() =>
                    void saveRunName()
                  }
                >
                  {savingName ? "Gemmer..." : "Gem"}
                </button>

                <button
                  type="button"
                  className={styles.cancelNameButton}
                  onClick={() => {
                    setRunName(
                      run.name ??
                      run.scenario.name,
                    );
                    setEditingName(false);
                  }}
                >
                  Annuller
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.editableTitle}
                onClick={startEditingName}
                title="Klik for at redigere navn"
              >
                {run.name ??
                  run.scenario.name}
              </button>
            )}
          </div>
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
          {run.status === "IN_PROGRESS" && (
            <>
              <button
                type="button"
                className={
                  styles.completeRunButton
                }
                disabled={runAction !== null}
                onClick={() =>
                  void completeRun()
                }
              >
                {runAction === "complete"
                  ? "Afslutter..."
                  : "Afslut afvikling"}
              </button>

              <button
                type="button"
                className={
                  styles.abortRunButton
                }
                disabled={runAction !== null}
                onClick={() =>
                  void abortRun()
                }
              >
                {runAction === "abort"
                  ? "Afbryder..."
                  : "Afbryd"}
              </button>
            </>
          )}
        </div>
      </header>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {run.status === "NOT_STARTED" ? (
        <section className={styles.usersSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Brugere</h2>
              <p>
                Tildel roller til deltagerne før
                afviklingen startes.
              </p>
            </div>

            <span>
              {run.users.length} brugere
            </span>
          </div>

          <div className={styles.addUser}>
            <select
              value={selectedUserId}
              onChange={(event) =>
                setSelectedUserId(
                  event.target.value,
                )
              }
            >
              <option value="">
                Vælg bruger...
              </option>

              {availableUsers.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                >
                  {user.displayName} -{" "}
                  {user.username}
                </option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(event) =>
                setSelectedRole(
                  event.target.value as ScenarioRole,
                )
              }
            >
              <option value="PARTICIPANT">
                Deltager
              </option>

              <option value="TEAM_LEADER">
                Holdleder
              </option>

              <option value="INSTRUCTOR">
                Instruktør
              </option>
            </select>

            <button
              disabled={
                !selectedUserId ||
                savingUser
              }
              onClick={() =>
                void addUser()
              }
            >
              {savingUser
                ? "Tilføjer..."
                : "+ Tilføj"}
            </button>
          </div>

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
                {run.users.map(
                  (runUser) => (
                    <tr key={runUser.user.id}>
                      <td>
                        <strong>
                          {runUser.user.displayName}
                        </strong>
                      </td>

                      <td>
                        {runUser.user.username}
                      </td>

                      <td>
                        <select
                          value={
                            runUser.role
                          }
                          onChange={(
                            event,
                          ) =>
                            void updateUserRole(
                              runUser.user.id,
                              event.target
                                .value as ScenarioRole,
                            )
                          }
                        >
                          <option value="PARTICIPANT">
                            Deltager
                          </option>

                          <option value="TEAM_LEADER">
                            Holdleder
                          </option>

                          <option value="INSTRUCTOR">
                            Instruktør
                          </option>
                        </select>
                      </td>

                      <td>
                        <button className={styles.removeButton}
                          onClick={() => void removeUser(runUser.user,)}>
                          Fjern
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className={styles.overview}>

          <div className={styles.metrics}>
            <article className={styles.metricCard} >
              <span>Deltagere</span>

              <strong>
                {trackedUsers.length}
              </strong>

              <small>
                {instructorCount}{" "}
                instruktør(er)
              </small>
            </article>

            <article className={styles.metricCard} >
              <span>Opgaver</span>

              <strong>
                {run.tasks.length}
              </strong>

              <small>
                Snapshot af scenariet
              </small>
            </article>

            <article className={styles.metricCard}>
              <span>Samlet fremgang</span>

              <strong>
                {overallPercentage}%
              </strong>

              <small>
                {completedProgress} /{" "}
                {allProgress.length}{" "}
                gennemført
              </small>
            </article>

            <article className={styles.metricCard}>
              <span>Startet</span>

              <strong
                className={styles.metricDate}
              >
                {run.startedAt
                  ? new Intl.DateTimeFormat(
                    "da-DK",
                    {
                      dateStyle:
                        "short",
                      timeStyle:
                        "short",
                    },
                  ).format(
                    new Date(
                      run.startedAt,
                    ),
                  )
                  : "—"}
              </strong>
            </article>
          </div>


          <div className={styles.overviewSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Deltagerstatus</h2>

                <p>
                  Fremgang for brugerne i
                  den aktuelle
                  afvikling.
                </p>
              </div>

              <button
                className={styles.refreshButton}
                onClick={() => void loadRun()}>
                Opdater
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Navn</th>
                    <th>Rolle</th>
                    <th>
                      Gennemført
                    </th>
                    <th>Aktive</th>
                    <th>Fremgang</th>
                  </tr>
                </thead>

                <tbody>
                  {run.users.map(
                    (runUser) => {
                      const progress = getUserProgress(run, runUser.user.id,);

                      return (
                        <tr key={runUser.user.id}>
                          <td>
                            <strong>
                              {runUser.user.displayName}
                            </strong>

                            <small
                              className={styles.username}>
                              {runUser.user.username}
                            </small>
                          </td>

                          <td>
                            {scenarioRoleLabel(runUser.role,)}
                          </td>

                          {runUser.role ===
                            "INSTRUCTOR" ? (
                            <>
                              <td>—</td>
                              <td>—</td>

                              <td
                                className={styles.muted}>
                                Ingen
                                opgaveprogress
                              </td>
                            </>
                          ) : (
                            <>
                              <td>
                                {
                                  progress.completed
                                }{" "}
                                /{" "}
                                {progress.total}
                              </td>

                              <td>
                                {progress.active}
                              </td>

                              <td>
                                <div
                                  className={styles.progressCell}>
                                  <div className={styles.progressTrack} >
                                    <div
                                      className={styles.progressValue}
                                      style={{ width: `${progress.percentage}%`, }}
                                    />
                                  </div>

                                  <span> {progress.percentage} % </span>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className={styles.overviewSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Opgavestatus</h2>

                <p>
                  Status på tværs af alle
                  deltagere.
                </p>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Opgave</th>
                    <th>
                      Aktivering
                    </th>
                    <th>
                      Gennemført
                    </th>
                    <th>Aktive</th>
                    <th>
                      Tilgængelige
                    </th>
                    <th>Låste</th>
                  </tr>
                </thead>

                <tbody>
                  {run.tasks.map(
                    (task) => {
                      const completed = task.progress.filter((row) => row.status === "COMPLETED",).length;

                      const active = task.progress.filter((row) => row.status === "ACTIVE",).length;

                      const available = task.progress.filter((row) => row.status === "AVAILABLE",).length;

                      const locked = task.progress.filter((row) => row.status === "LOCKED",).length;

                      return (
                        <tr key={task.id}>
                          <td>
                            <strong>
                              {task.name}
                            </strong>
                          </td>

                          <td>
                            {task.activationMode === "GEO" ? "GPS" : task.activationMode === "AUTOMATIC" ? "Automatisk" : "Manuel"}
                          </td>

                          <td>
                            {completed}
                          </td>

                          <td>
                            {active}
                          </td>

                          <td>
                            {available}
                          </td>

                          <td>
                            {locked}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}