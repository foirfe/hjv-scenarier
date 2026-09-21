import { API_URL } from "../config";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = sessionStorage.getItem("accessToken");
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData =
    options.body instanceof FormData;

  if (
    options.body &&
    !isFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }



  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    sessionStorage.removeItem("accessToken");
    window.location.href = "/login";
    throw new Error("Din session er udløbet");
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
//TIL DOWNLOAD AF EXCEL FIL
export async function apiDownload(
  path: string,
  filename: string,
) {
  const token =
    sessionStorage.getItem(
      "accessToken",
    );

  const headers =
    new Headers();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        headers,
      },
    );

  if (response.status === 401) {
    sessionStorage.removeItem(
      "accessToken",
    );

    window.location.href =
      "/login";

    throw new Error(
      "Din session er udløbet",
    );
  }

  if (!response.ok) {
    const errorBody =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      errorBody?.message ||
        "Filen kunne ikke hentes",
    );
  }

  const blob =
    await response.blob();

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}