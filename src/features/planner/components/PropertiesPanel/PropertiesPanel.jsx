import React, { useCallback } from "react";
import styles from "./PropertiesPanel.module.css";
import { useGardenStore } from "../../store/useGardenStore";
import grow from "../../../../shared/utils/data/grow.js";

export function PropertiesPanel() {
  // ─────────────────────────
  // Store selectors
  // ─────────────────────────

  const selectedId = useGardenStore((state) => state.selected);

  const draftLayout = useGardenStore((state) => state.draftLayout);
  const currentLayout = useGardenStore((state) => state.currentLayout);

  const draftPlan = useGardenStore((state) => state.draftPlan);
  const currentPlan = useGardenStore((state) => state.currentPlan);

  const updateAttribute = useGardenStore((state) => state.updateAttribute);
  const deleteShape = useGardenStore((state) => state.deleteShape);
  const setPlanting = useGardenStore((state) => state.setPlanting);
  const clearSelection = useGardenStore((state) => state.clearSelection);

  // ─────────────────────────
  // Derived values
  // ─────────────────────────

  const shapes = draftLayout?.shapes ?? currentLayout?.shapes ?? {};
  const plantings = draftPlan?.plantings ?? currentPlan?.plantings ?? {};

  const selectedShape = selectedId ? shapes[selectedId] : null;
  const selectedCrop = selectedId ? plantings[selectedId]?.crop || "" : "";

  // ─────────────────────────
  // Handlers
  // ─────────────────────────

  const handleGrowChange = useCallback(
    (event) => {
      if (!selectedId) return;
      setPlanting(selectedId, event.target.value);
    },
    [selectedId, setPlanting],
  );

  const handleUpdateAttr = useCallback(
    (event) => {
      updateAttribute(event.target.name, event.target.value);
    },
    [updateAttribute],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    deleteShape(selectedId);
    clearSelection();
  }, [selectedId, deleteShape, clearSelection]);

  // ─────────────────────────
  // Render
  // ─────────────────────────

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Properties</h3>

      <div className={styles.properties}>
        {selectedShape ? (
          <>
            <div className={`${styles.key} ${styles.growRow}`}>
              <span className={styles.keyLabel}>Grow</span>
              <select
                className={styles.value}
                value={selectedCrop}
                onChange={handleGrowChange}
              >
                <option value="">Choose what to grow</option>
                {grow.map((item) => (
                  <option value={item.title} key={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.key}>
              <span className={styles.keyLabel}>Stroke</span>
              <input
                className={styles.colorPicker}
                name="stroke"
                type="color"
                value={selectedShape.stroke || "#000000"}
                onChange={handleUpdateAttr}
              />
            </div>

            <div className={styles.key}>
              <span className={styles.keyLabel}>Fill</span>
              <input
                className={styles.colorPicker}
                name="fill"
                type="color"
                value={selectedShape.fill || "#ffffff"}
                onChange={handleUpdateAttr}
              />
            </div>

            <button className={styles.deleteButton} onClick={handleDelete}>
              Delete
            </button>
          </>
        ) : (
          <div className={styles.noData}>Nothing is selected</div>
        )}
      </div>
    </div>
  );
}