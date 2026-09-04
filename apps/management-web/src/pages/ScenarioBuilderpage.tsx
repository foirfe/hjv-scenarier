import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router";

import { apiFetch } from "../api/apiFetch";
import styles from "./ScenarioBuilderPage.module.css";
import ConfigureScenarioTaskDrawer from "../components/scenarios/ConfigureScenarioTaskDrawer";

type ActivationMode =
    | "GEO"
    | "AUTOMATIC"
    | "MANUAL";

type TaskStatus =
    | "ACTIVE"
    | "DRAFT"
    | "ARCHIVED";

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
};

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
        instructions: string;
        status: TaskStatus;
        answerType: string | null;
        environmentId: number;
        taskTypeId: number;
    };

    dependencies: {
        prerequisiteTaskId: string;
    }[];
};

type Scenario = {
    id: string;
    name: string;
    description: string | null;
    status:
    | "DRAFT"
    | "READY"
    | "ARCHIVED";
    createdAt: string;
    updatedAt: string;
    scenarioTasks: ScenarioTask[];
};

export default function ScenarioBuilderPage() {
    const { scenarioId } = useParams();
    const navigate = useNavigate();
    //STATES
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [addingTaskId, setAddingTaskId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState("");
    const [draftDescription, setDraftDescription] = useState("");
    const [draftStatus, setDraftStatus] = useState<Scenario["status"]>("DRAFT");
    const [editingName, setEditingName] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [savingScenario, setSavingScenario] = useState(false);
    const [configuringTask, setConfiguringTask] = useState<ScenarioTask | null>(null);

    const getBuilderData = useCallback(async () => {
        const [scenario, tasks] = await Promise.all([
            apiFetch<Scenario>(`/scenarios/${scenarioId}`),
            apiFetch<Task[]>("/tasks"),
        ]);
        return { scenario, tasks };
    }, [scenarioId]);

    const loadBuilder = useCallback(
        async (syncDraft = false) => {
            const {
                scenario: scenarioData,
                tasks: taskData,
            } = await getBuilderData();
            setScenario({
                ...scenarioData,
                scenarioTasks:
                    scenarioData.scenarioTasks ?? [],
            });

            setTasks(taskData);
            setError("");

            if (syncDraft) {
                setDraftName(scenarioData.name);
                setDraftDescription(
                    scenarioData.description ?? "",
                );
                setDraftStatus(scenarioData.status);
            }
        },
        [getBuilderData],
    );
    useEffect(() => {
        async function initBuilder() {
            try {
                setLoading(true);
                await loadBuilder(true);
            } catch (caughtError: unknown) {
                console.error(
                    "Builder-data kunne ikke hentes:",
                    caughtError,
                );
                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : "Kunne ikke hente scenariet",
                );
            } finally {
                setLoading(false);
            }
        }
        void initBuilder();
    }, [loadBuilder]);


    
    const addedTaskIds = new Set(
        scenario?.scenarioTasks.map(
            (scenarioTask) =>
                scenarioTask.task.id,
        ) ?? [],
    );

    const availableTasks = tasks.filter(
        (task) => {
            const value =
                search.toLowerCase();
            const matchesSearch =
                task.name
                    .toLowerCase()
                    .includes(value) ||
                (
                    task.description?.toLowerCase().includes(value) ?? false
                );
            const canUse =
                task.status === "ACTIVE";
            const alreadyAdded =
                addedTaskIds.has(task.id);
            return (
                matchesSearch &&
                canUse &&
                !alreadyAdded
            );
        },
    );
    async function addTask(taskId: string) {
        if (!scenarioId) return;
        try {
            setAddingTaskId(taskId);
            setError("");
            await apiFetch(
                `/scenarios/${scenarioId}/tasks`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        taskId,
                        activationMode: "AUTOMATIC",
                    }),
                },
            );
            await loadBuilder(false);
        } catch {
            setError(
                "Opgaven kunne ikke tilføjes",
            );
        } finally {
            setAddingTaskId(null);
        }
    }
    const hasUnsavedChanges =
        scenario !== null &&
        (
            draftName !== scenario.name ||
            draftDescription !==
            (scenario.description ?? "") ||
            draftStatus !== scenario.status
        );

    async function saveScenario() {
        if (
            !scenarioId ||
            !scenario ||
            !hasUnsavedChanges
        ) {
            return;
        }

        if (!draftName.trim()) {
            setError(
                "Scenariet skal have et navn",
            );
            return;
        }

        try {
            setSavingScenario(true);
            setError("");

            await apiFetch(
                `/scenarios/${scenarioId}`,
                {
                    method: "PATCH",

                    body: JSON.stringify({
                        name: draftName.trim(),

                        description:
                            draftDescription.trim() ||
                            null,

                        status: draftStatus,
                    }),
                },
            );

            await loadBuilder(true);
        } catch {
            setError(
                "Ændringerne kunne ikke gemmes",
            );
        } finally {
            setSavingScenario(false);
        }
    }

    function handleBack() {
        if (
            hasUnsavedChanges &&
            !window.confirm(
                "Du har ugemte ændringer. Vil du forlade siden?",
            )
        ) {
            return;
        }
        navigate("/scenarios");
    }
    if (loading) {
        return (
            <div style={{ padding: "2rem", color: "black" }}>
                Henter scenarie...
            </div>
        );
    }
    if (error) {
        return (
            <div style={{ padding: "2rem", color: "red" }}>
                <h2>Kunne ikke åbne scenariet</h2>
                <pre>{error}</pre>
            </div>
        );
    }
    if (!scenario) {
        return (
            <div style={{ padding: "2rem", color: "black" }}>
                Scenariet blev ikke fundet.
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <button
                        className={styles.backButton}
                        onClick={handleBack}>
                        ← Scenarier
                    </button>
                    {editingName ? (
                        <input
                            className={styles.titleInput}
                            value={draftName}
                            autoFocus
                            onChange={(event) =>
                                setDraftName(event.target.value)
                            }
                            onBlur={() => setEditingName(false)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    setEditingName(false);
                                }
                                if (event.key === "Escape") {
                                    setDraftName(scenario.name);
                                    setEditingName(false);
                                }
                            }}
                        />
                    ) : (
                        <button
                            type="button"
                            className={styles.editableTitle}
                            onClick={() => setEditingName(true)}
                        >
                            {draftName}
                        </button>
                    )}
                    {editingDescription ? (
                        <input
                            className={styles.descriptionInput}
                            value={draftDescription}
                            autoFocus
                            onChange={(event) =>
                                setDraftDescription(
                                    event.target.value,
                                )
                            }
                            onBlur={() =>
                                setEditingDescription(false)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    setEditingDescription(false);
                                }

                                if (event.key === "Escape") {
                                    setDraftDescription(
                                        scenario.description ?? "",
                                    );

                                    setEditingDescription(false);
                                }
                            }}
                        />
                    ) : (
                        <button
                            type="button"
                            className={styles.editableDescription}
                            onClick={() =>
                                setEditingDescription(true)
                            }
                        >
                            {draftDescription ||
                                "Klik for at tilføje en beskrivelse"}
                        </button>
                    )}
                </div>
                <div className={styles.headerActions}>
                    <select
                        className={styles.statusSelect}
                        value={draftStatus}
                        onChange={(event) =>
                            setDraftStatus(
                                event.target.value as
                                "DRAFT" | "READY",
                            )
                        }
                    >
                        <option value="DRAFT">
                            Kladde
                        </option>

                        <option value="READY">
                            Klar
                        </option>
                    </select>
                    <div className={styles.saveArea}>
                        {hasUnsavedChanges && (
                            <span
                                className={styles.unsavedDot}
                                title="Der er ugemte ændringer"
                            />
                        )}

                        <button
                            disabled={
                                !hasUnsavedChanges ||
                                savingScenario
                            }
                            onClick={() =>
                                void saveScenario()
                            }
                        >
                            {savingScenario
                                ? "Gemmer..."
                                : "Gem ændringer"}
                        </button>
                    </div>
                </div>
            </header>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.builder}>
                <aside className={styles.taskLibrary}>
                    <h2>Opgavebibliotek</h2>
                    <p>
                        Tilføj eksisterende opgaver
                        til scenariet.
                    </p>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value,
                            )
                        }
                        placeholder="Søg efter opgave..."
                    />
                    <div
                        className={styles.taskList}
                    >
                        {availableTasks.map(
                            (task) => (
                                <article key={task.id} className={styles.libraryTask}>
                                    <div>
                                        <strong>
                                            {task.name}
                                        </strong>

                                        <span>
                                            {task.taskType?.name ?? "Ukendt opgavetype"}
                                        </span>

                                        <small>
                                            {task.environment?.name ?? "Ukendt miljø"}
                                        </small>
                                    </div>

                                    <button
                                        disabled={
                                            addingTaskId ===
                                            task.id
                                        }
                                        onClick={() =>
                                            void addTask(task.id)
                                        }
                                    >
                                        {addingTaskId === task.id ? "..." : "+ Tilføj"}
                                    </button>
                                </article>
                            ),
                        )}

                        {availableTasks.length === 0 && (
                            <p> Ingen tilgængelige opgaver.</p>
                        )}
                    </div>
                </aside>

                <main
                    className={styles.scenarioTasks}
                >
                    <div className={styles.scenarioTasksHeader}>
                        <div>
                            <h2>
                                Scenariets opgaver
                            </h2>

                            <span>{scenario.scenarioTasks.length}{" "}opgaver</span>
                        </div>
                    </div>

                    <div className={styles.scenarioTaskList}>
                        {scenario.scenarioTasks.map(
                            (scenarioTask) => (
                                <article
                                    key={scenarioTask.id}
                                    className={styles.scenarioTask}>
                                    <div>
                                        <strong>
                                            {scenarioTask.task.name}
                                        </strong>
                                        <p>{scenarioTask.task.description}</p>
                                    </div>

                                    <div className={styles.taskMeta}>
                                        <span>{scenarioTask.activationMode}</span>
                                        {scenarioTask.dependencies.length > 0 && (<span> {scenarioTask.dependencies.length}{" "}afhængighed(er)</span>)}
                                        <button onClick={() => setConfiguringTask(scenarioTask)}>
                                            Konfigurer
                                        </button>
                                    </div>
                                </article>
                            ),
                        )}

                        {scenario.scenarioTasks.length === 0 && (
                            <div className={styles.empty}>
                                <strong>
                                    Scenariet har ingen
                                    opgaver endnu
                                </strong>
                                <p>
                                    Tilføj en opgave fra
                                    biblioteket til venstre.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <ConfigureScenarioTaskDrawer
                key={configuringTask?.id ?? "closed"}
                scenarioId={scenario.id}
                scenarioTask={configuringTask}
                scenarioTasks={scenario.scenarioTasks}
                onClose={() =>
                    setConfiguringTask(null)
                }
                onSaved={async () => {
                    setConfiguringTask(null);
                    await loadBuilder(false);
                }}
            />
        </div>
    )
}