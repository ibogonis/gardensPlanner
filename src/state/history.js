import { createStore } from "@halka/state";
import { produce } from "immer";

export const useHistory = createStore(() => []);

export const addSavedPlan = (plan) => {
  useHistory.set(
    produce((state) => {
      state.push(plan);
    })
  );
};

export const getSavedPlans = () => useHistory.get();
