import { useRef, useState, type ChangeEvent } from "react";

import { apiDownload, apiFetch } from "../../api/apiFetch";

import styles from "./ImportTasksDrawer.module.css";

type PreviewRow = {
    rowNumber: number;
    valid: boolean;
    errors: string[];

    duplicate: boolean;

    existingTask: {
        id: string;
        name: string;
    } | null;

    data: {
        name: string;
        environmentName: string;
        taskTypeName: string;
        status: string | null;
    };
};


type ImportPreview = {
    valid: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    rows: PreviewRow[];
};

type Props = {
    open: boolean;
    onClose: () => void;
    onImported: () => void;
};

export default function ImportTasksDrawer({
    open,
    onClose,
    onImported,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [importing, setImporting] = useState(false);

    function resetFile() {
        setFile(null);
        setPreview(null);
        setSelectedRows(new Set());
        setError("");
        if (fileInputRef.current) {
            fileInputRef.current.value =
                "";
        }
    }
    function handleFileChange(
        event:
            ChangeEvent<HTMLInputElement>,
    ) {
        const selectedFile =
            event.target.files?.[0] ??
            null;

        setPreview(null);
        setSelectedRows(new Set());
        setError("");

        if (!selectedFile) {
            setFile(null);
            return;
        }

        if (
            !selectedFile.name
                .toLowerCase()
                .endsWith(".xlsx")
        ) {
            setFile(null);
            setError("Vælg en Excel-fil i .xlsx-format");
            event.target.value = "";
            return;
        }
        setFile(selectedFile);
    }

    async function downloadTemplate() {
        try {
            setDownloading(true);
            setError("");

            await apiDownload(
                "/tasks/import/template",
                "HJV-opgave-import.xlsx",
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Skabelonen kunne ikke hentes",
            );
        } finally {
            setDownloading(false);
        }
    }

    async function previewImport() {
        if (!file) {
            setError("Vælg først en Excel-fil");
            return;
        }
        try {
            setUploading(true);
            setError("");
            setPreview(null);
            const formData =
                new FormData();
            formData.append(
                "file",
                file,
            );
            const result =
                await apiFetch<ImportPreview>(
                    "/tasks/import/preview",
                    {
                        method: "POST",
                        body: formData,
                    },
                );

            setPreview(result);
            setSelectedRows(
                new Set(
                    result.rows
                        .filter(
                            (row) =>
                                row.valid &&
                                !row.duplicate,
                        )
                        .map(
                            (row) =>
                                row.rowNumber,
                        ),
                ),
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Excel-filen kunne ikke kontrolleres",
            );
        } finally {
            setUploading(false);
        }
    }
    if (!open) {
        return null;
    }

    async function importSelectedTasks() {
        if (!file || selectedRows.size === 0) {
            return;
        }

        const confirmed =
            window.confirm(`Vil du importere ${selectedRows.size} ${selectedRows.size === 1 ? "opgave" : "opgaver"}?`);
        if (!confirmed) {
            return;
        }
        try {
            setImporting(true);
            setError("");
            const formData =
                new FormData();
            formData.append(
                "file",
                file,
            );
            formData.append(
                "selectedRows",
                JSON.stringify(
                    [...selectedRows].sort(
                        (a, b) => a - b,
                    ),
                ),
            );
            await apiFetch(
                "/tasks/import",
                {
                    method: "POST",
                    body: formData,
                },
            );
            resetFile();
            onImported();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Opgaverne kunne ikke importeres",
            );
        } finally {
            setImporting(false);
        }
    }

    return (
        <div
            className={styles.drawerLayer}
        >
            <button
                type="button"
                className={styles.backdrop}
                onClick={onClose}
                aria-label="Luk"
            />

            <aside
                className={styles.drawer}
            >
                <header
                    className={styles.header}
                >
                    <div>
                        <span
                            className={styles.eyebrow}
                        >
                            Excel-import
                        </span>

                        <h2>
                            Importer opgaver
                        </h2>

                        <p>
                            Download skabelonen,
                            udfyld opgaverne og
                            upload filen igen.
                        </p>
                    </div>

                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        x
                    </button>
                </header>

                <div
                    className={styles.content}
                >
                    {error && (
                        <div
                            className={styles.error}
                        >
                            {error}
                        </div>
                    )}

                    <section
                        className={styles.step}
                    >
                        <div
                            className={styles.stepNumber}
                        >
                            1
                        </div>

                        <div
                            className={styles.stepContent}>
                            <h3>
                                Hent skabelon
                            </h3>

                            <p>
                                Skabelonen indeholder
                                de miljøer og
                                opgavetyper, der
                                findes i systemet.
                            </p>

                            <button
                                type="button"
                                className={styles.secondaryButton}
                                disabled={downloading}
                                onClick={() => void downloadTemplate()}
                            >
                                {downloading
                                    ? "Henter..."
                                    : "Download Excel-skabelon"}
                            </button>
                        </div>
                    </section>

                    <section
                        className={styles.step}
                    >
                        <div className={styles.stepNumber}>
                            2
                        </div>

                        <div className={styles.stepContent}>
                            <h3>
                                Upload udfyldt fil
                            </h3>

                            <p>
                                Kun .xlsx-filer kan
                                importeres.
                            </p>

                            <label
                                className={styles.filePicker}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    onChange={handleFileChange}
                                />

                                <span>
                                    {file
                                        ? file.name
                                        : "Vælg Excel-fil"}
                                </span>
                            </label>

                            {file && (
                                <div className={styles.fileActions}>
                                    <span>
                                        {(
                                            file.size /
                                            1024
                                        ).toFixed(1)}{" "}
                                        KB
                                    </span>

                                    <button
                                        type="button"
                                        onClick={resetFile}>
                                        Fjern
                                    </button>
                                </div>
                            )}

                            <button
                                type="button"
                                className={styles.primaryButton}
                                disabled={
                                    !file ||
                                    uploading
                                }
                                onClick={() =>
                                    void previewImport()
                                }
                            >
                                {uploading
                                    ? "Kontrollerer..."
                                    : "Upload og kontrollér"}
                            </button>
                        </div>
                    </section>

                    {preview && (
                        <ImportPreviewResult
                            preview={preview}
                            selectedRows={selectedRows}
                            onSelectionChange={setSelectedRows}
                            importing={importing}
                            onImport={() =>
                                void importSelectedTasks()
                            }
                        />
                    )}
                </div>
            </aside>
        </div>
    );
}

