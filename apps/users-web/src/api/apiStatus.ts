export type ApiStatus =
  | "unknown"
  | "online"
  | "offline";

let currentStatus: ApiStatus =
  navigator.onLine
    ? "unknown"
    : "offline";

const listeners =
  new Set<
    (status: ApiStatus) => void
  >();

export function getApiStatus() {
  return currentStatus;
}

export function setApiStatus(
  status: ApiStatus,
) {
  if (
    currentStatus === status
  ) {
    return;
  }

  currentStatus = status;

  for (
    const listener
    of listeners
  ) {
    listener(status);
  }
}

export function subscribeApiStatus(
  listener:
    (status: ApiStatus) => void,
) {
  listeners.add(listener);

  listener(currentStatus);

  return () => {
    listeners.delete(listener);
  };
}