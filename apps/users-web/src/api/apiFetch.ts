import { API_URL } from "../config";

export class NetworkError extends Error {
  constructor() {
    super(
      "Kunne ikke oprette forbindelse til serveren",
    );

    this.name = "NetworkError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = sessionStorage.getItem("accessToken");
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,
      },
    );
  } catch {
    throw new NetworkError();
  }

  if (response.status === 401) {
    sessionStorage.removeItem("accessToken", );
    sessionStorage.removeItem("currentUser",);
    window.location.href =
      "/login";
    throw new Error(
      "Din session er udløbet",
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage = Array.isArray(errorBody?.message)
      ? errorBody.message.join(", ")
      : errorBody?.message;
    throw new Error(
      errorMessage || `Der opstod en fejl (${response.status})`
    );
  }
  if (response.status === 204) {
    return null as T;
  }
  return response.json() as Promise<T>;
}