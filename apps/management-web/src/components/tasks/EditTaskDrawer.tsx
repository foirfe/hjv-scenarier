import { useEffect, useState, type SubmitEvent } from "react";
import ChecklistEditor, { type ChecklistItemDraft } from "./ChecklistEditor";
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

type TaskOption = {
  id: string;
  optionText: string;
  isCorrect: boolean;
  sortOrder: number;
};

type TaskOptionDraft = {
  id: string;
  optionText: string;
  isCorrect: boolean;
};

type TaskChecklistItem = {
  id: string;
  itemText: string;
  sortOrder: number;
};

type FormOptions = {
  environments: Environment[];
  taskTypes: TaskType[];
};

type Task = {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  status: TaskStatus;
  answerType: AnswerType | null;

  environment: Environment;
  taskType: TaskType;

  options: TaskOption[];

  checklistItems: TaskChecklistItem[];
};

type Props = {
  taskId: string | null;
  onClose: () => void;
  onUpdated: () => void;
};

function createEmptyOptions(): TaskOptionDraft[] {
  return [
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
  ];
}

export default function EditTaskDrawer({
  taskId,
  onClose,
  onUpdated,
}: Props) {
  const [formOptions, setFormOptions] =
    useState<FormOptions | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [taskTypeId, setTaskTypeId] = useState("");
  const [status, setStatus] = useState<TaskStatus>("ACTIVE");
  const [answerType, setAnswerType] = useState<AnswerType>("MULTIPLE_CHOICE");
  const [options, setOptions] = useState<TaskOptionDraft[]>(createEmptyOptions());
  const [yesNoCorrect, setYesNoCorrect] = useState<"YES" | "NO">("YES");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItemDraft[]>([]);

  const selectedTaskType = formOptions?.taskTypes.find(
    (type) => type.id === Number(taskTypeId),
  );

  const isQuiz = selectedTaskType?.code === "QUIZ";
  const isChecklist = selectedTaskType?.code === "CHECKLIST";

  useEffect(() => {
    if (!taskId) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [optionsData, task] = await Promise.all([
          apiFetch<FormOptions>("/tasks/form-options"),
          apiFetch<Task>(`/tasks/${taskId}`),
        ]);

        if (cancelled) {
          return;
        }

        setFormOptions(optionsData);

        setName(task.name);
        setDescription(task.description ?? "");
        setInstructions(task.instructions);

        setEnvironmentId(
          String(task.environment.id),
        );

        setTaskTypeId(
          String(task.taskType.id),
        );

        setStatus(task.status);

        const currentAnswerType = task.answerType ?? "MULTIPLE_CHOICE";
        setAnswerType(currentAnswerType);

        if (currentAnswerType === "YES_NO" && task.options) {
          const correctOption = task.options.find((opt) => opt.isCorrect);
          if (correctOption?.optionText === "Nej") {
            setYesNoCorrect("NO");
          } else {
            setYesNoCorrect("YES");
          }
        }

        if (task.options.length > 0 && currentAnswerType === "MULTIPLE_CHOICE") {
          setOptions(
            task.options
              .sort(
                (a, b) =>
                  a.sortOrder - b.sortOrder,
              )
              .map((option) => ({
                id: option.id,
                optionText: option.optionText,
                isCorrect: option.isCorrect,
              })),
          );
        } else {
          setOptions(createEmptyOptions());
        }
        if (
          task.checklistItems.length > 0
        ) {
          setChecklistItems(
            [...task.checklistItems]
              .sort(
                (a, b) =>
                  a.sortOrder - b.sortOrder,
              )
              .map((item) => ({
                id: item.id,
                itemText: item.itemText,
              })),
          );
        } else {
          setChecklistItems([
            {
              id: crypto.randomUUID(),
              itemText: "",
            },
          ]);
        }
      } catch {
        if (!cancelled) {
          setError("Kunne ikke hente opgaven");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [taskId, onClose]);

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
    setOptions((current) => {
      if (current.length <= 2) {
        return current;
      }

      return current.filter(
        (option) => option.id !== id,
      );
    });
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!taskId) {
      return;
    }

    if (!name.trim()) {
      setError("Opgaven skal have et navn");
      return;
    }

    if (!instructions.trim()) {
      setError("Opgaven skal have instruktioner");
      return;
    }

    if (!environmentId || !taskTypeId) {
      setError(
        "Vælg både miljø og opgavetype",
      );
      return;
    }

    if (
      isQuiz &&
      answerType === "MULTIPLE_CHOICE"
    ) {
      const validOptions = options.filter(
        (option) =>
          option.optionText.trim() !== "",
      );

      if (validOptions.length < 2) {
        setError(
          "Tilføj mindst to svarmuligheder",
        );
        return;
      }

      if (
        !validOptions.some(
          (option) => option.isCorrect,
        )
      ) {
        setError(
          "Markér mindst ét korrekt svar",
        );
        return;
      }
    }

    if (isChecklist) {
      const validChecklistItems =
        checklistItems.filter(
          (item) =>
            item.itemText.trim() !== "",
        );

      if (
        validChecklistItems.length === 0
      ) {
        setError(
          "Tilføj mindst ét punkt til tjeklisten",
        );

        return;
      }
    }

    try {
      setSaving(true);
      setError("");

      await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",

        body: JSON.stringify({
          name: name.trim(),

          description:
            description.trim() || null,

          instructions: instructions.trim(),

          environmentId:
            Number(environmentId),

          taskTypeId:
            Number(taskTypeId),

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
                    .map(
                      (
                        option,
                        index,
                      ) => ({
                        optionText:
                          option.optionText.trim(),

                        isCorrect:
                          option.isCorrect,

                        sortOrder:
                          index,
                      }),
                    ),
                }
                : {}),

              ...(answerType === "YES_NO"
                ? {
                  options: [
                    {
                      optionText: "Ja",
                      isCorrect: yesNoCorrect === "YES",
                      sortOrder: 0,
                    },
                    {
                      optionText: "Nej",
                      isCorrect: yesNoCorrect === "NO",
                      sortOrder: 1,
                    },
                  ],
                }
                : {}),

              ...(answerType === "FREE_TEXT"
                ? {
                  options: [],
                }
                : {}),
            }
            : {
              answerType: null,
              options: [],
            }),

          // Flyttet ind i JSON.stringify objektet her:
          ...(isChecklist
            ? {
              checklistItems:
                checklistItems
                  .filter(
                    (item) =>
                      item.itemText.trim() !== "",
                  )
                  .map(
                    (item, index) => ({
                      itemText:
                        item.itemText.trim(),

                      sortOrder: index,
                    }),
                  ),
            }
            : {
              checklistItems: [],
            }),
        }),
      });

      onUpdated();
    } catch {
      setError(
        "Opgaven kunne ikke opdateres",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!taskId) {
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
            <h2>Redigér opgave</h2>

            <div className={styles.drawerActions}>
              <button
                type="submit"
                disabled={saving || loading}
                className={styles.primaryButton}
              >
                {saving
                  ? "Gemmer..."
                  : "Gem ændringer"}
              </button>

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
              <strong>
                ⓘ Du redigerer opgaveskabelonen
              </strong>

              <span>
                Ændringer påvirker scenarier, der
                bruger skabelonen fremover. Allerede
                startede scenarieafviklinger bruger
                deres snapshot.
              </span>
            </div>

            {error && (
              <div className={styles.formError}>
                {error}
              </div>
            )}

            {loading ? (
              <p>Indlæser opgave...</p>
            ) : (
              <>
                <label className={styles.formField}>
                  <span>
                    Navn <strong>*</strong>
                  </span>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    required
                  />
                </label>

                <label className={styles.formField}>
                  <span>Beskrivelse</span>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    rows={3}
                  />
                </label>

                <div className={styles.formRow}>
                  <label
                    className={styles.formField}
                  >
                    <span>
                      Miljø <strong>*</strong>
                    </span>

                    <select
                      value={environmentId}
                      onChange={(event) =>
                        setEnvironmentId(
                          event.target.value,
                        )
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

                  <label
                    className={styles.formField}
                  >
                    <span>
                      Opgavetype{" "}
                      <strong>*</strong>
                    </span>

                    <select
                      value={taskTypeId}
                      onChange={(event) =>
                        setTaskTypeId(
                          event.target.value,
                        )
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

                <fieldset
                  className={styles.formFieldset}
                >
                  <legend>Status</legend>

                  <label>
                    <input
                      type="radio"
                      checked={
                        status === "ACTIVE"
                      }
                      onChange={() =>
                        setStatus("ACTIVE")
                      }
                    />
                    Aktiv
                  </label>

                  <label>
                    <input
                      type="radio"
                      checked={
                        status === "DRAFT"
                      }
                      onChange={() =>
                        setStatus("DRAFT")
                      }
                    />
                    Kladde
                  </label>

                  <label>
                    <input
                      type="radio"
                      checked={
                        status === "ARCHIVED"
                      }
                      onChange={() =>
                        setStatus("ARCHIVED")
                      }
                    />
                    Arkiveret
                  </label>
                </fieldset>

                <hr />

                <label
                  className={styles.formField}
                >
                  <span>
                    Instruktioner{" "}
                    <strong>*</strong>
                  </span>

                  <small>
                    Vejledning deltagerne modtager
                    under øvelsen.
                  </small>

                  <textarea
                    value={instructions}
                    onChange={(event) =>
                      setInstructions(
                        event.target.value,
                      )
                    }
                    rows={7}
                    required
                  />

                  <small
                    className={
                      styles.characterCount
                    }
                  >
                    {instructions.length} tegn
                  </small>
                </label>

                {isQuiz && (
                  <>
                    <hr />

                    <section
                      className={
                        styles.answerSection
                      }
                    >
                      <h3>
                        Svar og bedømmelse
                      </h3>

                      <small>
                        Vælg hvordan deltageren skal
                        besvare opgaven.
                      </small>

                      <div
                        className={
                          styles.answerTypes
                        }
                      >
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
                              answerType ===
                              "FREE_TEXT"
                            }
                            onChange={() =>
                              setAnswerType(
                                "FREE_TEXT",
                              )
                            }
                          />
                          Fritekst
                        </label>

                        <label>
                          <input
                            type="radio"
                            checked={
                              answerType ===
                              "YES_NO"
                            }
                            onChange={() =>
                              setAnswerType(
                                "YES_NO",
                              )
                            }
                          />
                          Ja/Nej
                        </label>
                      </div>

                      {answerType ===
                        "MULTIPLE_CHOICE" && (
                          <div
                            className={styles.optionsEditor}
                          >
                            <div
                              className={styles.optionsHeader}
                            >
                              <strong>
                                Svarmuligheder
                              </strong>

                              <span>
                                Markér korrekte svar
                              </span>
                            </div>

                            {options.map(
                              (option, index) => (
                                <div
                                  key={option.id}
                                  className={styles.optionRow}
                                >
                                  <span
                                    className={
                                      styles.optionNumber
                                    }
                                  >
                                    {index + 1}
                                  </span>

                                  <input
                                    type="text"
                                    value={
                                      option.optionText
                                    }
                                    placeholder={`Svarmulighed ${index + 1
                                      }`}
                                    onChange={(
                                      event,
                                    ) =>
                                      updateOptionText(
                                        option.id,
                                        event.target
                                          .value,
                                      )
                                    }
                                  />

                                  <label
                                    className={
                                      styles.correctOption
                                    }
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        option.isCorrect
                                      }
                                      onChange={() =>
                                        toggleOptionCorrect(
                                          option.id,
                                        )
                                      }
                                    />

                                    Korrekt
                                  </label>

                                  <button
                                    type="button"
                                    className={
                                      styles.removeOption
                                    }
                                    disabled={
                                      options.length <=
                                      2
                                    }
                                    onClick={() =>
                                      removeOption(
                                        option.id,
                                      )
                                    }
                                    aria-label="Fjern svarmulighed"
                                  >
                                    x
                                  </button>
                                </div>
                              ),
                            )}

                            <button
                              type="button"
                              className={
                                styles.addOption
                              }
                              onClick={addOption}
                            >
                              + Tilføj svarmulighed
                            </button>
                          </div>
                        )}

                      {answerType === "YES_NO" && (
                        <div className={styles.optionsEditor}>
                          <div className={styles.optionsHeader}>
                            <strong>Ja/Nej indstilling</strong>
                            <span>Vælg hvad det korrekte svar er</span>
                          </div>
                          <div className={styles.formRow}>
                            <label>
                              <input
                                type="radio"
                                name="yesNoCorrect"
                                checked={yesNoCorrect === "YES"}
                                onChange={() => setYesNoCorrect("YES")}
                              />
                              Ja er korrekt
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="yesNoCorrect"
                                checked={yesNoCorrect === "NO"}
                                onChange={() => setYesNoCorrect("NO")}
                              />
                              Nej er korrekt
                            </label>
                          </div>
                        </div>
                      )}
                    </section>
                  </>
                )}
                {isChecklist && (
                  <>
                    <hr />
                    <ChecklistEditor
                      items={checklistItems}
                      onChange={
                        setChecklistItems
                      }
                    />
                  </>
                )}
              </>
            )}
          </div>
        </form>
      </aside>
    </div>
  );
}