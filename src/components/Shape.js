import React from "react";
import { SHAPE_TYPES } from "../data/constants";
import { useGardenStore } from "../state/useGardenStore";
import { Circle } from "./Circle";
import { Rectangle } from "./Rectangle";

export function Shape({ shape }) {
  const selectedId = useGardenStore((state) => state.selected);
  const isSelected = selectedId === shape.id;

  if (shape.type === SHAPE_TYPES.RECT) {
    return <Rectangle {...shape} isSelected={isSelected} />;
  }

  if (shape.type === SHAPE_TYPES.CIRCLE) {
    return <Circle {...shape} isSelected={isSelected} />;
  }

  return null;
}
