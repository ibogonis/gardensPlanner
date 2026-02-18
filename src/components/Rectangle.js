import React, { useRef, useEffect, useCallback } from "react";
import { Rect as KonvaRectangle, Transformer } from "react-konva";
import { useGardenStore } from "../state/useGardenStore";
import { LIMITS } from "../data/constants";

const boundBoxCallbackForRectangle = (oldBox, newBox) => {
  if (
    newBox.width < LIMITS.RECT.MIN ||
    newBox.height < LIMITS.RECT.MIN ||
    newBox.width > LIMITS.RECT.MAX ||
    newBox.height > LIMITS.RECT.MAX
  ) {
    return oldBox;
  }
  return newBox;
};

export function Rectangle({ id, isSelected, ...shapeProps }) {
  const shapeRef = useRef();
  const transformerRef = useRef();

  // ─────────────────────────
  // Store actions
  // ─────────────────────────

  const selectShape = useGardenStore((state) => state.selectShape);
  const moveShape = useGardenStore((state) => state.moveShape);
  const transformRectangleShape = useGardenStore(
    (state) => state.transformRectangleShape,
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
    transformRectangleShape(shapeRef.current, id);
  }, [id, transformRectangleShape]);

  return (
    <>
      <KonvaRectangle
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
          boundBoxFunc={boundBoxCallbackForRectangle}
        />
      )}
    </>
  );
}
