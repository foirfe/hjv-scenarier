import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(username, password);
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
    <main className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div>
          <strong>HJEMMEVÆRNET</strong>
          <p>ØVELSESSYSTEM</p>
        </div>

        <h1>Log ind</h1>

        <label>
          Brugernavn
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Adgangskode
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button disabled={loading}>
          {loading ? "Logger ind..." : "Log ind"}
        </button>
      </form>
    </main>
  );
}