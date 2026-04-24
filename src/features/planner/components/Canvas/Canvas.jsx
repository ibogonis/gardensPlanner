import React, { useRef, useCallback } from "react";
import { Layer, Stage, Text } from "react-konva";
import styles from "./Canvas.module.css";

import { useGardenStore } from "../../store/useGardenStore";
import { DRAG_DATA_KEY, SHAPE_TYPES } from "../../../../shared/utils/constants/constants";
import { Shape } from "./Shape";
import PlannerHeader from "../PlannerHeader/PlannerHeader";

const handleDragOver = (event) => event.preventDefault();

export default function Canvas() {
  const stageRef = useRef();

const draftLayout = useGardenStore((state) => state.draftLayout);
const currentLayout = useGardenStore((state) => state.currentLayout);
const draftPlan = useGardenStore((state) => state.draftPlan);
const currentPlan = useGardenStore((state) => state.currentPlan);

const shapes = draftLayout?.shapes ?? currentLayout?.shapes ?? {};
const plantings = draftPlan?.plantings ?? currentPlan?.plantings ?? {};

  const createRectangle = useGardenStore((state) => state.createRectangle);
  const createCircle = useGardenStore((state) => state.createCircle);
  const clearSelection = useGardenStore((state) => state.clearSelection);

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
      <PlannerHeader />

      <Stage
        ref={stageRef}
        width={window.innerWidth - 260} // Account for left sidebar (260px)
        height={window.innerHeight - 56} // Account for header (56px)
        onClick={clearSelection}
      >
        <Layer>
          {shapes && plantings && Object.entries(shapes).map(([id, shape]) => (
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
