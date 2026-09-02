import PageHeader from "../components/Pageheader"
import CreateTaskDrawer from "../components/tasks/CreateTaskDrawer";
import EditTaskDrawer from "../components/tasks/EditTaskDrawer";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../api/apiFetch";
import styles from "./TasksPage.module.css"


type TaskStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";
type Task = {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  status: TaskStatus;
  answerType: string | null;
  environment: {
    id: number;
    name: string;
  };
  taskType: {
    id: number;
    code: string;
    name: string;
  };
  _count: {
    scenarioTasks: number;
  };

  createdAt: string;
  updatedAt: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [environment, setEnvironment] = useState("");
  const [taskType, setTaskType] = useState("");
  const [taskStatus, setTaskStatus] =
    useState<"" | TaskStatus>("");
  const [editTaskId, setEditTaskId] =
    useState<string | null>(null);

  const getTasksData = useCallback(async () => {
    return await apiFetch<Task[]>("/tasks");
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getTasksData();
      setTasks(data);
    } catch {
      setError("Kunne ikke hente opgaver");
    } finally {
      setLoading(false);
    }
  }, [getTasksData]);

  useEffect(() => {
    let isMounted = true;
    getTasksData()
      .then((data) => {
        if (isMounted) {
          setTasks(data);
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
  }, [getTasksData]);
  const handleCreated = () => {
    setCreateOpen(false);
    refreshTasks();
  };
  //FILTER OG SØGNING 
  const filteredTasks = tasks.filter((task) => {
    const value = search.toLowerCase();
    const matchesSearch =
      task.name.toLowerCase().includes(value) ||
      (task.description?.toLowerCase().includes(value) ?? false) ||
      task.environment.name.toLowerCase().includes(value);

    const matchesEnvironment =
      environment === "" ||
      task.environment.name === environment;

    const matchesTaskType =
      taskType === "" ||
      task.taskType.name === taskType;

    const matchesStatus =
      taskStatus === "" ||
      task.status === taskStatus;

    return (
      matchesSearch &&
      matchesEnvironment &&
      matchesTaskType &&
      matchesStatus
    );
  });
  return (
    <div className={styles.tasksPage}>
      <PageHeader
        title="Opgaver"
        description="Administrér genanvendelige opgaveskabeloner til øvelsesscenarier"
        actions={
          <div className={styles.actionButtons}>
            <button className={styles.importButton}>Importer Excel</button>
            <button className={styles.createButton} onClick={() => setCreateOpen(true)}>+ Ny Opgave</button>
          </div>
        }
      />
      <section className={styles.tasksStatusTabs}>
        <button
          className={taskStatus === "" ? styles.active : ""}
          onClick={() => setTaskStatus("")}
        >
          Alle opgaver
          <span>{tasks.length}</span>
        </button>

        <button
          className={taskStatus === "ACTIVE" ? styles.active : ""}
          onClick={() => setTaskStatus("ACTIVE")}
        >
          Aktive
          <span>{tasks.filter((task) => task.status === "ACTIVE").length}</span>
        </button>

        <button
          className={taskStatus === "DRAFT" ? styles.active : ""}
          onClick={() => setTaskStatus("DRAFT")}
        >
          Kladder
          <span>{tasks.filter((task) => task.status === "DRAFT").length}</span>
        </button>

        <button
          className={taskStatus === "ARCHIVED" ? styles.active : ""}
          onClick={() => setTaskStatus("ARCHIVED")}
        >
          Arkiverede
          <span>{tasks.filter((task) => task.status === "ARCHIVED").length}</span>
        </button>
      </section>

      <section className={styles.tasksToolbar}>
        <input
          type="search"
          placeholder="Søg på navn, beskrivelse eller miljø..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={environment}
          onChange={(event) => setEnvironment(event.target.value)}
        >
          <option value="">{environment ? "Nulstil filter" : "Miljø"}</option>
          <option value="Maritim">Maritim</option>
          <option value="Kyst">Kyst</option>
          <option value="Havn">Havn</option>
        </select>

        <select
          value={taskType}
          onChange={(event) => setTaskType(event.target.value)}
        >
          <option value="">{taskType ? "Nulstil filter" : "Opgavetyper"}</option>
          <option value="Observation">Observation</option>
          <option value="Procedureøvelse">Procedureøvelse</option>
          <option value="Tjekliste">Tjekliste</option>
        </select>
      </section>

      <section className={styles.tasksContent}>
        {loading && <p>Henter opgaver...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <>
            <span>
              {filteredTasks.length === 1
                ? "1 resultat"
                : `${filteredTasks.length} resultater`}
            </span>
            <table className={styles.tableWrapper}>
              <thead>
                <tr>
                  <th>Navn</th>
                  <th>Miljø</th>
                  <th>Beskrivelse</th>
                  <th>Scenarier</th>
                  <th>Status</th>
                  <th>Ændret</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.name}</strong>
                        <div>{task.taskType.name}</div>
                      </td>
                      <td>{task.environment.name}</td>
                      <td className={styles.taskDescription}>{task.description ?? "N/A"}</td>
                      <td>{task._count.scenarioTasks || "N/A"}</td>
                      <td>  
                      <span
                        className={`${styles.statusBadge} ${task.status === "ACTIVE" ? styles.statusActive:task.status === "ARCHIVED" ? styles.statusArchived  : styles.statusDraft }`}>                        
                                  {task.status === "ACTIVE" ? "Aktiv" : task.status === "ARCHIVED" ? "Arkiveret": "Kladde"}
                        </span>
                        </td>
                      <td>
                        {new Intl.DateTimeFormat("da-DK", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(task.updatedAt))}
                      </td>
                      <td>
                        <button
                        className={styles.editButton}
                          onClick={() => setEditTaskId(task.id)}
                        >
                          Redigér
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>Ingen opgaver matcher dine filtre.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </section>
      <CreateTaskDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          handleCreated()
        }}
      />
      <EditTaskDrawer
  taskId={editTaskId}
  onClose={() => setEditTaskId(null)}
  onUpdated={() => {
    setEditTaskId(null);
    handleCreated()
  }}
/>
    </div>
  );
}
