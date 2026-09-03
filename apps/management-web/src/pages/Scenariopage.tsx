import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import PageHeader from "../components/Pageheader";
import { apiFetch } from "../api/apiFetch";
import CreateScenarioDrawer from "../components/scenarios/CreateScenarioDrawer";
import styles from "./ScenarioPage.module.css";

type ScenarioStatus =
    | "DRAFT"
    | "READY"
    | "ARCHIVED";

type Scenario = {
    id: string;
    name: string;
    description: string | null;
    status: ScenarioStatus;

    _count: {
        scenarioTasks: number;
    };

    createdAt: string;
    updatedAt: string;
};

export default function ScenariosPage() {
    const [scenarios, setScenarios] =
        useState<Scenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] =
        useState<"" | ScenarioStatus>("");
    const [createOpen, setCreateOpen] =
        useState(false);
    const navigate = useNavigate();
    const getScenariosData = useCallback(async () => {
        return await apiFetch<Scenario[]>("/scenarios");
    }, []);
    const refreshScenarios = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getScenariosData();
            setScenarios(data);
        } catch {
            setError("Kunne ikke hente scenarier");
        } finally {
            setLoading(false);
        }
    }, [getScenariosData]);

    useEffect(() => {
        let isMounted = true;
        getScenariosData()
            .then((data) => {
                if (isMounted) {
                    setScenarios(data);
                    setError("");
                }
            })
            .catch(() => {
                if (isMounted) {
                    setError("Kunne ikke hente scenarier");
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
    }, [getScenariosData]);
    const handleCreated = () => {
        setCreateOpen(false);
        refreshScenarios();
    };

    const filteredScenarios =
        scenarios.filter((scenario) => {
            const searchValue =
                search.toLowerCase();

            const matchesSearch =
                scenario.name
                    .toLowerCase()
                    .includes(searchValue) ||
                (
                    scenario.description
                        ?.toLowerCase()
                        .includes(searchValue) ?? false
                );

            const matchesStatus =
                status === "" ||
                scenario.status === status;

            return matchesSearch && matchesStatus;
        });

    return (
        <div className={styles.scenariosPage}>
            <PageHeader
                title="Scenarier"
                description="Opret og administrér øvelsesscenarier"
                actions={
                    <div className={styles.actionButtons}>
                    <button
                    className={styles.createButton}
                        onClick={() => setCreateOpen(true)}
                    >
                        + Nyt scenarie
                    </button>
                    </div>
                }
            />
            <section className={styles.statusTabs}>
                <button
                    className={
                        status === "" ? styles.active : ""
                    }
                    onClick={() => setStatus("")}
                >
                    Alle
                    <span>{scenarios.length}</span>
                </button>

                <button
                    className={
                        status === "DRAFT"
                            ? styles.active
                            : ""
                    }
                    onClick={() => setStatus("DRAFT")}
                >
                    Kladder
                    <span>
                        {
                            scenarios.filter(
                                (scenario) =>
                                    scenario.status === "DRAFT",
                            ).length
                        }
                    </span>
                </button>

                <button
                    className={
                        status === "READY"
                            ? styles.active
                            : ""
                    }
                    onClick={() => setStatus("READY")}
                >
                    Klar
                    <span>
                        {
                            scenarios.filter(
                                (scenario) =>
                                    scenario.status === "READY",
                            ).length
                        }
                    </span>
                </button>

                <button
                    className={
                        status === "ARCHIVED"
                            ? styles.active
                            : ""
                    }
                    onClick={() => setStatus("ARCHIVED")}
                >
                    Arkiverede
                    <span>
                        {
                            scenarios.filter(
                                (scenario) =>
                                    scenario.status === "ARCHIVED",
                            ).length
                        }
                    </span>
                </button>
            </section>
            <section className={styles.toolbar}>
                <input
                    type="search"
                    placeholder="Søg på navn eller beskrivelse..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                />
            </section>
            <section className={styles.content}>
                {loading && <p>Henter scenarier...</p>}

                {error && (
                    <p className={styles.error}>
                        {error}
                    </p>
                )}

                {!loading && !error && (
                    <>
                        <span>
                            {filteredScenarios.length === 1
                                ? "1 resultat"
                                : `${filteredScenarios.length} resultater`}
                        </span>

                        <table className={styles.tableWrapper}>
                            <thead>
                                <tr>
                                    <th>Navn</th>
                                    <th>Beskrivelse</th>
                                    <th>Opgaver</th>
                                    <th>Status</th>
                                    <th>Ændret</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredScenarios.map(
                                    (scenario) => (
                                        <tr key={scenario.id}>
                                            <td>
                                                <strong>
                                                    {scenario.name}
                                                </strong>
                                            </td>

                                            <td className={styles.scenarioDescription}>
                                                {scenario.description ??
                                                    "—"}
                                            </td>

                                            <td>
                                                {
                                                    scenario._count
                                                        .scenarioTasks
                                                }
                                            </td>

                                            <td >
                                                <span
                                                    className={`${styles.statusBadge} ${scenario.status === "READY"
                                                        ? styles.statusReady
                                                        : scenario.status === "ARCHIVED"
                                                            ? styles.statusArchived
                                                            : styles.statusDraft
                                                        }`}
                                                >
                                                    {scenario.status === "READY"
                                                        ? "Klar"
                                                        : scenario.status === "ARCHIVED"
                                                            ? "Arkiveret"
                                                            : "Kladde"}
                                                </span>
                                            </td>

                                            <td>
                                                {new Intl.DateTimeFormat(
                                                    "da-DK",
                                                    {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    },
                                                ).format(
                                                    new Date(
                                                        scenario.updatedAt,
                                                    ),
                                                )}
                                            </td>

                                            <td>
                                                <button className={styles.editButton}
                                                    onClick={()=> navigate(`/scenarios/${scenario.id}`)}>
                                                    Redigér
                                                </button>
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </>
                )}
            </section>
            <CreateScenarioDrawer
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => {
                    handleCreated()
                }}
            />
        </div>
    );
}