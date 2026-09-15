import {useState, type SubmitEvent} from "react";
import {Navigate, useNavigate} from "react-router";
import { useAuth } from "../auth/useAuth";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <Navigate to="/runs" replace/>
    );
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);
     const normalizedUsername = username.trim().toLowerCase()

    try {
      await login(normalizedUsername, password);

      navigate("/runs", {
        replace: true,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login mislykkedes",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
  <main className={styles.page}>
    <section className={styles.card}>
      <header className={styles.header}>
        <div className={styles.brand}>
          HJEMMEVÆRNSSKOLEN
        </div>

        <h1>HVS Øvelsessystem</h1>

        <p>
          Log ind for at se dine øvelser.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Brugernavn</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Adgangskode</span>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button
          className={styles.submit}
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Logger ind..."
            : "Log ind"}
        </button>
      </form>
    </section>
  </main>
);
}