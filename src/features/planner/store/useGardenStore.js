import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";
import clamp from "clamp";
import { nanoid } from "nanoid";
import { planService } from "../services/planService";
import { gardenService } from "../services/gardenService";

import {
  SHAPE_TYPES,
  DEFAULTS,
  LIMITS,
} from "../../../shared/utils/constants/constants";

const getCurrentYear = () => new Date().getFullYear();

const initialLayout = {
  id: "layout-1",

  width: 1200,
  height: 800,
  shapes: {},
};

const initialPlan = {
  id: null,

  year: getCurrentYear(),
  layoutId: "layout-1",
  plantings: {},
  gardenId: null,
};

const initialState = {
  selected: null,

  currentLayout: structuredClone(initialLayout),
  currentPlan: structuredClone(initialPlan),

  currentGarden: null,
  gardens: [],
  seasonPlans: [],
  versions: [],

  isSaving: false,

  // preview (тимчасово залишаємо)
  isPreviewMode: false,
  previewVersionId: null,
  savedStateBeforePreview: null,

  // draft
  draftLayout: structuredClone(initialLayout),
  draftPlan: structuredClone(initialPlan),
  hasUnsavedChanges: false,
};

const ensureLayout = (state) => {
  if (!state.currentLayout) {
    state.currentLayout = { ...initialLayout };
  }
  if (!state.currentLayout.shapes) {
    state.currentLayout.shapes = {};
  }
};

