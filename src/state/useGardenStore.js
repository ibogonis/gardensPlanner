import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";
import clamp from "clamp";
import { nanoid } from "nanoid";
import { planService } from "../services/planService";

import { SHAPE_TYPES, DEFAULTS, LIMITS } from "../data/constants";

const initialState = {
  selected: null,
  currentLayout: {
    id: "layout-1",
    name: "My garden",
    width: 1200,
    height: 800,
    shapes: {},
  },
  currentPlan: {
    id: "plan-1",
    name: "My garden",
    year: 2026,
    layoutId: "layout-1",
    plantings: {},
  },
  plans: [],
};

export const useGardenStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setLayoutName: (name) =>
        set(
          produce((state) => {
            state.currentLayout.name = name;
            state.currentPlan.name = name;
          }),
        ),

      setYear: (year) =>
        set(
          produce((state) => {
            state.currentPlan.year = year;
          }),
        ),

      createRectangle: ({ x, y }) =>
        set(
          produce((state) => {
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
            delete state.currentLayout.shapes[id];
            delete state.currentPlan.plantings[id];
          }),
        ),

      selectShape: (id) => set({ selected: id }),

      clearSelection: () => set({ selected: null }),

      moveShape: (id, node) =>
        set(
          produce((state) => {
            const shape = state.currentLayout.shapes[id];
            if (!shape) return;

            shape.x = node.x();
            shape.y = node.y();
          }),
        ),

      updateAttribute: (attr, value) =>
        set(
          produce((state) => {
            const shape = state.currentLayout.shapes[state.selected];
            if (!shape) return;

            shape[attr] = value;
          }),
        ),

      transformRectangleShape: (node, id) =>
        set(
          produce((state) => {
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
            state.currentPlan.plantings[shapeId] = { crop };
          }),
        ),

      removePlanting: (shapeId) =>
        set(
          produce((state) => {
            delete state.currentPlan.plantings[shapeId];
          }),
        ),

      reset: () =>
        set({
          selected: null,
          currentLayout: {
            id: "layout-1",
            name: "My garden",
            width: 1200,
            height: 800,
            shapes: {},
          },
          currentPlan: {
            id: "plan-1",
            name: "My garden",
            year: 2024,
            layoutId: "layout-1",
            plantings: {},
          },
        }),

      saveCurrentPlan: async () => {
        const { currentLayout, currentPlan } = get();

        const payload = {
          name: currentPlan.name,
          year: currentPlan.year,
          layout: currentLayout,
          plantings: currentPlan.plantings,
        };

        try {
          const savedPlan = await planService.savePlan(payload);
          return savedPlan;
        } catch (error) {
          console.error("Save plan failed:", error);
          throw error;
        }
      },

      fetchPlans: async () => {
        try {
          const plans = await planService.getPlans();

          set({ plans });

          return plans;
        } catch (error) {
          console.error("Fetch plans failed:", error);
        }
      },

      loadPlan: async (id) => {
        try {
          const plan = await planService.getPlan(id);

          set({
            currentLayout: plan.layout,
            currentPlan: {
              id: plan._id,
              name: plan.name,
              year: plan.year,
              layoutId: plan.layout.id,
              plantings: plan.plantings || {},
            },
            selected: null,
          });

          return plan;
        } catch (error) {
          console.error("Load plan failed:", error);
        }
      },
    }),
    {
      name: "garden-storage",

      partialize: (state) => ({
        currentLayout: state.currentLayout,
        currentPlan: state.currentPlan,
      }),
      skipHydration: true,
    },
  ),
);
