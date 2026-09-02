import {
  useEffect,
  useState,
  type SubmitEvent,
} from "react";

import { apiFetch } from "../../api/apiFetch";
import styles from "./CreateScenarioDrawer.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateScenarioDrawer({
  open,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
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
  }, [open, onClose]);

  async function handleSubmit(
    event: SubmitEvent,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Scenariet skal have et navn",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiFetch("/scenarios", {
        method: "POST",

        body: JSON.stringify({
          name: name.trim(),

          description:
            description.trim() ||
            undefined,

          status: "DRAFT",
        }),
      });

      setName("");
      setDescription("");

      onCreated();
    } catch {
      setError(
        "Scenariet kunne ikke oprettes",
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
          <header
            className={styles.header}
          >
            <div>
              <h2>Opret scenarie</h2>

              <p>
                Opret scenariet først.
                Opgaver, aktivering og GPS
                konfigureres bagefter.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
            >
              x
            </button>
          </header>

          <div
            className={styles.content}
          >
            {error && (
              <div
                className={styles.error}
              >
                {error}
              </div>
            )}

            <label>
              <span>Navn *</span>

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="F.eks. NAV I 2026"
                required
              />
            </label>

            <label>
              <span>Beskrivelse</span>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                rows={5}
                placeholder="Kort beskrivelse af øvelsen..."
              />
            </label>

            <div
              className={styles.infoBox}
            >
              Nye scenarier oprettes som
              kladde.
            </div>
          </div>

          <footer
            className={styles.footer}
          >
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
                : "Opret scenarie"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}