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
  name: "My garden",
  width: 1200,
  height: 800,
  shapes: {},
};

const initialPlan = {
  id: null,
  name: "My garden",
  year: getCurrentYear(),
  layoutId: "layout-1",
  plantings: {},
  gardenId: null,
};

const initialState = {
  selected: null,

  currentLayout: { ...initialLayout },
  currentPlan: { ...initialPlan },

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
  draftPlan: null,
  draftLayout: null,
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

      setLayoutName: (name) => {
        const { draftLayout, currentLayout } = get();

        const baseLayout =
          draftLayout ?? JSON.parse(JSON.stringify(currentLayout));

        set(
          produce((state) => {
            if (!state.draftLayout) {
              state.draftLayout = baseLayout;
            }

            state.draftLayout.name = name;

            state.hasUnsavedChanges = true;
          }),
        );
      },

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
        set({
          selected: null,
          currentLayout: { ...initialLayout },
          currentPlan: { ...initialPlan },
        }),

      saveCurrentPlan: async () => {
        const { isSaving } = get();
        if (isSaving) return;

        try {
          set({ isSaving: true });

          let {
            draftLayout,
            draftPlan,
            currentLayout,
            currentPlan,
            currentGarden,
            createGarden,
          } = get();

          let layoutToSave = draftLayout ?? currentLayout;
          let planToSave = draftPlan ?? currentPlan;

          if (!planToSave.gardenId) {
            const gardenTitle = layoutToSave.name || "My Garden";

            await createGarden(gardenTitle);

            const state = get();

            layoutToSave = state.draftLayout ?? state.currentLayout;
            planToSave = state.draftPlan ?? state.currentPlan;
          }

          if (
            currentGarden?._id &&
            layoutToSave.name &&
            layoutToSave.name !== currentGarden.title
          ) {
            await gardenService.updateGarden(currentGarden._id, {
              title: layoutToSave.name,
            });
          }

          const payload = {
            year: planToSave.year,
            layout: layoutToSave,
            plantings: planToSave.plantings,
            comment: "Manual save",
          };

          let result;

          if (planToSave.id) {
            result = await planService.updateSeasonPlan(planToSave.id, payload);
          } else {
            result = await planService.createSeasonPlan({
              gardenId: planToSave.gardenId,
              ...payload,
            });
          }
          await get().fetchSeasonPlans(planToSave.gardenId);
          set(
            produce((state) => {
              state.currentLayout = layoutToSave;
              state.currentPlan = {
                ...planToSave,
                id: result._id,
                gardenId: result.gardenId,
                currentVersionId: result.currentVersionId,
              };

              state.draftLayout = JSON.parse(JSON.stringify(layoutToSave));
              state.draftPlan = JSON.parse(JSON.stringify(state.currentPlan));

              if (state.currentGarden) {
                state.currentGarden.title = layoutToSave.name;

                const gardenIndex = state.gardens.findIndex(
                  (g) => g._id === state.currentGarden._id,
                );

                if (gardenIndex !== -1) {
                  state.gardens[gardenIndex].title = layoutToSave.name;
                }
              }

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

      createGarden: async (title) => {
        const garden = await gardenService.createGarden({ title });

        set(
          produce((state) => {
            state.gardens.push(garden);
            state.currentGarden = garden;

            ensurePlan(state);
            state.currentPlan.gardenId = garden._id;

            state.currentPlan.id = null;
          }),
        );

        return garden;
      },

      setCurrentGarden: (garden) =>
        set(
          produce((state) => {
            state.currentGarden = garden;
            ensurePlan(state);
            state.currentPlan.gardenId = garden?._id || null;
          }),
        ),

      loadSeasonPlan: async (id) => {
        const seasonPlan = await planService.getSeasonPlan(id);

        const layout = {
          ...initialLayout,
          ...seasonPlan.layout,
          shapes: seasonPlan.layout?.shapes || {},
        };

        const plan = {
          id: seasonPlan._id,
          gardenId: seasonPlan.gardenId,
          name: seasonPlan.layout?.name || "My garden",
          year: seasonPlan.year,
          layoutId: seasonPlan.layout?.id || initialLayout.id,
          plantings: seasonPlan.plantings || {},
          currentVersionId: seasonPlan.currentVersionId,
        };

        set({
          currentLayout: layout,
          currentPlan: plan,

          draftLayout: structuredClone(layout),
          draftPlan: structuredClone(plan),

          selected: null,
          hasUnsavedChanges: false,
        });

        return seasonPlan;
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

      // ─────────────────────────────────────────────────────────
      // Preview Mode
      // ─────────────────────────────────────────────────────────

      previewVersion: async (versionId) => {
        const { currentLayout, currentPlan } = get();

        const savedState = {
          layout: { ...currentLayout },
          plan: { ...currentPlan },
        };

        const version = await planService.getVersion(versionId);

        set(
          produce((state) => {
            state.isPreviewMode = true;
            state.previewVersionId = versionId;
            state.savedStateBeforePreview = savedState;

            state.currentLayout = {
              ...initialLayout,
              ...version.layout,
              shapes: version.layout?.shapes || {},
            };
            state.currentPlan.plantings = version.plantings || {};
          }),
        );
      },

      exitPreview: () => {
        const { savedStateBeforePreview } = get();

        if (savedStateBeforePreview) {
          set(
            produce((state) => {
              state.isPreviewMode = false;
              state.previewVersionId = null;

              state.currentLayout = savedStateBeforePreview.layout;
              state.currentPlan.plantings =
                savedStateBeforePreview.plan.plantings;
              console.log(state.currentLayout);
              state.draftLayout = JSON.parse(
                JSON.stringify(state.currentLayout),
              );
              state.draftPlan = JSON.parse(JSON.stringify(state.currentPlan));

              state.hasUnsavedChanges = false;

              state.savedStateBeforePreview = null;
            }),
          );
        }
      },

      // ─────────────────────────────────────────────────────────
      // Garden & Season Selection
      // ─────────────────────────────────────────────────────────

      selectGarden: async (gardenId) => {
        const { gardens, currentPlan } = get();

        const garden = gardens.find((g) => g._id === gardenId);
        if (!garden) {
          throw new Error("Garden not found");
        }

        get().setCurrentGarden(garden);

        const seasonPlans = await get().fetchSeasonPlans(gardenId);

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
        await get().loadSeasonPlan(planId);

        await get().getVersionHistory(planId);
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
          layoutToUse = {
            ...currentLayout,
            id: nanoid(),
          };

          plantingsToUse = {};
        } else {
          layoutToUse = {
            ...initialLayout,
            id: nanoid(),
            name: currentGarden.title,
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

      createNewGarden: async ({ title, firstYear }) => {
        const garden = await gardenService.createGarden({ title });

        const firstSeasonPlan = await planService.createSeasonPlan({
          gardenId: garden._id,
          year: firstYear,
          layout: {
            ...initialLayout,
            id: nanoid(),
            name: title,
          },
          plantings: {},
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
        currentGarden: state.currentGarden,
      }),
      skipHydration: false,
    },
  ),
);
