import type { Chef, ChefRank, ChefStats } from "../types/chef";

// 임시 ID 생성을 위한 간단한 유틸리티
const generateId = (): string => Math.random().toString(36).substr(2, 9);

// 임시 스탯 생성 (1-100)
const generateStats = (): ChefStats => ({
  proficiency: Math.floor(Math.random() * 100) + 1,
  creativity: Math.floor(Math.random() * 100) + 1,
  taste: Math.floor(Math.random() * 100) + 1,
  mental: Math.floor(Math.random() * 100) + 1,
  speed: Math.floor(Math.random() * 100) + 1,
});

export const generateChef = (rank: ChefRank, name: string): Chef => {
  return {
    id: generateId(),
    name,
    rank,
    stats: generateStats(),
    bio: `Generated chef with rank ${rank}`,
  };
};
