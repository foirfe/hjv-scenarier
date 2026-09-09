import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  AuthContext,
  type User,
} from "./auth-context";
import { apiFetch } from "../api/apiFetch";

const API_URL = "http://localhost:3000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(
    () => sessionStorage.getItem("accessToken") !== null,
  );

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");

    if (!token) {
      return;
    }

    let cancelled = false;

    apiFetch<User>("/auth/me")
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        sessionStorage.removeItem("accessToken");

        if (!cancelled) {
          setUser(null);
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

  async function login(username: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error("Forkert brugernavn eller adgangskode");
    }

    const data = (await response.json()) as {
      accessToken: string;
    };

    sessionStorage.setItem("accessToken", data.accessToken);

    const meResponse = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    });

    if (!meResponse.ok) {
      sessionStorage.removeItem("accessToken");
      throw new Error("Kunne ikke hente bruger");
    }

    const currentUser = (await meResponse.json()) as User;


    setUser(currentUser);
  }

  function logout() {
    sessionStorage.removeItem("accessToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}