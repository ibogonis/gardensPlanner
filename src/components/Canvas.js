import React, { useRef, useCallback } from "react";
import { Layer, Stage, Text } from "react-konva";
import styles from "./Canvas.module.css";

import {
  useShapes,
  clearSelection,
  createCircle,
  createRectangle,
  reset,
  setNamePlan,
  setYearPlan,
} from "../state/stateCanvas";
import { addSavedPlan, getSavedPlans } from "../state/history";
import { DRAG_DATA_KEY, SHAPE_TYPES } from "../data/constants";
import { Shape } from "./Shape";

const handleDragOver = (event) => event.preventDefault();

export default function Canvas() {
  const shapes = useShapes((state) => Object.entries(state.shapes));

  const stageRef = useRef();

  const handleDrop = useCallback((event) => {
    const draggedData = event.nativeEvent.dataTransfer.getData(DRAG_DATA_KEY);

    if (draggedData) {
      const { offsetX, offsetY, type, clientHeight, clientWidth } =
        JSON.parse(draggedData);

      stageRef.current.setPointersPositions(event);

      const coords = stageRef.current.getPointerPosition();

      if (type === SHAPE_TYPES.RECT) {
        // rectangle x, y is at the top,left corner
        createRectangle({
          x: coords.x - offsetX,
          y: coords.y - offsetY,
        });
      } else if (type === SHAPE_TYPES.CIRCLE) {
        // circle x, y is at the center of the circle
        createCircle({
          x: coords.x - (offsetX - clientWidth / 2),
          y: coords.y - (offsetY - clientHeight / 2),
        });
      }
    }
  }, []);

  const handleNamePlan = (event) => {
    const name = event.target.value;
    setNamePlan(name);
  };
  const handleYearPlan = (event) => {
    const value = event.target.value;
    setYearPlan(value);
  };
  const handleSave = () => {
    const plan = JSON.parse(localStorage.getItem("__integrtr_diagrams__"));
    console.log(plan);
    if (!plan || !plan.shapes || Object.keys(plan.shapes).length === 0) {
      console.log("No shapes to save.");
      return;
    } else {
      addSavedPlan(plan);
    }

    const result = getSavedPlans();
    console.log("result", result);
  };

  return (
    <div
      className={styles.canvas}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className={styles.planProperties}>
        <label htmlFor="nameForGarden">Name your garden</label>
        <input
          type="text"
          id="nameForGarden"
          placeholder="My garden"
          onChange={handleNamePlan}
        ></input>
        <label htmlFor="year">Year</label>
        <input
          type="number"
          id="year"
          min="2000"
          max="2099"
          step="1"
          defaultValue="2024"
          onChange={handleYearPlan}
        />
      </div>
      <div className={styles.buttons}>
        <button onClick={handleSave}>Save</button>
        <button onClick={reset}>Reset</button>
      </div>
      <Stage
        ref={stageRef}
        width={window.innerWidth - 250}
        height={window.innerHeight}
        onClick={clearSelection}
      >
        <Layer>
          {shapes.map(([key, shape]) => (
            <React.Fragment key={key}>
              <Shape key={key} shape={{ ...shape, id: key }} />
              {shape.grow && (
                <Text
                  key={shape.id + "text"}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  text={shape.grow}
                  fontSize={15}
                  fontFamily="Calibri"
                  fill="#000"
                  rotation={shape.rotation}
                  width={shape.rotation === 0 ? shape.width : shape.height}
                  padding={5}
                  align="center"
                  verticalAlign="middle"
                  //draggable
                />
              )}
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
