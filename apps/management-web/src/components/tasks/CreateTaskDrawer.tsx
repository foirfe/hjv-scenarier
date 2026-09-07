import { useEffect, useState, type SubmitEvent } from "react";
import { apiFetch } from "../../api/apiFetch";
import styles from "./TaskDrawer.module.css";

type TaskStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

type AnswerType =
  | "MULTIPLE_CHOICE"
  | "FREE_TEXT"
  | "YES_NO";

type Environment = {
  id: number;
  name: string;
};

type TaskType = {
  id: number;
  code: string;
  name: string;
};

type FormOptions = {
  environments: Environment[];
  taskTypes: TaskType[];
};

type TaskOptionDraft = {
  id: string;
  optionText: string;
  isCorrect: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateTaskDrawer({
  open,
  onClose,
  onCreated,
}: Props) {
  const [formOptions, setFormOptions] =
    useState<FormOptions | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  const [environmentId, setEnvironmentId] = useState("");
  const [taskTypeId, setTaskTypeId] = useState("");

  const [status, setStatus] =
    useState<TaskStatus>("ACTIVE");

  const [answerType, setAnswerType] =
    useState<AnswerType>("MULTIPLE_CHOICE");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedTaskType = formOptions?.taskTypes.find(
    (type) => type.id === Number(taskTypeId),
  );

  const isQuiz = selectedTaskType?.code === "QUIZ";

  const [options, setOptions] = useState<TaskOptionDraft[]>([
    {
      id: crypto.randomUUID(),
      optionText: "",
      isCorrect: false,
    },
    {
      id: crypto.randomUUID(),
      optionText: "",
      isCorrect: false,
    },
  ]);

  useEffect(() => {
    if (!open) return;

    async function loadOptions() {
      try {
        const data =
          await apiFetch<FormOptions>("/tasks/form-options");

        setFormOptions(data);
      } catch {
        setError("Kunne ikke hente formularens valgmuligheder");
      }
    }

    void loadOptions();
  }, [open]);
  //OPTIONS FUNKTIONER
  function addOption() {
    setOptions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        optionText: "",
        isCorrect: false,
      },
    ]);
  }
  function updateOptionText(
    id: string,
    optionText: string,
  ) {
    setOptions((current) =>
      current.map((option) =>
        option.id === id
          ? {
            ...option,
            optionText,
          }
          : option,
      ),
    );
  }
  function toggleOptionCorrect(id: string) {
    setOptions((current) =>
      current.map((option) =>
        option.id === id
          ? {
            ...option,
            isCorrect: !option.isCorrect,
          }
          : option,
      ),
    );
  }
  function removeOption(id: string) {
    setOptions((current) =>
      current.filter((option) => option.id !== id),
    );
  }
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  function resetForm() {
    setName("");
    setDescription("");
    setInstructions("");
    setEnvironmentId("");
    setTaskTypeId("");
    setStatus("ACTIVE");
    setAnswerType("MULTIPLE_CHOICE");
    setOptions([
      {
        id: crypto.randomUUID(),
        optionText: "",
        isCorrect: false,
      },
      {
        id: crypto.randomUUID(),
        optionText: "",
        isCorrect: false,
      },
    ]);
    setError("");
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!environmentId || !taskTypeId) {
      setError("Vælg både miljø og opgavetype");
      return;
    }

    try {
      if (isQuiz && answerType === "MULTIPLE_CHOICE") {
        const validOptions = options.filter(
          (option) => option.optionText.trim() !== "",
        );

        if (validOptions.length < 2) {
          setError("Tilføj mindst to svarmuligheder");
          return;
        }

        if (!validOptions.some((option) => option.isCorrect)) {
          setError("Markér mindst ét korrekt svar");
          return;
        }
      }
      setSaving(true);
      setError("");

      await apiFetch("/tasks", {
        method: "POST",

        body: JSON.stringify({
          name: name.trim(),

          description:
            description.trim() || undefined,

          instructions: instructions.trim(),

          environmentId: Number(environmentId),
          taskTypeId: Number(taskTypeId),

          status,
          ...(isQuiz
            ? {
              answerType,

              ...(answerType === "MULTIPLE_CHOICE"
                ? {
                  options: options
                    .filter(
                      (option) =>
                        option.optionText.trim() !== "",
                    )
                    .map((option, index) => ({
                      optionText:
                        option.optionText.trim(),

                      isCorrect: option.isCorrect,

                      sortOrder: index,
                    })),
                }
                : {}),
            }
            : {}),

        }),
      });

      resetForm();
      onCreated();
    } catch {
      setError("Opgaven kunne ikke oprettes");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className={styles.drawerLayer}>
      <button
        type="button"
        className={styles.drawerBackdrop}
        aria-label="Luk"
        onClick={onClose}
      />

      <aside className={styles.drawer}>
        <form
          className={styles.drawerForm}
          onSubmit={handleSubmit}
        >
          <header className={styles.drawerHeader}>
            <h2>Opret ny opgave</h2>
            <div className={styles.drawerActions}>


              <button
                type="button"
                className={styles.drawerClose}
                onClick={onClose}
                aria-label="Luk"
              >
                x
              </button>
            </div>
          </header>

          <div className={styles.taskDrawerContent}>
            <div className={styles.taskInfoBox}>
              <strong>ⓘ Opgaven er en skabelon</strong>

              <span>
                GPS-koordinater, aktiveringsradius,
                rækkefølge og aktivering konfigureres
                i scenariebyggeren.
              </span>
            </div>

            {error && (
              <div className={styles.formError}>
                {error}
              </div>
            )}

            <label className={styles.formField}>
              <span>
                Navn <strong>*</strong>
              </span>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="F.eks. Mand over bord - søgning og redning"
                required
              />
            </label>

            <label className={styles.formField}>
              <span>Beskrivelse</span>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={3}
              />
            </label>

            <div className={styles.formRow}>
              <label className={styles.formField}>
                <span>
                  Miljø <strong>*</strong>
                </span>

                <select
                  value={environmentId}
                  onChange={(event) =>
                    setEnvironmentId(event.target.value)
                  }
                  required
                >
                  <option value="">
                    Vælg miljø
                  </option>

                  {formOptions?.environments.map(
                    (environment) => (
                      <option
                        key={environment.id}
                        value={environment.id}
                      >
                        {environment.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className={styles.formField}>
                <span>
                  Opgavetype <strong>*</strong>
                </span>

                <select
                  value={taskTypeId}
                  onChange={(event) =>
                    setTaskTypeId(event.target.value)
                  }
                  required
                >
                  <option value="">
                    Vælg type
                  </option>

                  {formOptions?.taskTypes.map(
                    (taskType) => (
                      <option
                        key={taskType.id}
                        value={taskType.id}
                      >
                        {taskType.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <fieldset className={styles.formFieldset}>
              <legend>Status</legend>

              <label>
                <input
                  type="radio"
                  checked={status === "ACTIVE"}
                  onChange={() => setStatus("ACTIVE")}
                />
                Aktiv
              </label>

              <label>
                <input
                  type="radio"
                  checked={status === "DRAFT"}
                  onChange={() => setStatus("DRAFT")}
                />
                Kladde
              </label>

              <label>
                <input
                  type="radio"
                  checked={status === "ARCHIVED"}
                  onChange={() => setStatus("ARCHIVED")}
                />
                Arkiveret
              </label>
            </fieldset>

            <hr />

            <label className={styles.formField}>
              <span>
                Instruktioner <strong>*</strong>
              </span>

              <small>
                Vejledning deltagerne modtager under øvelsen.
              </small>

              <textarea
                value={instructions}
                onChange={(event) =>
                  setInstructions(event.target.value)
                }
                rows={7}
                required
              />

              <small className={styles.characterCount}>
                {instructions.length} tegn
              </small>
            </label>

            {isQuiz && (
              <>
                <hr />

                <section className={styles.answerSection}>
                  <h3>Svar og bedømmelse</h3>

                  <small>
                    Vælg hvordan deltageren skal besvare
                    opgaven.
                  </small>

                  <div className={styles.answerTypes}>
                    <label>
                      <input
                        type="radio"
                        checked={
                          answerType ===
                          "MULTIPLE_CHOICE"
                        }
                        onChange={() =>
                          setAnswerType(
                            "MULTIPLE_CHOICE",
                          )
                        }
                      />
                      Flervalg
                    </label>

                    <label>
                      <input
                        type="radio"
                        checked={
                          answerType === "FREE_TEXT"
                        }
                        onChange={() =>
                          setAnswerType("FREE_TEXT")
                        }
                      />
                      Fritekst
                    </label>

                    <label>
                      <input
                        type="radio"
                        checked={
                          answerType === "YES_NO"
                        }
                        onChange={() =>
                          setAnswerType("YES_NO")
                        }
                      />
                      Ja/Nej
                    </label>
                  </div>
                  {answerType === "MULTIPLE_CHOICE" && (
                    <div className={styles.optionsEditor}>
                      <div className={styles.optionsHeader}>
                        <strong>Svarmuligheder</strong>

                        <span>Markér korrekte svar</span>
                      </div>

                      {options.map((option, index) => (
                        <div
                          key={option.id}
                          className={styles.optionRow}
                        >
                          <span className={styles.optionNumber}>
                            {index + 1}
                          </span>

                          <input
                            type="text"
                            value={option.optionText}
                            placeholder={`Svarmulighed ${index + 1}`}
                            onChange={(event) =>
                              updateOptionText(
                                option.id,
                                event.target.value,
                              )
                            }
                          />

                          <label className={styles.correctOption}>
                            <input
                              type="checkbox"
                              checked={option.isCorrect}
                              onChange={() =>
                                toggleOptionCorrect(option.id)
                              }
                            />

                            Korrekt
                          </label>

                          <button
                            type="button"
                            onClick={() => removeOption(option.id)}
                            disabled={options.length <= 2}
                            className={styles.removeOption}
                            aria-label="Fjern svarmulighed"
                          >
                            x
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addOption}
                        className={styles.addOption}
                      >
                        + Tilføj svarmulighed
                      </button>
                    </div>
                  )}
                </section>
              </>
            )}
            <button
              type="submit"
              disabled={saving}
              className={styles.primaryButton}
            >
              {saving ? "Opretter..." : "Opret opgave"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}