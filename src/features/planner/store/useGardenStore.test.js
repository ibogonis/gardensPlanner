import { useGardenStore } from "./useGardenStore";

describe("selectGarden", () => {
  beforeEach(() => {
    useGardenStore.setState({
      gerdens: [],
      currentGarden: null,
      currentPlan: null,
      seasonPlans: [],
    });
  });

  it("should select garden and call selectPlan when current plan belongs to another garden", async () => {
    const gardenId = "garden-1";
    const garden = { _id: gardenId, title: "My Garden" };

    const seasonPlansMock = [{ _id: "plan-1" }, { _id: "plan-2" }];

    useGardenStore.setState({
      gardens: [garden],
      currentPlan: {
        id: "old-plan",
        gardenId: "other-garden",
      },
    });

    const store = useGardenStore.getState();

    store.fetchSeasonPlans = jest.fn().mockResolvedValue(seasonPlansMock);
    store.selectPlan = jest.fn().mockResolvedValue();

    const result = await store.selectGarden(gardenId);

    const updatedState = useGardenStore.getState();

    expect(result).toEqual(garden);
    expect(updatedState.currentGarden).toEqual(garden);
    expect(store.fetchSeasonPlans).toHaveBeenCalledWith(gardenId);
    expect(store.selectPlan).toHaveBeenCalledWith("plan-1");
  });

  it("should NOT call selectPlan if current plan belongs to selected garden", async () => {
    const gardenId = "garden-1";
    const garden = { _id: gardenId, title: "My Garden" };

    const seasonPlansMock = [
      { _id: "plan-1", gardenId: "garden-1" },
      { _id: "plan-2", gardenId: "garden-1" },
    ];
    useGardenStore.setState({
      gardens: [garden],
      currentPlan: {
        id: "plan-1",
        gardenId: "garden-1",
      },
    });
    const store = useGardenStore.getState();
    store.fetchSeasonPlans = jest.fn().mockResolvedValue(seasonPlansMock);
    store.selectPlan = jest.fn().mockResolvedValue();

    await store.selectGarden(gardenId);
    expect(store.selectPlan).not.toHaveBeenCalled();
    expect(store.fetchSeasonPlans).toHaveBeenCalledWith(gardenId);
    const updatedState = useGardenStore.getState();
    expect(updatedState.currentGarden).toEqual(garden);
  });

  it("should NOT call selectPlan when exists is false and seasonPlans list is empty", async () => {
    const gardenId = "garden-1";
    const garden = { _id: gardenId, title: "My Garden" };

    const seasonPlansMock = [];

    useGardenStore.setState({
      gardens: [garden],
      currentPlan: {
        id: "old-plan",
        gardenId: "other-garden",
      },
    });

    const store = useGardenStore.getState();

    store.fetchSeasonPlans = jest.fn().mockResolvedValue(seasonPlansMock);
    store.selectPlan = jest.fn().mockResolvedValue();

    const result = await store.selectGarden(gardenId);

    expect(store.selectPlan).not.toHaveBeenCalled();
    expect(store.fetchSeasonPlans).toHaveBeenCalledWith(gardenId);
    const updatedState = useGardenStore.getState();
    expect(updatedState.currentGarden).toEqual(garden);
    expect(result).toEqual(garden);
  });

  it("should call selectPlan when currentPlan is null and seasonPlans exist", async () => {
    const gardenId = "garden-1";

    const garden = { _id: gardenId, title: "My Garden" };

    const seasonPlansMock = [{ _id: "plan-1" }, { _id: "plan-2" }];

    useGardenStore.setState({
      gardens: [garden],
      currentPlan: null,
    });

    const store = useGardenStore.getState();

    store.fetchSeasonPlans = jest.fn().mockResolvedValue(seasonPlansMock);
    store.selectPlan = jest.fn().mockResolvedValue();

    await store.selectGarden(gardenId);

    expect(store.selectPlan).toHaveBeenCalledWith("plan-1");

    expect(store.fetchSeasonPlans).toHaveBeenCalledWith(gardenId);

    const updatedState = useGardenStore.getState();
    expect(updatedState.currentGarden).toEqual(garden);
  });

  it("should throw error when gardenId does not exist in gardens", async () => {
    useGardenStore.setState({
      gardens: [{ _id: "garden-1" }],
    });

    const store = useGardenStore.getState();

    await expect(store.selectGarden("garden-999")).rejects.toThrow(
      "Garden not found",
    );
    expect(store.fetchSeasonPlans).not.toHaveBeenCalled();
  });
});

describe("setCurrentGarden", () => {
  beforeEach(() => {
    useGardenStore.setState({
      currentGarden: null,
      currentPlan: {
        id: "plan-1",
        gardenId: null,
        plantings: {},
      },
    });
  });

  it("should set currentGarden and update currentPlan.gardenId", () => {
    const garden = { _id: "garden-1", title: "My Garden" };

    useGardenStore.getState().setCurrentGarden(garden);

    const state = useGardenStore.getState();

    expect(state.currentGarden).toEqual(garden);
    expect(state.currentPlan.gardenId).toBe("garden-1");
  });

  it("should set gardenId to null when garden is null", () => {
    useGardenStore.getState().setCurrentGarden(null);

    const state = useGardenStore.getState();

    expect(state.currentGarden).toBe(null);
    expect(state.currentPlan.gardenId).toBe(null);
  });

  it("should initialize currentPlan if it does not exist", () => {
    useGardenStore.setState({
      currentPlan: null,
    });

    const garden = { _id: "garden-1" };

    useGardenStore.getState().setCurrentGarden(garden);

    const state = useGardenStore.getState();

    expect(state.currentPlan).not.toBeNull();
    expect(state.currentPlan.gardenId).toBe("garden-1");
  });
});
