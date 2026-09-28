import { useAuth } from "../auth/useAuth";
import { useSyncStatus } from "../hooks/useSyncStatus";
import styles from "./SyncStatus.module.css";

export default function SyncStatus() {
    const { user } = useAuth();
    const { apiStatus, online, pendingCount, failedCount } = useSyncStatus(user?.id);

    const hasPending = pendingCount > 0;
    const hasError = failedCount > 0;

    let label: string;
    let detail: string;
    let statusClass: string;

    if (apiStatus === "unknown") {
        label = "Kontrollerer forbindelse";
        detail = "Venter på svar fra serveren";
        statusClass = styles.pending;
    } else if (!online) {
        label = "Offline";
        detail = hasPending
            ? `${pendingCount} ${pendingCount === 1 ? "ændring" : "ændringer"} afventer synkronisering`
            : "Arbejder fra gemte data";
        statusClass = styles.offline;
    } else if (hasError) {
        label = "Synkroniseringsfejl";
        detail = `${pendingCount} ${pendingCount === 1 ? "ændring" : "ændringer"} afventer`;
        statusClass = styles.error;
    } else if (hasPending) {
        label = "Online";
        detail = `${pendingCount} ${pendingCount === 1 ? "ændring" : "ændringer"} afventer synkronisering`;
        statusClass = styles.pending;
    } else {
        label = "Online";
        detail = "Synkroniseret";
        statusClass = styles.online;
    }

    return (
        <div className={`${styles.status} ${statusClass}`} role="status" aria-live="polite">
            <span className={styles.indicator} aria-hidden="true" />
            <div>
                <strong>{label}</strong>
                <span>{detail}</span>
            </div>
        </div>
    );
}