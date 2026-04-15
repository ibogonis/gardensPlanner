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
  gardenId: null, // Will be set when user creates/selects a garden
};

const initialState = {
  selected: null,
  currentLayout: initialLayout,
  currentPlan: initialPlan,
  currentGarden: null, // Current garden being worked on
  gardens: [], // List of all gardens
  seasonPlans: [], // Season plans for the selected garden
  //plans: [],
  versions: [], // Version history for current plan
  isSaving: false,
  isPreviewMode: false,
  previewVersionId: null,
  savedStateBeforePreview: null, // Store state before preview
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
        const { isSaving } = get();
        if (isSaving) {
          console.warn("Save already in progress");
          return;
        }
        try {
          set({ isSaving: true });
          console.log("=== Starting saveCurrentPlan ===");
          let { currentLayout, currentPlan, createGarden } = get();
          console.log("Current plan state:", {
            id: currentPlan.id,
            gardenId: currentPlan.gardenId,
            year: currentPlan.year,
            hasLayout: !!currentLayout,
            hasShapes: Object.keys(currentLayout?.shapes || {}).length,
          });

          // Auto-create a garden if none exists
          if (!currentPlan.gardenId) {
            console.log("No gardenId, creating new garden...");
            const gardenTitle = currentLayout.name || "My Garden";
            try {
              console.log("Calling createGarden with title:", gardenTitle);
              await createGarden(gardenTitle);
              console.log(
                "Garden created successfully, continuing with save...",
              );
              // Refresh state after garden creation
              const state = get();
              currentLayout = state.currentLayout;
              currentPlan = state.currentPlan;
            } catch (error) {
              console.error(
                "Failed to create garden:",
                error.response || error,
              );
              throw new Error(
                `Failed to create garden: ${error.response?.status || error.message}`,
              );
            }
          }

          const payload = {
            year: currentPlan.year,
            layout: currentLayout,
            plantings: currentPlan.plantings,
            comment: "Manual save",
          };

          // If plan has an ID (exists in DB), update it (creates new version)
          if (currentPlan.id) {
            console.log("Updating existing plan:", currentPlan.id);
            const updated = await planService.updateSeasonPlan(
              currentPlan.id,
              payload,
            );

            // Update the store with new version info
            set(
              produce((state) => {
                ensurePlan(state);
                state.currentPlan.id = updated._id;
                state.currentPlan.currentVersionId = updated.currentVersionId;
              }),
            );

            return updated;
          }

          // Create new season plan
          const newPlanPayload = {
            gardenId: currentPlan.gardenId,
            year: currentPlan.year,
            ...payload,
          };

          console.log(
            "Creating new season plan for garden:",
            currentPlan.gardenId,
            "Payload:",
            newPlanPayload,
          );

          try {
            const created = await planService.createSeasonPlan(newPlanPayload);
            console.log("Season plan created successfully:", created);

            // Update the store with new plan info
            set(
              produce((state) => {
                ensurePlan(state);
                state.currentPlan.id = created._id;
                state.currentPlan.gardenId = created.gardenId;
                state.currentPlan.currentVersionId = created.currentVersionId;
              }),
            );

            return created;
          } catch (error) {
            console.error(
              "Failed to create season plan:",
              error.response || error,
            );
            throw new Error(
              `Failed to create season plan: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
            );
          }
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
            // Set gardenId for current plan
            ensurePlan(state);
            state.currentPlan.gardenId = garden._id;
            // Reset plan ID so next save creates a new season plan
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

      // Load season plan with new API
      loadSeasonPlan: async (id) => {
        const seasonPlan = await planService.getSeasonPlan(id);

        set({
          currentLayout: {
            ...initialLayout,
            ...seasonPlan.layout,
            shapes: seasonPlan.layout?.shapes || {},
          },
          currentPlan: {
            id: seasonPlan._id,
            gardenId: seasonPlan.gardenId,
            name: seasonPlan.layout?.name || "My garden",
            year: seasonPlan.year,
            layoutId: seasonPlan.layout?.id || initialLayout.id,
            plantings: seasonPlan.plantings || {},
            currentVersionId: seasonPlan.currentVersionId,
          },
          selected: null,
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

        // Reload the current plan to reflect restored version
        const { currentPlan } = get();
        if (currentPlan.id) {
          await get().loadSeasonPlan(currentPlan.id);
          // Refresh version history
          await get().getVersionHistory(currentPlan.id);
        }

        return result;
      },

      // ─────────────────────────────────────────────────────────
      // Preview Mode
      // ─────────────────────────────────────────────────────────

      previewVersion: async (versionId) => {
        const { currentLayout, currentPlan } = get();

        // Save current state before preview
        const savedState = {
          layout: { ...currentLayout },
          plan: { ...currentPlan },
        };

        // Fetch the version snapshot
        const version = await planService.getVersion(versionId);

        set(
          produce((state) => {
            state.isPreviewMode = true;
            state.previewVersionId = versionId;
            state.savedStateBeforePreview = savedState;
            // Load preview snapshot
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

      updateVersionName: async (newName) => {
        const { currentPlan, currentLayout, currentGarden } = get();
        if (!currentPlan?.currentVersionId) {
          throw new Error("No current version to update");
        }

        // Update the Garden document in backend
        if (currentGarden?._id) {
          await gardenService.updateGarden(currentGarden._id, {
            title: newName,
          });
        }

        // Update in backend via updateSeasonPlan with new name
        await planService.updateSeasonPlan(currentPlan.id, {
          year: currentPlan.year,
          layout: {
            ...currentLayout,
            name: newName,
          },
          plantings: currentPlan.plantings,
          comment: "Updated garden name",
        });

        // Update local state
        set(
          produce((state) => {
            ensureLayout(state);
            state.currentLayout.name = newName;
            if (state.currentGarden) {
              state.currentGarden.title = newName;
              // Also update the garden in the gardens array
              const gardenIndex = state.gardens.findIndex(
                (g) => g._id === state.currentGarden._id,
              );
              if (gardenIndex !== -1) {
                state.gardens[gardenIndex].title = newName;
              }
            }
          }),
        );
      },

      updateSeasonYear: async (newYear) => {
        const { currentPlan, currentLayout, seasonPlans } = get();
        if (!currentPlan?.id) {
          throw new Error("No current season plan to update");
        }

        // Check if a season with this year already exists for this garden
        const existingSeason = seasonPlans.find(
          (plan) => plan.year === newYear && plan._id !== currentPlan.id,
        );

        if (existingSeason) {
          throw new Error(
            `Season ${newYear} already exists for this garden. Please switch to that season if you want to modify it.`,
          );
        }

        // Update in backend
        await planService.updateSeasonPlan(currentPlan.id, {
          year: newYear,
          layout: currentLayout,
          plantings: currentPlan.plantings,
          comment: "Updated year",
        });

        // Update local state
        set(
          produce((state) => {
            ensurePlan(state);
            state.currentPlan.year = newYear;
            // Also update the plan in the seasonPlans array
            const planIndex = state.seasonPlans.findIndex(
              (p) => p._id === state.currentPlan.id,
            );
            if (planIndex !== -1) {
              state.seasonPlans[planIndex].year = newYear;
            }
          }),
        );
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

        // If copying layout from existing season
        if (layoutSource === "copy" && sourceSeasonId) {
          // Use current layout and plantings as source
          layoutToUse = {
            ...currentLayout,
            id: nanoid(), // New layout ID
          };
          // Don't copy plantings - new season should have empty crops
          plantingsToUse = {};
        } else {
          // Empty garden
          layoutToUse = {
            ...initialLayout,
            id: nanoid(),
            name: currentGarden.title,
          };
        }

        // Create new season plan
        const newSeasonPlan = await planService.createSeasonPlan({
          gardenId: currentGarden._id,
          year,
          layout: layoutToUse,
          plantings: plantingsToUse,
          comment: "New season created",
        });

        // Load the new season plan into current state
        await get().loadSeasonPlan(newSeasonPlan._id);

        // Refresh season plans list
        await get().fetchSeasonPlans(currentGarden._id);

        return newSeasonPlan;
      },

      createNewGarden: async ({ title, firstYear }) => {
        // Create garden
        const garden = await gardenService.createGarden({ title });

        // Create first season plan with empty layout
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

        // Update state
        set(
          produce((state) => {
            state.gardens.push(garden);
            state.currentGarden = garden;
          }),
        );

        await get().fetchSeasonPlans(garden._id);

        // Load the new season plan
        await get().loadSeasonPlan(firstSeasonPlan._id);

        // Refresh gardens list
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
