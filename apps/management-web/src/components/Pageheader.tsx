import type { ReactNode } from "react";
import styles from "./Pageheader.module.css"

type PageHeaderProps = {
    title: string;
    description?: string;
    actions?: ReactNode
}

export default function PageHeader({
    title,
    description,
    actions,
}: PageHeaderProps) {
    return(
        <header className={styles.pageHeader}>
            <div className={styles.titleDescription}>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
        {actions && <div className={styles.actions}>{actions}</div>}
        </header>
    );
}