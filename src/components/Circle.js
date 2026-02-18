import React, { useRef, useEffect, useCallback } from "react";
import { Circle as KonvaCircle, Transformer } from "react-konva";
import { useGardenStore } from "../state/useGardenStore";
import { LIMITS } from "../data/constants";

const boundBoxCallbackForCircle = (oldBox, newBox) => {
  if (
    newBox.width < LIMITS.CIRCLE.MIN ||
    newBox.height < LIMITS.CIRCLE.MIN ||
    newBox.width > LIMITS.CIRCLE.MAX ||
    newBox.height > LIMITS.CIRCLE.MAX
  ) {
    return oldBox;
  }
  return newBox;
};

export function Circle({ id, isSelected, ...shapeProps }) {
  const shapeRef = useRef();
  const transformerRef = useRef();

  // ─────────────────────────
  // Store actions
  // ─────────────────────────

  const selectShape = useGardenStore((state) => state.selectShape);
  const moveShape = useGardenStore((state) => state.moveShape);
  const transformCircleShape = useGardenStore(
    (state) => state.transformCircleShape,
  );

  // ─────────────────────────
  // Selection logic
  // ─────────────────────────

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleSelect = useCallback(
    (event) => {
      event.cancelBubble = true;
      selectShape(id);
    },
    [id, selectShape],
  );

  const handleDrag = useCallback(() => {
    moveShape(id, shapeRef.current);
  }, [id, moveShape]);

  const handleTransform = useCallback(() => {
    transformCircleShape(shapeRef.current, id);
  }, [id, transformCircleShape]);

  return (
    <>
      <KonvaCircle
        ref={shapeRef}
        {...shapeProps}
        draggable
        onClick={handleSelect}
        onTap={handleSelect}
        onDragStart={handleSelect}
        onDragEnd={handleDrag}
        onTransformEnd={handleTransform}
      />

      {isSelected && (
        <Transformer
          ref={transformerRef}
          anchorSize={5}
          borderDash={[6, 2]}
          rotateEnabled={false}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-right",
            "bottom-left",
          ]}
          boundBoxFunc={boundBoxCallbackForCircle}
        />
      )}
    </>
  );
}
