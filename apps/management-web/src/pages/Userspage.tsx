import { useEffect, useState } from "react";
import PageHeader from "../components/Pageheader";
import { apiFetch } from "../api/apiFetch";
import CreateUserDrawer from "../components/users/CreateUserDrawer";
import styles from "./Userspage.module.css";

type UserRole = "USER" | "ADMIN";
type UserStatus = "ACTIVE" | "INACTIVE";

type User = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | UserStatus>("");
  const [createOpen, setCreateOpen] = useState(false);

  function fetchUsers() {
  return apiFetch<User[]>("/users");
}

async function loadUsers() {
  try {
    setLoading(true);
    setError("");
    const data = await fetchUsers();
    setUsers(data);
  } catch {
    setError("Kunne ikke hente brugere");
  } finally {
    setLoading(false);
  }
}
useEffect(() => {
  let cancelled = false;
  fetchUsers()
    .then((data) => {
      if (!cancelled) {
        setUsers(data);
        setError("");
      }
    })
    .catch(() => {
      if (!cancelled) {
        setError("Kunne ikke hente brugere");
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

  const filteredUsers = users.filter((user) => {
    const value = search.toLowerCase();

    const matchesSearch =
      user.displayName
        .toLowerCase()
        .includes(value) ||
      user.username
        .toLowerCase()
        .includes(value);

    const matchesStatus =
      status === "" ||
      user.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.page}>
      <PageHeader
        title="Deltagere"
        description="Opret og administrér brugere"
        actions={
          <button
            onClick={() => setCreateOpen(true)}
          >
            + Tilføj bruger
          </button>
        }
      />
      <section className={styles.statusTabs}>
        <button
          className={
            status === "" ? styles.active : ""
          }
          onClick={() => setStatus("")}
        >
          Alle
          <span>{users.length}</span>
        </button>

        <button className={status === "ACTIVE" ? styles.active : ""} onClick={() => setStatus("ACTIVE")}>
          Aktive
          <span>
            {
              users.filter(
                (user) =>
                  user.status === "ACTIVE",
              ).length
            }
          </span>
        </button>

        <button
          className={status === "INACTIVE" ? styles.active : ""} onClick={() => setStatus("INACTIVE")}>
          Inaktive
          <span>
            {users.filter((user) => user.status === "INACTIVE",).length}
          </span>
        </button>
      </section>

      <section className={styles.toolbar}>
        <input
          type="search"
          placeholder="Søg på navn eller brugernavn..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </section>
      <section className={styles.content}>
        {loading && <p>Henter brugere...</p>}

        {error && (
          <p className={styles.error}>
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <span>
              {filteredUsers.length === 1? "1 bruger": `${filteredUsers.length} brugere`}
            </span>

            <table>
              <thead>
                <tr>
                  <th>Navn</th>
                  <th>Brugernavn</th>
                  <th>Systemrolle</th>
                  <th>Status</th>
                  <th>Oprettet</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>
                        {user.displayName}
                      </strong>
                    </td>

                    <td>{user.username}</td>

                    <td>
                      {user.role === "ADMIN"? "Administrator": "Bruger"}
                    </td>

                    <td>
                      <span
                        className={`${styles.statusBadge} ${user.status === "ACTIVE"? styles.activeStatus: styles.inactiveStatus }`}
                      >
                        {user.status === "ACTIVE"? "Aktiv": "Inaktiv"}
                      </span>
                    </td>

                    <td>
                      {new Intl.DateTimeFormat(
                        "da-DK",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      ).format(
                        new Date(user.createdAt),
                      )}
                    </td>

                    <td>
                      <button>
                        Redigér
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <CreateUserDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          void loadUsers();
        }}
      />
    </div>
  );
}