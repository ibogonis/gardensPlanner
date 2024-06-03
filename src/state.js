import { createStore } from "@halka/state";
import { produce } from "immer";
import clamp from "clamp";
import { nanoid } from "nanoid";

import { SHAPE_TYPES, DEFAULTS, LIMITS } from "./data/constants";

const APP_NAMESPACE = "__integrtr_diagrams__";

const baseState = {
  selected: null,
  name: "My garden",
  year: "2024",
  shapes: {},
};

export const useShapes = createStore(() => {
  const initialState = JSON.parse(localStorage.getItem(APP_NAMESPACE));

  //return { ...baseState, shapes: initialState ?? {} };
  return initialState ? { ...baseState, ...initialState } : baseState;
});
const setState = (fn) => {
  useShapes.set(produce(fn));
  saveState();
};

export const setNamePlan = (name) => {
  setState((state) => {
    state.name = name;
  });
};

export const setYearPlan = (year) => {
  setState((state) => {
    state.year = year;
  });
};

const saveState = () => {
  const state = useShapes.get();
  const { selected, ...stateToSave } = state;
  localStorage.setItem(APP_NAMESPACE, JSON.stringify(stateToSave));
};

export const saveDiagram = () => {
  //const state = useShapes.get();
  // const { selected, ...stateToSave } = state;
  //localStorage.setItem(APP_NAMESPACE, JSON.stringify(stateToSave));
  const plan = JSON.parse(localStorage.getItem(APP_NAMESPACE));
  console.log(plan);
};

export const reset = () => {
  localStorage.removeItem(APP_NAMESPACE);

  useShapes.set(baseState);
};

export const createRectangle = ({ x, y, grow }) => {
  setState((state) => {
    state.shapes[nanoid()] = {
      type: SHAPE_TYPES.RECT,
      width: DEFAULTS.RECT.WIDTH,
      height: DEFAULTS.RECT.HEIGHT,
      fill: DEFAULTS.RECT.FILL,
      stroke: DEFAULTS.RECT.STROKE,
      rotation: DEFAULTS.RECT.ROTATION,
      x,
      y,
      grow: "",
    };
  });
};

export const createCircle = ({ x, y, grow }) => {
  setState((state) => {
    state.shapes[nanoid()] = {
      type: SHAPE_TYPES.CIRCLE,
      radius: DEFAULTS.CIRCLE.RADIUS,
      fill: DEFAULTS.CIRCLE.FILL,
      stroke: DEFAULTS.CIRCLE.STROKE,
      x,
      y,
      grow: "",
    };
  });
};

export const selectShape = (id) => {
  setState((state) => {
    state.selected = id;
  });
};

export const clearSelection = () => {
  setState((state) => {
    state.selected = null;
  });
};

export const moveShape = (id, event) => {
  setState((state) => {
    const shape = state.shapes[id];

    if (shape) {
      shape.x = event.target.x();
      shape.y = event.target.y();
    }
  });
};

export const updateAttribute = (attr, value) => {
  setState((state) => {
    const shape = state.shapes[state.selected];

    if (shape) {
      shape[attr] = value;
    }
  });
};

export const transformRectangleShape = (node, id, event) => {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  node.scaleX(1);
  node.scaleY(1);

  setState((state) => {
    const shape = state.shapes[id];

    if (shape) {
      shape.x = node.x();
      shape.y = node.y();

      shape.rotation = node.rotation();

      shape.width = clamp(
        node.width() * scaleX,

        LIMITS.RECT.MIN,

        LIMITS.RECT.MAX
      );
      shape.height = clamp(
        node.height() * scaleY,
        LIMITS.RECT.MIN,
        LIMITS.RECT.MAX
      );
    }
  });
};

export const transformCircleShape = (node, id, event) => {
  const scaleX = node.scaleX();

  node.scaleX(1);
  node.scaleY(1);

  setState((state) => {
    const shape = state.shapes[id];

    if (shape) {
      shape.x = node.x();
      shape.y = node.y();

      shape.radius = clamp(
        (node.width() * scaleX) / 2,
        LIMITS.CIRCLE.MIN,
        LIMITS.CIRCLE.MAX
      );
    }
  });
};

export const deleteShape = (id) => {
  setState((state) => {
    delete state.shapes[id];
  });
};
