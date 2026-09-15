import { useState, type SubmitEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import styles from "./LoginPage.module.css"

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (user?.role === "ADMIN") {
    return <Navigate to="/overview" replace />;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const normalizedUsername = username.trim().toLowerCase()

    try {
      await login(normalizedUsername, password);
      navigate("/overview");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Der opstod en fejl",
      );
    } finally {
      setLoading(false);
    }
  }


return (
  <main className={styles.loginPage}>
    <form
      className={styles.loginForm}
      onSubmit={handleSubmit}
    >
      <div className={styles.brand}>
        <strong>HJEMMEVÆRNSSKOLENS</strong>
        <p>ØVELSESSYSTEM</p>
      </div>

      <div className={styles.heading}>
        <h1>Log ind</h1>
        <p>
          Log ind for at administrere
          øvelser og scenarieafviklinger.
        </p>
      </div>

      <label>
        <span>Brugernavn</span>

        <input
          value={username}
          onChange={(event) =>
            setUsername(event.target.value)
          }
          autoComplete="username"
          required
        />
      </label>

      <label>
        <span>Adgangskode</span>

        <input
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          autoComplete="current-password"
          required
        />
      </label>

      {error && (
        <p className={styles.loginError}>
          {error}
        </p>
      )}

      <button
        className={styles.loginButton}
        disabled={loading}
      >
        {loading
          ? "Logger ind..."
          : "Log ind"}
      </button>
    </form>
  </main>
);
}