import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";
import clamp from "clamp";
import { nanoid } from "nanoid";
import { planService } from "../services/planService";

import {
  SHAPE_TYPES,
  DEFAULTS,
  LIMITS,
} from "../../../shared/utils/constants/constants";

const getCurrentYear = () => new Date().getFullYear();

const initialLayout = {
  id: "layout-1",
  name: "My garden",
  width: 1200,
  height: 800,
  shapes: {},
};

const initialPlan = {
  id: "plan-1",
  name: "My garden",
  year: getCurrentYear(),
  layoutId: "layout-1",
  plantings: {},
};

const initialState = {
  selected: null,
  currentLayout: initialLayout,
  currentPlan: initialPlan,
  plans: [],
};

const ensureLayout = (state) => {
  if (!state.currentLayout) {
    state.currentLayout = { ...initialLayout };
  }
  if (!state.currentLayout.shapes) {
    state.currentLayout.shapes = {};
  }
};

const ensurePlan = (state) => {
  if (!state.currentPlan) {
    state.currentPlan = { ...initialPlan };
  }
  if (!state.currentPlan.plantings) {
    state.currentPlan.plantings = {};
  }
};

export const useGardenStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setLayoutName: (name) =>
        set(
          produce((state) => {
            ensurePlan(state);
            state.currentLayout.name = name;
            state.currentPlan.name = name;
          }),
        ),

      setYear: (year) =>
        set(
          produce((state) => {
            ensurePlan(state);
            state.currentPlan.year = year;
          }),
        ),

      createRectangle: ({ x, y }) =>
        set(
          produce((state) => {
            ensureLayout(state);
            const id = nanoid();

            state.currentLayout.shapes[id] = {
              id,
              type: SHAPE_TYPES.RECT,
              role: "bed",
              width: DEFAULTS.RECT.WIDTH,
              height: DEFAULTS.RECT.HEIGHT,
              rotation: DEFAULTS.RECT.ROTATION,
              fill: DEFAULTS.RECT.FILL,
              stroke: DEFAULTS.RECT.STROKE,
              x,
              y,
            };
          }),
        ),

      createCircle: ({ x, y }) =>
        set(
          produce((state) => {
            ensureLayout(state);
            const id = nanoid();

            state.currentLayout.shapes[id] = {
              id,
              type: SHAPE_TYPES.CIRCLE,
              role: "bed",
              radius: DEFAULTS.CIRCLE.RADIUS,
              rotation: 0,
              fill: DEFAULTS.RECT.FILL,
              stroke: DEFAULTS.RECT.STROKE,
              x,
              y,
            };
          }),
        ),

      deleteShape: (id) =>
        set(
          produce((state) => {
            ensureLayout(state);
            ensurePlan(state);
            delete state.currentLayout.shapes[id];
            delete state.currentPlan.plantings[id];
          }),
        ),

      moveShape: (id, node) =>
        set(
          produce((state) => {
            ensureLayout(state);
            const shape = state.currentLayout.shapes[id];
            if (!shape) return;
            shape.x = node.x();
            shape.y = node.y();
          }),
        ),

      updateAttribute: (attr, value) =>
        set(
          produce((state) => {
            ensureLayout(state);
            const shape = state.currentLayout.shapes[state.selected];
            if (!shape) return;
            shape[attr] = value;
          }),
        ),

      transformRectangleShape: (node, id) =>
        set(
          produce((state) => {
            ensureLayout(state);
            const shape = state.currentLayout.shapes[id];
            if (!shape) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);

            shape.x = node.x();
            shape.y = node.y();
            shape.rotation = node.rotation();

            shape.width = clamp(
              node.width() * scaleX,
              LIMITS.RECT.MIN,
              LIMITS.RECT.MAX,
            );

            shape.height = clamp(
              node.height() * scaleY,
              LIMITS.RECT.MIN,
              LIMITS.RECT.MAX,
            );
          }),
        ),

      transformCircleShape: (node, id) =>
        set(
          produce((state) => {
            ensureLayout(state);
            const shape = state.currentLayout.shapes[id];
            if (!shape) return;

            const scaleX = node.scaleX();
            node.scaleX(1);
            node.scaleY(1);

            shape.x = node.x();
            shape.y = node.y();

            shape.radius = clamp(
              (node.width() * scaleX) / 2,
              LIMITS.CIRCLE.MIN,
              LIMITS.CIRCLE.MAX,
            );
          }),
        ),

      setPlanting: (shapeId, crop) =>
        set(
          produce((state) => {
            ensurePlan(state);
            state.currentPlan.plantings[shapeId] = { crop };
          }),
        ),

      removePlanting: (shapeId) =>
        set(
          produce((state) => {
            ensurePlan(state);
            delete state.currentPlan.plantings[shapeId];
          }),
        ),

      selectShape: (id) => set({ selected: id }),
      clearSelection: () => set({ selected: null }),

      reset: () =>
        set({
          selected: null,
          currentLayout: { ...initialLayout },
          currentPlan: { ...initialPlan },
        }),

      saveCurrentPlan: async () => {
        const { currentLayout, currentPlan } = get();

        const payload = {
          name: currentPlan.name,
          year: currentPlan.year,
          layout: currentLayout,
          plantings: currentPlan.plantings,
        };

        return planService.savePlan(payload);
      },

      fetchPlans: async () => {
        const plans = await planService.getPlans();
        set({ plans });
        return plans;
      },

      loadPlan: async (id) => {
        const plan = await planService.getPlan(id);

        set({
          currentLayout: {
            ...initialLayout,
            ...plan.layout,
            shapes: plan.layout?.shapes || {},
          },
          currentPlan: {
            id: plan._id,
            name: plan.name,
            year: plan.year,
            layoutId: plan.layout?.id || initialLayout.id,
            plantings: plan.plantings || {},
          },
          selected: null,
        });

        return plan;
      },
    }),
    {
      name: "garden-storage",
      partialize: (state) => ({
        currentLayout: state.currentLayout,
        currentPlan: state.currentPlan,
      }),
      skipHydration: false,
    },
  ),
);
