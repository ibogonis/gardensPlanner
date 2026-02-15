import React, { useRef, useCallback } from "react";
import { Layer, Stage, Text } from "react-konva";
import styles from "./Canvas.module.css";

import { useGardenStore } from "../state/useGardenStore";
import { DRAG_DATA_KEY, SHAPE_TYPES } from "../data/constants";
import { Shape } from "./Shape";

const handleDragOver = (event) => event.preventDefault();

export default function Canvas() {
  const stageRef = useRef();

  const shapes = useGardenStore((state) => state.currentLayout.shapes);
  const plantings = useGardenStore((state) => state.currentPlan.plantings);
  const layoutName = useGardenStore((state) => state.currentLayout.name);
  const year = useGardenStore((state) => state.currentPlan.year);

  const createRectangle = useGardenStore((state) => state.createRectangle);
  const createCircle = useGardenStore((state) => state.createCircle);
  const clearSelection = useGardenStore((state) => state.clearSelection);
  const reset = useGardenStore((state) => state.reset);
  const setLayoutName = useGardenStore((state) => state.setLayoutName);
  const setYear = useGardenStore((state) => state.setYear);

  const handleDrop = useCallback(
    (event) => {
      const draggedData = event.nativeEvent.dataTransfer.getData(DRAG_DATA_KEY);

      if (!draggedData) return;

      const { offsetX, offsetY, type, clientHeight, clientWidth } =
        JSON.parse(draggedData);

      stageRef.current.setPointersPositions(event);
      const coords = stageRef.current.getPointerPosition();

      if (type === SHAPE_TYPES.RECT) {
        createRectangle({
          x: coords.x - offsetX,
          y: coords.y - offsetY,
        });
      }

      if (type === SHAPE_TYPES.CIRCLE) {
        createCircle({
          x: coords.x - (offsetX - clientWidth / 2),
          y: coords.y - (offsetY - clientHeight / 2),
        });
      }
    },
    [createRectangle, createCircle],
  );

  return (
    <div
      className={styles.canvas}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className={styles.planProperties}>
        <label>Name your garden</label>
        <input
          type="text"
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
        />

        <label>Year</label>
        <input
          type="number"
          min="2000"
          max="2099"
          step="1"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      </div>

      <div className={styles.buttons}>
        <button onClick={reset}>Reset</button>
      </div>

      <Stage
        ref={stageRef}
        width={window.innerWidth - 250}
        height={window.innerHeight}
        onClick={clearSelection}
      >
        <Layer>
          {Object.entries(shapes).map(([id, shape]) => (
            <React.Fragment key={id}>
              <Shape shape={{ ...shape, id }} />

              {plantings[id]?.crop && (
                <Text
                  x={shape.x}
                  y={shape.y}
                  text={plantings[id].crop}
                  fontSize={15}
                  fontFamily="Calibri"
                  fill="#000"
                  rotation={shape.rotation}
                  width={
                    shape.type === SHAPE_TYPES.RECT
                      ? shape.width
                      : shape.radius * 2
                  }
                  padding={5}
                  align="center"
                  verticalAlign="middle"
                />
              )}
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
