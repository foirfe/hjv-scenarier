import type {
  User,
} from "./auth-context";

const CURRENT_USER_KEY =
  "currentUser";

export function saveSessionUser(
  user: User,
) {
  sessionStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(user),
  );
}

export function getSessionUser():
  User | null {
  const raw =
    sessionStorage.getItem(
      CURRENT_USER_KEY,
    );

  if (!raw) {
    return null;
  }

  try {
    const user =
      JSON.parse(raw) as User;

    if (
      typeof user.id !== "string" ||
      typeof user.username !==
        "string" ||
      typeof user.displayName !==
        "string"
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function clearSessionUser() {
  sessionStorage.removeItem(
    CURRENT_USER_KEY,
  );
}