type ImportPreviewResultProps = {
    preview: ImportPreview;

    selectedRows: Set<number>;

    onSelectionChange: (
        rows: Set<number>,
    ) => void;
    importing: boolean;
    onImport: () => void;
};

function ImportPreviewResult({
    preview,
    selectedRows,
    onSelectionChange,
    importing,
    onImport,
}: ImportPreviewResultProps) {
    const duplicateCount =
        preview.rows.filter(
            (row) =>
                row.valid &&
                row.duplicate,
        ).length;

    const newRows =
        preview.rows.filter(
            (row) =>
                row.valid &&
                !row.duplicate,
        );

    const selectedCount =
        selectedRows.size;

    const selectedDuplicateCount =
        preview.rows.filter(
            (row) =>
                row.duplicate &&
                selectedRows.has(
                    row.rowNumber,
                ),
        ).length;

    function toggleRow(
        rowNumber: number,
    ) {
        const next =
            new Set(selectedRows);

        if (
            next.has(rowNumber)
        ) {
            next.delete(rowNumber);
        } else {
            next.add(rowNumber);
        }

        onSelectionChange(next);
    }

    function selectAllNew() {
        const next =
            new Set(selectedRows);

        for (
            const row of newRows
        ) {
            next.add(
                row.rowNumber,
            );
        }

        onSelectionChange(next);
    }

    function deselectAll() {
        onSelectionChange(
            new Set(),
        );
    }

    const allNewSelected =
        newRows.length > 0 &&
        newRows.every(
            (row) =>
                selectedRows.has(
                    row.rowNumber,
                ),
        );

    return (
        <section
            className={
                styles.preview
            }
        >
            <div
                className={
                    styles.previewHeader
                }
            >
                <div>
                    <h3>
                        Resultat
                    </h3>

                    <p>
                        {preview.totalRows}{" "}
                        {preview.totalRows === 1
                            ? "opgave fundet"
                            : "opgaver fundet"}
                    </p>
                </div>

                <span
                    className={
                        preview.invalidRows === 0
                            ? styles.validBadge
                            : styles.invalidBadge
                    }
                >
                    {preview.invalidRows === 0
                        ? "Klar til valg"
                        : `${preview.invalidRows} ${preview.invalidRows ===
                            1
                            ? "fejl"
                            : "fejl"
                        }`}
                </span>
            </div>

            <div
                className={
                    styles.summary
                }
            >
                <div>
                    <strong>
                        {
                            preview.totalRows
                        }
                    </strong>

                    <span>
                        Fundet
                    </span>
                </div>

                <div>
                    <strong>
                        {
                            newRows.length
                        }
                    </strong>

                    <span>
                        Nye
                    </span>
                </div>

                <div>
                    <strong>
                        {
                            duplicateCount
                        }
                    </strong>

                    <span>
                        Mulige dubletter
                    </span>
                </div>

                <div>
                    <strong>
                        {
                            preview.invalidRows
                        }
                    </strong>

                    <span>
                        Med fejl
                    </span>
                </div>
            </div>

            <div
                className={styles.selectionToolbar} >
                <div>
                    <strong>
                        {selectedCount}
                    </strong>{" "}
                    {selectedCount === 1
                        ? "opgave valgt"
                        : "opgaver valgt"}
                </div>

                <div className={styles.selectionActions}>
                    <button
                        type="button"
                        disabled={allNewSelected}
                        onClick={selectAllNew}>
                        Vælg alle nye
                    </button>

                    <button
                        type="button"
                        disabled={selectedCount === 0}
                        onClick={deselectAll}>
                        Fravælg alle
                    </button>
                </div>
            </div>

            {selectedDuplicateCount >
                0 && (
                    <div className={styles.duplicateNotice}>
                        Du har valgt{" "}
                        {selectedDuplicateCount}{" "}
                        {selectedDuplicateCount === 1 ? "mulig dublet" : "mulige dubletter"}
                        . De vil blive oprettet
                        som nye opgaver ved
                        import.
                    </div>
                )}

            <div className={styles.previewRows} >
                {preview.rows.map(
                    (row) => {
                        const selected =
                            selectedRows.has(row.rowNumber);

                        return (
                            <div key={row.rowNumber}
                                className={`${styles.previewRow} ${selected ? styles.previewRowSelected : ""}`} >
                                <div className={styles.rowSelection} >
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        disabled={!row.valid}
                                        onChange={() => toggleRow(row.rowNumber)}
                                        aria-label={`Vælg række ${row.rowNumber}`}
                                    />
                                </div>

                                <div className={styles.rowContent}>
                                    <div className={styles.rowTitle}>
                                        <strong>
                                            Række{" "}
                                            {row.rowNumber}
                                            :{" "}
                                            {row.data
                                                .name ||
                                                "Uden navn"}
                                        </strong>

                                        {!row.valid ? (
                                            <span className={styles.rowErrorBadge}>
                                                Fejl
                                            </span>
                                        ) : row.duplicate ? (
                                            <span
                                                className={styles.duplicateBadge}>
                                                Mulig dublet
                                            </span>
                                        ) : (
                                            <span className={styles.rowValid}>
                                                Ny
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className={styles.rowMeta}>
                                        {row.data
                                            .taskTypeName && (
                                                <span>
                                                    {row.data.taskTypeName}
                                                </span>
                                            )}

                                        {row.data
                                            .environmentName && (
                                                <>
                                                    <span>
                                                        ·
                                                    </span>
                                                    <span>
                                                        {row.data.environmentName}
                                                    </span>
                                                </>
                                            )}

                                        {row.data.status && (
                                            <>
                                                <span>
                                                    ·
                                                </span>

                                                <span>
                                                    {row.data.status
                                                    }
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {row.duplicate &&
                                        row.existingTask && (
                                            <div className={styles.existingTask}>
                                                <span>
                                                    Findes
                                                    muligvis
                                                    allerede:
                                                </span>

                                                <strong>
                                                    {row.existingTask.name}
                                                </strong>
                                            </div>
                                        )}

                                    {!row.valid &&
                                        row.errors .length >  0 && (
                                            <div className={styles.rowErrors}>
                                                {row.errors.map(
                                                    (
                                                        error,
                                                        index,
                                                    ) => (
                                                        <span key={`${row.rowNumber}-${index}`}>
                                                            {error}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                </div>
                            </div>
                        );
                    },
                )}
            </div>

            <div
                className={styles.importSummary}>
                <div>
                    <span>
                        Valgt til import
                    </span>

                    <strong>
                        {selectedCount}{" "}
                        {selectedCount === 1
                            ? "opgave"
                            : "opgaver"}
                    </strong>
                </div>

                {selectedCount === 0 ? (
                    <small>
                        Vælg mindst én gyldig
                        opgave for at fortsætte.
                    </small>
                ) : (
                    <button
                        type="button"
                        className={styles.importButton}
                        disabled={importing}
                        onClick={onImport}>
                        {importing
                            ? "Importerer..."
                            : `Importer ${selectedCount} ${selectedCount === 1
                                ? "opgave"
                                : "opgaver"
                            }`}
                    </button>
                )}
            </div>
        </section>
    );
}
