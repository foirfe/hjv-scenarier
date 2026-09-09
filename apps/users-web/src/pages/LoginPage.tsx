import {
  useState,
  type SubmitEvent,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router";

import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  if (user) {
    return (
      <Navigate
        to="/runs"
        replace
      />
    );
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(username, password);

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
    <main>
      <h1>HJV Scenarier</h1>

      <p>Log ind for at fortsætte</p>

      <form onSubmit={handleSubmit}>
        <label>
          Brugernavn

          <input
            type="text"
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

        {error && (
          <p role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Logger ind..." : "Log ind"}
        </button>
      </form>
    </main>
  );
}