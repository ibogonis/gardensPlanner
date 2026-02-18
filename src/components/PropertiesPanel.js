import React, { useCallback } from "react";
import styles from "./PropertiesPanel.module.css";
import { useGardenStore } from "../state/useGardenStore";
import grow from "../data/grow.js";

export function PropertiesPanel() {
  // ─────────────────────────
  // Store selectors
  // ─────────────────────────

  const selectedId = useGardenStore((state) => state.selected);
  const shapes = useGardenStore((state) => state.currentLayout.shapes);
  const plantings = useGardenStore((state) => state.currentPlan.plantings);

  const updateAttribute = useGardenStore((state) => state.updateAttribute);

  const deleteShape = useGardenStore((state) => state.deleteShape);

  const setPlanting = useGardenStore((state) => state.setPlanting);

  const clearSelection = useGardenStore((state) => state.clearSelection);

  // ─────────────────────────
  // Derived values
  // ─────────────────────────

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
      <h4>Properties</h4>

      <div className={styles.properties}>
        {selectedShape ? (
          <>
            {/* Grow (тепер через plantings) */}
            <div className={styles.key}>
              Grow
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

            {/* Stroke */}
            <div className={styles.key}>
              Stroke
              <input
                className={styles.value}
                name="stroke"
                type="color"
                value={selectedShape.stroke || "#000000"}
                onChange={handleUpdateAttr}
              />
            </div>

            {/* Fill */}
            <div className={styles.key}>
              Fill
              <input
                className={styles.value}
                name="fill"
                type="color"
                value={selectedShape.fill || "#ffffff"}
                onChange={handleUpdateAttr}
              />
            </div>

            <div>
              <input type="button" value="delete" onClick={handleDelete} />
            </div>
          </>
        ) : (
          <div className="no-data">Nothing is selected</div>
        )}
      </div>
    </div>
  );
}