export const useGardenStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setYear: (year) => {
        const { draftPlan, currentPlan } = get();

        const basePlan = draftPlan ?? JSON.parse(JSON.stringify(currentPlan));

        set(
          produce((state) => {
            if (!state.draftPlan) {
              state.draftPlan = basePlan;
            }
            state.draftPlan.year = year;
            state.hasUnsavedChanges = true;
          }),
        );
      },

      createRectangle: ({ x, y }) => {
        const { draftLayout, currentLayout } = get();

        const baseLayout =
          draftLayout ?? JSON.parse(JSON.stringify(currentLayout));

        set(
          produce((state) => {
            if (!state.draftLayout) {
              state.draftLayout = baseLayout;
            }

            const id = nanoid();

            state.draftLayout.shapes[id] = {
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
            state.selected = id;
            state.hasUnsavedChanges = true;
          }),
        );
      },

      createCircle: ({ x, y }) => {
        const { draftLayout, currentLayout } = get();

        const baseLayout =
          draftLayout ?? JSON.parse(JSON.stringify(currentLayout));
        set(
          produce((state) => {
            if (!state.draftLayout) {
              state.draftLayout = baseLayout;
            }
            const id = nanoid();

            state.draftLayout.shapes[id] = {
              id,
              type: SHAPE_TYPES.CIRCLE,
              role: "bed",
              radius: DEFAULTS.CIRCLE.RADIUS,
              rotation: 0,
              fill: DEFAULTS.CIRCLE.FILL,
              stroke: DEFAULTS.CIRCLE.STROKE,
              x,
              y,
            };
            state.selected = id;
            state.hasUnsavedChanges = true;
          }),
        );
      },

      deleteShape: (id) => {
        const { draftLayout, currentLayout, draftPlan, currentPlan } = get();

        const baseLayout =
          draftLayout ?? JSON.parse(JSON.stringify(currentLayout));

        const basePlan = draftPlan ?? JSON.parse(JSON.stringify(currentPlan));

        set(
          produce((state) => {
            // 🔹 init draftLayout
            if (!state.draftLayout) {
              state.draftLayout = baseLayout;
            }

            // 🔹 init draftPlan
            if (!state.draftPlan) {
              state.draftPlan = basePlan;
            }

            // 🔥 1. видаляємо shape
            if (state.draftLayout.shapes[id]) {
              delete state.draftLayout.shapes[id];
            }

            // 🔥 2. видаляємо planting
            if (state.draftPlan?.plantings?.[id]) {
              delete state.draftPlan.plantings[id];
            }

            // 🔥 3. якщо він був selected → очищаємо
            if (state.selected === id) {
              state.selected = null;
            }

            // 🔥 4. помічаємо зміни
            state.hasUnsavedChanges = true;
          }),
        );
      },

      moveShape: (id, node) => {
        const { draftLayout, currentLayout } = get();

        const baseLayout =
          draftLayout ?? JSON.parse(JSON.stringify(currentLayout));

        set(
          produce((state) => {
            if (!state.draftLayout) {
              state.draftLayout = baseLayout;
            }

            const shape = state.draftLayout.shapes[id];
            if (!shape) return;

            shape.x = node.x();
            shape.y = node.y();

            state.hasUnsavedChanges = true;
          }),
        );
      },

      updateAttribute: (attr, value) => {
        const { draftLayout, currentLayout, selected } = get();

        const baseLayout =
          draftLayout ?? JSON.parse(JSON.stringify(currentLayout));

        set(
          produce((state) => {
            if (!state.draftLayout) {
              state.draftLayout = baseLayout;
            }

            const shape = state.draftLayout.shapes[selected];
            if (!shape) return;

            shape[attr] = value;

            state.hasUnsavedChanges = true;
          }),
        );
      },

      transformRectangleShape: (node, id) => {
        const { draftLayout, currentLayout } = get();

        const baseLayout =
          draftLayout ?? JSON.parse(JSON.stringify(currentLayout));

        set(
          produce((state) => {
            if (!state.draftLayout) {
              state.draftLayout = baseLayout;
            }

            const shape = state.draftLayout.shapes[id];
            if (!shape) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            const newWidth = clamp(
              node.width() * scaleX,
              LIMITS.RECT.MIN,
              LIMITS.RECT.MAX,
            );

            const newHeight = clamp(
              node.height() * scaleY,
              LIMITS.RECT.MIN,
              LIMITS.RECT.MAX,
            );

            node.scaleX(1);
            node.scaleY(1);

            shape.x = node.x();
            shape.y = node.y();
            shape.rotation = node.rotation();
            shape.width = newWidth;
            shape.height = newHeight;

            state.hasUnsavedChanges = true;
          }),
        );
      },

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

      setPlanting: (shapeId, crop) => {
        const { draftPlan, currentPlan } = get();

        const basePlan = draftPlan ?? JSON.parse(JSON.stringify(currentPlan));

        set(
          produce((state) => {
            if (!state.draftPlan) {
              state.draftPlan = basePlan;
            }

            if (!state.draftPlan.plantings) {
              state.draftPlan.plantings = {};
            }

            if (!state.draftPlan.plantings[shapeId]) {
              state.draftPlan.plantings[shapeId] = {};
            }

            state.draftPlan.plantings[shapeId].crop = crop;

            state.hasUnsavedChanges = true;
          }),
        );
      },

      removePlanting: (shapeId) => {
        const { draftPlan, currentPlan } = get();

        const basePlan = draftPlan ?? JSON.parse(JSON.stringify(currentPlan));

        set(
          produce((state) => {
            if (!state.draftPlan) {
              state.draftPlan = basePlan;
            }

            if (state.draftPlan?.plantings?.[shapeId]) {
              delete state.draftPlan.plantings[shapeId];
            }

            state.hasUnsavedChanges = true;
          }),
        );
      },

      selectShape: (id) => set({ selected: id }),
      clearSelection: () => set({ selected: null }),

      reset: () =>
        set(
          produce((state) => {
            if (!state.draftLayout || !state.draftPlan) return;

            state.draftLayout.shapes = {};
            state.draftPlan.plantings = {};

            state.selected = null;
            state.hasUnsavedChanges = true;
          }),
        ),

      saveCurrentPlan: async () => {
        const { isSaving } = get();
        if (isSaving) return;

        try {
          set({ isSaving: true });

          const state = get();

          const draftLayout = structuredClone(state.draftLayout);
          const draftPlan = structuredClone(state.draftPlan);

          if (!draftLayout || !draftPlan) {
            throw new Error("Draft state is not initialized");
          }

          if (typeof draftPlan.gardenId !== "string") {
            throw new Error("Garden must be created before saving plan");
          }

          // ❗ тільки для API
          const { name, ...layoutWithoutName } = draftLayout;

          const payload = {
            year: draftPlan.year,
            layout: layoutWithoutName,
            plantings: draftPlan.plantings,
            comment: "Manual save",
          };

          let result;

          if (draftPlan.id) {
            result = await planService.updateSeasonPlan(draftPlan.id, payload);
          } else {
            result = await planService.createSeasonPlan({
              gardenId: draftPlan.gardenId,
              ...payload,
            });
          }

          const savedLayout = structuredClone(draftLayout);

          set(
            produce((state) => {
              state.currentLayout = savedLayout;

              state.draftLayout = structuredClone(savedLayout);

              state.currentPlan = {
                ...draftPlan,
                id: result._id,
                gardenId: result.gardenId,
                currentVersionId:
                  result.currentVersionId?._id ?? result.currentVersionId,
              };

              state.draftPlan = structuredClone(state.currentPlan);

              state.hasUnsavedChanges = false;
            }),
          );

          return result;
        } catch (error) {
          console.error("saveCurrentPlan error:", error);
          throw error;
        } finally {
          set({ isSaving: false });
        }
      },

      // ─────────────────────────────────────────────────────────
      // Garden Management (New API)
      // ─────────────────────────────────────────────────────────

      fetchGardens: async () => {
        const gardens = await gardenService.getGardens();
        set({ gardens });
        return gardens;
      },

      setCurrentGarden: (garden) =>
        set({
          currentGarden: garden,
        }),

      loadSeasonPlan: async (id) => {
        const seasonPlan = await planService.getSeasonPlan(id);

        const { name, ...layoutFromApi } = seasonPlan.layout || {};

        const layout = structuredClone({
          ...initialLayout,
          ...layoutFromApi,
          shapes: layoutFromApi?.shapes || {},
        });

        const plan = {
          id: seasonPlan._id,
          gardenId: seasonPlan.gardenId,
          year: seasonPlan.year,
          layoutId: seasonPlan.layout?.id || initialLayout.id,
          plantings: seasonPlan.plantings || {},
          currentVersionId: seasonPlan.currentVersionId,
        };

        const layoutClone = structuredClone(layout);
        const planClone = structuredClone(plan);

        set({
          currentLayout: layoutClone,
          currentPlan: planClone,

          draftLayout: structuredClone(layoutClone),
          draftPlan: structuredClone(planClone),

          selected: null,
          hasUnsavedChanges: false,
        });

        return seasonPlan;
      },

      updateGarden: async (patch) => {
        const { currentGarden } = get();

        if (!currentGarden?._id) return;

        const updated = await gardenService.updateGarden(
          currentGarden._id,
          patch,
        );

        set((state) => ({
          currentGarden: updated,
          gardens: state.gardens.map((g) =>
            g._id === updated._id ? updated : g,
          ),
        }));
      },

      fetchSeasonPlans: async (gardenId) => {
        const seasonPlans = await planService.getSeasonPlans(gardenId);
        set({ seasonPlans });
        return seasonPlans;
      },

      getVersionHistory: async (seasonPlanId) => {
        const versions = await planService.getVersionHistory(seasonPlanId);
        set({ versions });
        return versions;
      },

      restoreVersion: async (versionId) => {
        const result = await planService.restoreVersion(versionId);

        const { currentPlan } = get();
        if (currentPlan.id) {
          await get().loadSeasonPlan(currentPlan.id);

          await get().getVersionHistory(currentPlan.id);
        }
        set({
          isPreviewMode: false,
          previewVersionId: null,
          savedStateBeforePreview: null,
        });
        return result;
      },

      deleteGarden: async (gardenId) => {
        if (!window.confirm("Delete this garden?")) return;
        await gardenService.deleteGarden(gardenId);

        const remainingGardens = get().gardens.filter(
          (g) => g._id !== gardenId,
        );

        set(
          produce((state) => {
            state.gardens = remainingGardens;
            state.currentGarden = null;
          }),
        );

        if (remainingGardens.length > 0) {
          await get().selectGarden(remainingGardens[0]._id);
        } else {
          set({
            currentGarden: null,
            currentLayout: structuredClone(initialLayout),
            currentPlan: structuredClone(initialPlan),

            draftLayout: structuredClone(initialLayout),
            draftPlan: structuredClone(initialPlan),

            seasonPlans: [],
            versions: [],

            selected: null,
            hasUnsavedChanges: false,
          });
        }
      },

      deleteSeason: async (seasonPlanId) => {
        const { currentGarden, seasonPlans } = get();

        if (!currentGarden || !seasonPlans) return;

        if (seasonPlans.length === 1) {
          await get().deleteGarden(currentGarden._id);
          return;
        }

        await planService.deleteSeasonPlan(seasonPlanId);

        const remainingPlans = seasonPlans.filter(
          (p) => p._id !== seasonPlanId,
        );

        set({ seasonPlans: remainingPlans });

        const nextSeason = remainingPlans[0];

        if (!nextSeason) {
          throw new Error(
            "Invariant violated: garden must contain at least one season",
          );
        }

        await get().selectPlan(nextSeason._id);
      },

      // ─────────────────────────────────────────────────────────
      // Preview Mode
      // ─────────────────────────────────────────────────────────

      previewVersion: async (versionId) => {
        const { currentLayout, currentPlan, draftLayout, draftPlan } = get();

        const savedState = {
          currentLayout: structuredClone(currentLayout),
          currentPlan: structuredClone(currentPlan),
          draftLayout: structuredClone(draftLayout),
          draftPlan: structuredClone(draftPlan),
        };

        const version = await planService.getVersion(versionId);

        const previewLayout = {
          ...structuredClone(initialLayout),
          ...structuredClone(version.layout),
          shapes: structuredClone(version.layout?.shapes) || {},
        };

        const previewPlan = {
          ...structuredClone(currentPlan),
          plantings: structuredClone(version.plantings) || {},
        };

        set(
          produce((state) => {
            state.isPreviewMode = true;
            state.previewVersionId = versionId;
            state.savedStateBeforePreview = savedState;

            state.currentLayout = previewLayout;
            state.currentPlan = previewPlan;

            state.draftLayout = structuredClone(previewLayout);
            state.draftPlan = structuredClone(previewPlan);
          }),
        );
      },

      exitPreview: () => {
        const { savedStateBeforePreview } = get();

        if (!savedStateBeforePreview) return;

        set(
          produce((state) => {
            state.isPreviewMode = false;
            state.previewVersionId = null;

            state.currentLayout = savedStateBeforePreview.currentLayout;
            state.currentPlan = savedStateBeforePreview.currentPlan;

            state.draftLayout = savedStateBeforePreview.draftLayout;
            state.draftPlan = savedStateBeforePreview.draftPlan;

            state.savedStateBeforePreview = null;
          }),
        );
      },

      // ─────────────────────────────────────────────────────────
      // Garden & Season Selection
      // ─────────────────────────────────────────────────────────

      selectGarden: async (gardenId) => {
        const { gardens } = get();

        const garden = gardens.find((g) => g._id === gardenId);
        if (!garden) {
          throw new Error("Garden not found");
        }

        set({ currentGarden: garden });

        const seasonPlans = await get().fetchSeasonPlans(gardenId);

        const { currentPlan } = get();

        const exists =
          currentPlan &&
          currentPlan.gardenId === gardenId &&
          seasonPlans.some((p) => p._id === currentPlan.id);

        if (!exists && seasonPlans.length > 0) {
          await get().selectPlan(seasonPlans[0]._id);
        }

        return garden;
      },

      selectPlan: async (planId) => {
        if (!planId) return;

        await Promise.all([
          get().loadSeasonPlan(planId),
          get().getVersionHistory(planId),
        ]);
      },

      // ─────────────────────────────────────────────────────────
      // Create New Entities (+ New Season / + New Garden)
      // ─────────────────────────────────────────────────────────

      createNewSeason: async ({ year, layoutSource, sourceSeasonId }) => {
        const { currentGarden, currentLayout } = get();
        if (!currentGarden) {
          throw new Error("No current garden selected");
        }

        let layoutToUse = { ...initialLayout };
        let plantingsToUse = {};

        if (layoutSource === "copy" && sourceSeasonId) {
          layoutToUse = structuredClone(currentLayout);
          layoutToUse.id = nanoid();

          plantingsToUse = {};
        } else {
          layoutToUse = {
            ...initialLayout,
            id: nanoid(),
            //name: currentGarden.title,
          };
        }

        const newSeasonPlan = await planService.createSeasonPlan({
          gardenId: currentGarden._id,
          year,
          layout: layoutToUse,
          plantings: plantingsToUse,
          comment: "New season created",
        });

        await get().loadSeasonPlan(newSeasonPlan._id);

        await get().fetchSeasonPlans(currentGarden._id);

        return newSeasonPlan;
      },

      createNewGarden: async ({
        title,
        firstYear,
        useCurrentDraft = false,
      }) => {
        const { draftLayout, draftPlan } = get();

        const garden = await gardenService.createGarden({ title });

        let layout;
        let plantings;

        if (useCurrentDraft) {
          layout = {
            ...structuredClone(draftLayout),
            id: draftLayout?.id || nanoid(),
            name: title,
          };

          plantings = structuredClone(draftPlan?.plantings || {});
        } else {
          layout = {
            ...structuredClone(initialLayout),
            id: nanoid(),
            name: title,
          };

          plantings = {};
        }

        const firstSeasonPlan = await planService.createSeasonPlan({
          gardenId: garden._id,
          year: firstYear,
          layout,
          plantings,
          comment: "Initial season",
        });

        set(
          produce((state) => {
            state.gardens.push(garden);
            state.currentGarden = garden;
          }),
        );

        await get().fetchSeasonPlans(garden._id);

        await get().loadSeasonPlan(firstSeasonPlan._id);

        await get().fetchGardens();

        return { garden, firstSeasonPlan };
      },
    }),
    {
      name: "garden-storage",
      partialize: (state) => ({
        currentLayout: state.currentLayout,
        currentPlan: state.currentPlan,
        draftLayout: state.draftLayout,
        draftPlan: state.draftPlan,
        currentGarden: state.currentGarden,
      }),
      skipHydration: false,
    },
  ),
);
