import { createContext } from "react";

export type UserRole = "ADMIN" | "USER";

export type User = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);