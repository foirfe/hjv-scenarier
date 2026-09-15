import styles from "./TaskDrawer.module.css";

export type ChecklistItemDraft = {
  id: string;
  itemText: string;
};

type Props = {
  items: ChecklistItemDraft[];
  onChange: (
    items: ChecklistItemDraft[],
  ) => void;
};

export default function ChecklistEditor({
  items,
  onChange,
}: Props) {
  function addItem() {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        itemText: "",
      },
    ]);
  }

  function updateItem(
    id: string,
    itemText: string,
  ) {
    onChange(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              itemText,
            }
          : item,
      ),
    );
  }

  function removeItem(id: string) {
    onChange(
      items.filter(
        (item) => item.id !== id,
      ),
    );
  }

  return (
    <section>
      <h3>Tjekliste</h3>

      <small>
        Tilføj de punkter deltageren skal
        gennemføre.
      </small>

      <div className={styles.optionsEditor}>
        <div className={styles.optionsHeader}>
          <strong>Punkter</strong>

          <span>
            Afkrydses under øvelsen
          </span>
        </div>

        {items.map((item, index) => (
          <div
            key={item.id}
            className={styles.checklistRow}
          >
            <span
              className={styles.optionNumber}
            >
              {index + 1}
            </span>

            <input
              type="text"
              value={item.itemText}
              placeholder={`Punkt ${index + 1}`}
              onChange={(event) =>
                updateItem(
                  item.id,
                  event.target.value,
                )
              }
            />

            <button
              type="button"
              className={styles.removeOption}
              aria-label="Fjern punkt"
              onClick={() =>
                removeItem(item.id)
              }
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          className={styles.addOption}
          onClick={addItem}
        >
          + Tilføj punkt
        </button>
      </div>
    </section>
  );
}