import { useState, type SubmitEvent } from "react";

import { apiFetch } from "../../api/apiFetch";

import styles from "./UserDrawer.module.css"

type UserRole = "USER" | "ADMIN";
type UserStatus = "ACTIVE" | "INACTIVE";

type User = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
};

type Props = {
  user: User | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditUserDrawer({
  user,
  onClose,
  onUpdated,
}: Props) {
  const [prevUserId, setPrevUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setDisplayName(user.displayName);
    setRole(user.role);
    setStatus(user.status);
    setError("");
  }

  if (!user) return null;
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!user) return;
    if (!displayName.trim()) {
      setError("Brugeren skal have et navn");
      return;
    }
    try {
      setSaving(true);
      setError("");

      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim(),
          role,
          status,
        }),
      });
      onUpdated();
    } catch {
      setError("Brugeren kunne ikke opdateres");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.drawerLayer}>
      <button
        type="button"
        onClick={onClose}
        className={styles.backdrop}
        aria-label="Luk"
      />

      <aside className={styles.drawer}>
        <form onSubmit={handleSubmit}>
          <header className={styles.header}>
            <div>
              <h2>Redigér bruger</h2>
              <p>{user.username}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
            >
              x
            </button>
          </header>
          <div className={styles.content}>
            {error && <div>{error}</div>}
            <label>
              <span>Navn</span>
              <input
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                required
              />
            </label>
            <label>
              <span>Brugernavn</span>
              <input
                value={user.username}
                disabled
              />
              <small className={styles.fieldHint}>
                Brugernavnet kan ikke ændres her.
              </small>
            </label>
            <label>
              <span>Systemrolle</span>
              <select
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as UserRole,
                  )
                }
              >
                <option value="USER">Bruger</option>
                <option value="ADMIN">
                  Administrator
                </option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as UserStatus,
                  )
                }
              >
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Inaktiv</option>
              </select>
            </label>
            {status === "INACTIVE" && (
              <div className={styles.warningBox}>
                En inaktiv bruger kan ikke logge ind.
              </div>
            )}
          </div>
          <footer className={styles.footer}>
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
                ? "Gemmer..."
                : "Gem ændringer"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}