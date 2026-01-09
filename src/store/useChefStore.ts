import { create } from "zustand";
import type { Chef, ChefRank } from "../types/chef";
import { generateAllChefs } from "../utils/chef-generator";

interface ChefStore {
  chefs: Chef[];
  initializeGame: () => void;
  getChefsByRank: (rank: ChefRank) => Chef[];
}

export const useChefStore = create<ChefStore>((set, get) => ({
  chefs: [],

  initializeGame: () => {
    const newChefs = generateAllChefs();
    set({ chefs: newChefs });
  },

  getChefsByRank: (rank: ChefRank) => {
    return get().chefs.filter((chef) => chef.rank === rank);
  },
}));
