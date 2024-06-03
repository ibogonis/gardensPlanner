import React, { useCallback } from "react";
import styles from "./PropertiesPanel.module.css";
import { useShapes, updateAttribute, deleteShape, selectShape } from "../state";
import grow from "../data/grow.js";
//const shapeSelector = (state) => state.shapes[state.selected];
const shapeSelector = (state) => {
  const selectedShape = state.shapes[state.selected];
  if (selectedShape) {
    return { ...selectedShape, id: state.selected };
  }
  return null;
};

export function PropertiesPanel() {
  const selectedShape = useShapes(shapeSelector);

  const updateAttr = useCallback((event) => {
    const attr = event.target.name;

    updateAttribute(attr, event.target.value);
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedShape && selectedShape.id) {
      deleteShape(selectedShape.id);
      selectShape(null); // Optionally deselect the shape after deleting
    }
  }, [selectedShape]);

  return (
    <div className={styles.panel}>
      <h4>Properties</h4>
      <div className={styles.properties}>
        {selectedShape ? (
          <>
            <div className={styles.key}>
              Grow{" "}
              <select
                name="grow"
                className={styles.value}
                value={selectedShape.grow}
                onChange={updateAttr}
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
              Stroke{" "}
              <input
                className={styles.value}
                name="stroke"
                type="color"
                value={selectedShape.stroke}
                onChange={updateAttr}
              />
            </div>

            <div className={styles.key}>
              Fill{" "}
              <input
                className={styles.value}
                name="fill"
                type="color"
                value={selectedShape.fill}
                onChange={updateAttr}
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
