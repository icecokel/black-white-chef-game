import type { Chef, ChefRank, ChefStats, CuisineType } from "../types/chef";
import {
  generateCombinatorialName,
  generateRealName,
} from "./naming-generator";

// 임시 ID 생성을 위한 간단한 유틸리티
const generateId = (): string => Math.random().toString(36).substr(2, 9);

const CUISINES: CuisineType[] = [
  "KOREAN",
  "CHINESE",
  "JAPANESE",
  "WESTERN",
  "FUSION",
];

const SPECIALTIES = [
  "비빔밥",
  "불고기",
  "김치찌개",
  "파스타",
  "스테이크",
  "초밥",
  "탕수육",
  "짬뽕",
  "마라탕",
  "타코",
  "버거",
  "디저트",
  "해산물",
  "바베큐",
  "면요리",
  "튀김",
  "조림",
  "찜",
  "구이",
  "샐러드",
];

// 스탯 생성 (1-100)
// 백수저: 평균이 높고 편차가 적음
// 흑수저: 평균이 낮지만 편차가 크고, 가끔 천재 출현
const generateStats = (rank: ChefRank): ChefStats => {
  const isWhite = rank === "WHITE";
  const baseAvg = isWhite ? 90 : 75;
  const variance = isWhite ? 5 : 15;

  const getStat = () => {
    let val = baseAvg + (Math.random() * variance * 2 - variance);
    // 흑수저 히든 천재 로직 (5% 확률로 98~100 스탯)
    if (!isWhite && Math.random() < 0.05) {
      val = 98 + Math.random() * 2;
    }
    return Math.min(100, Math.max(1, Math.floor(val)));
  };

  return {
    proficiency: getStat(),
    creativity: getStat(),
    taste: getStat(),
    mental: getStat(),
    speed: getStat(),
  };
};

const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * 쉐프를 생성합니다.
 * 모든 쉐프는 실명(name)과 별명(nickname)을 모두 가집니다.
 */
export const generateChef = (rank: ChefRank): Chef => {
  return {
    id: generateId(),
    name: generateRealName(),
    nickname: generateCombinatorialName(),
    rank,
    stats: generateStats(rank),
    cuisine: getRandomElement(CUISINES),
    specialty: getRandomElement(SPECIALTIES),
    bio: rank === "WHITE" ? "대한민국 최고의 요리사" : "재야의 숨은 고수",
  };
};

/**
 * 100명의 쉐프를 생성합니다. (흑수저 80명, 백수저 20명)
 * 순서: 흑수저 -> 백수저 (상단에 흑수저, 하단에 백수저)
 */
export const generateAllChefs = (): Chef[] => {
  const blackChefs: Chef[] = [];
  const whiteChefs: Chef[] = [];

  // 흑수저 80명 생성
  for (let i = 0; i < 80; i++) {
    blackChefs.push(generateChef("BLACK"));
  }

  // 백수저 20명 생성
  for (let i = 0; i < 20; i++) {
    whiteChefs.push(generateChef("WHITE"));
  }

  // 흑수저 먼저, 백수저 나중에
  return [...blackChefs, ...whiteChefs];
};
