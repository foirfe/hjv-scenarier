import {
  useState,
  type SubmitEvent,
} from "react";

import { apiFetch } from "../../api/apiFetch";
import styles from "./UserDrawer.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateUserDrawer({
  open,
  onClose,
  onCreated,
}: Props) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: SubmitEvent,
  ) {
    event.preventDefault();

    if (
      !displayName.trim() ||
      !username.trim() ||
      !password
    ) {
      setError(
        "Udfyld navn, brugernavn og adgangskode",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiFetch("/users", {
        method: "POST",

        body: JSON.stringify({
          displayName:
            displayName.trim(),

          username:
            username.trim(),

          password,

          role,
        }),
      });

      setDisplayName("");
      setUsername("");
      setPassword("");
      setRole("USER");

      onCreated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Brugeren kunne ikke oprettes",
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
          <header className={styles.header}>
            <div>
              <h2>Opret bruger</h2>

              <p>
                Brugeren kan efterfølgende
                tilknyttes scenarieafviklinger.
              </p>
            </div>

            <button type="button" onClick={onClose}>
              x
            </button>
          </header>

          <div className={styles.content}>
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <label>
              <span>Navn *</span>

              <input
                value={displayName}
                onChange={(event) =>setDisplayName(event.target.value,)}
                placeholder="F.eks. Mads Kristiansen"
                required
              />
            </label>

            <label>
              <span>Brugernavn *</span>
              <input
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value,
                  )
                }
                placeholder="F.eks. mads01"
                required
                autoComplete="off"
              />
            </label>

            <label>
              <span>Adgangskode *</span>
              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                required
                autoComplete="new-password"
              />
            </label>

            <label>
              <span>Systemrolle</span>
              <select
                value={role}
                onChange={(event) =>setRole(event.target.value as "USER" | "ADMIN",)}
              >
                <option value="USER">
                  Bruger
                </option>
                <option value="ADMIN">
                  Administrator
                </option>
              </select>
            </label>

            <div className={styles.infoBox}>
              Deltager, holdleder og
              instruktør vælges først,
              når brugeren tilknyttes en
              scenarieafvikling.
            </div>
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              onClick={onClose}>
              Annuller
            </button>

            <button
              type="submit"
              disabled={saving}>
              {saving ? "Opretter...": "Opret bruger"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}