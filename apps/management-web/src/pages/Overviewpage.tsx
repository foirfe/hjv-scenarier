import {useEffect, useState} from "react";

import {useNavigate} from "react-router";

import PageHeader from "../components/Pageheader";

import { apiFetch} from "../api/apiFetch";

import styles from "./OverviewPage.module.css";

type OverviewData = {
  counts: {
    activeRuns: number;
    scenarios: number;
    activeTasks: number;
    activeUsers: number;
  };

  activeRuns: {
    id: string;
    name: string | null;
    status: "IN_PROGRESS";
    startedAt: string | null;

    scenario: {
      id: string;
      name: string;
    };

    _count: {
      users: number;
      tasks: number;
    };
  }[];

  attentionScenarios: {
    id: string;
    name: string;

    status:
    | "DRAFT"
    | "READY"
    | "ARCHIVED";

    updatedAt: string;

    _count: {
      scenarioTasks: number;
    };
  }[];
};

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    apiFetch<OverviewData>(
      "/overview",
    )
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Kunne ikke hente oversigten",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Oversigt"
        description="Overblik over scenarier, opgaver og aktive afviklinger"
      />

      <div
        className={styles.content}>
        {loading && (
          <p>
            Henter oversigt...
          </p>
        )}

        {error && (
          <p role="alert">
            {error}
          </p>
        )}

        {data && (
          <>
            <section className={styles.stats}>
              <StatCard
                label="Aktive afviklinger"
                value={data.counts.activeRuns}
                onClick={() =>
                  navigate(
                    "/runs",
                  )
                }
              />

              <StatCard
                label="Scenarier"
                value={data.counts.scenarios}
                onClick={() =>
                  navigate(
                    "/scenarios",
                  )
                }
              />

              <StatCard
                label="Aktive opgaver"
                value={
                  data.counts
                    .activeTasks
                }
                onClick={() =>
                  navigate(
                    "/tasks",
                  )
                }
              />

              <StatCard
                label="Aktive deltagere"
                value={data.counts.activeUsers}
                onClick={() =>
                  navigate(
                    "/users",
                  )
                }
              />
            </section>

            <div className={styles.grid} >
              <section className={styles.panel} >
                <div className={styles.panelHeader} >
                  <div>
                    <span className={styles.eyebrow}>
                      Live
                    </span>

                    <h2>
                      Aktive afviklinger
                    </h2>
                  </div>

                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => navigate("/runs")}>
                    Se alle
                  </button>
                </div>

                {data.activeRuns
                  .length === 0 ? (
                  <EmptyState
                    text="Ingen aktive afviklinger lige nu."
                    buttonLabel="Gå til afviklinger"
                    onClick={() => navigate("/runs")}
                  />
                ) : (
                  <div
                    className={
                      styles.list
                    }
                  >
                    {data.activeRuns.map(
                      (run) => (
                        <button
                          key={run.id}
                          type="button"
                          className={styles.listItem}
                          onClick={() => navigate(`/runs/${run.id}`)}>
                          <div>
                            <strong>
                              {run.name ?? run.scenario.name}
                            </strong>

                            <span>
                              {run.scenario.name}
                            </span>
                          </div>

                          <div
                            className={styles.listMeta}>
                            <span className={styles.liveBadge}>
                              I gang
                            </span>

                            <span>
                              {
                                run
                                  ._count
                                  .users
                              }{" "}
                              deltagere
                            </span>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}
                >
                  <div>
                    <span className={styles.eyebrow}>
                      Kræver opmærksomhed
                    </span>

                    <h2>
                      Scenarier
                    </h2>
                  </div>

                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() =>
                      navigate(
                        "/scenarios",
                      )
                    }
                  >
                    Se alle
                  </button>
                </div>

                {data
                  .attentionScenarios
                  .length === 0 ? (
                  <EmptyState
                    text="Ingen scenarier kræver opmærksomhed."
                    buttonLabel="Gå til scenarier"
                    onClick={() =>
                      navigate("/scenarios")
                    }
                  />
                ) : (
                  <div
                    className={styles.list}>
                    {data.attentionScenarios.map(
                      (scenario) => (
                        <button key={scenario.id}
                          type="button"
                          className={styles.listItem}
                          onClick={() => navigate(
                            `/scenarios/${scenario.id}`,
                          )
                          }
                        >
                          <div>
                            <strong>
                              {scenario.name}
                            </strong>

                            <span>
                              {scenario._count.scenarioTasks}{" "}
                              opgaver
                            </span>
                          </div>

                          <span className={styles.draftBadge}>
                            {scenario
                              ._count
                              .scenarioTasks ===
                              0
                              ? "Ingen opgaver"
                              : "Kladde"}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </section>
            </div>

            <section className={styles.quickActions}>
              <div>
                <span className={styles.eyebrow}>
                  Hurtige handlinger
                </span>

                <h2>
                  Fortsæt arbejdet
                </h2>
              </div>

              <div className={styles.actionGrid}>
                <button
                  type="button"
                  onClick={() => navigate("/tasks")} >
                  <strong>
                    Opgaver
                  </strong>

                  <span>
                    Opret eller importér
                    opgaver
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/scenarios")}>
                  <strong>
                    Scenarier
                  </strong>

                  <span>
                    Byg og redigér
                    scenarier
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/runs")}
                >
                  <strong>
                    Afviklinger
                  </strong>

                  <span>
                    Opret og administrér
                    afviklinger
                  </span>
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  onClick: () => void;
};

function StatCard({
  label,
  value,
  onClick,
}: StatCardProps) {
  return (
    <button
      type="button"
      className={styles.statCard}
      onClick={onClick}
    >
      <strong>{value}</strong>
      <span>{label}</span>
    </button>
  );
}

type EmptyStateProps = {
  text: string;
  buttonLabel: string;
  onClick: () => void;
};

function EmptyState({
  text,
  buttonLabel,
  onClick,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <p>{text}</p>

      <button type="button" onClick={onClick}>
        {buttonLabel}
      </button>
    </div>
  );
}