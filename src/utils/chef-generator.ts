import type { Chef, ChefRank, ChefStats } from "../types/chef";
import {
  generateBlackSpoonName,
  generateWhiteSpoonName,
  BLACK_SPOON_NICKNAMES,
  WHITE_SPOON_REAL_NAMES,
} from "./naming-generator";

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
    bio: rank === "WHITE" ? "백수저 요리사" : "흑수저 요리사",
  };
};

/**
 * 100명의 쉐프를 생성합니다. (백수저 20명, 흑수저 80명)
 * 이름 중복을 방지하기 위해 셔플 로직을 사용합니다.
 */
export const generateAllChefs = (): Chef[] => {
  const chefs: Chef[] = [];

  // 백수저 20명 생성 (실명 사용)
  // 데이터가 20명보다 적을 경우를 대비해 셔플 후 앞에서부터 가져옴
  const shuffledWhiteNames = [...WHITE_SPOON_REAL_NAMES]
    .sort(() => 0.5 - Math.random())
    .slice(0, 20);

  shuffledWhiteNames.forEach((name) => {
    chefs.push(generateChef("WHITE", name));
  });

  // 백수저가 20명이 안될 경우 부족한 만큼 랜덤 생성 (혹시 모를 예외 처리)
  while (chefs.length < 20) {
    chefs.push(generateChef("WHITE", generateWhiteSpoonName()));
  }

  // 흑수저 80명 생성 (닉네임 사용)
  const shuffledBlackNames = [...BLACK_SPOON_NICKNAMES]
    .sort(() => 0.5 - Math.random())
    .slice(0, 80);

  shuffledBlackNames.forEach((name) => {
    chefs.push(generateChef("BLACK", name));
  });

  // 흑수저가 80명이 안될 경우 부족한 만큼 랜덤 생성
  while (chefs.length < 100) {
    chefs.push(generateChef("BLACK", generateBlackSpoonName()));
  }

  return chefs;
};
