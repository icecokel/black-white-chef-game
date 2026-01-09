import type { Chef } from "../types/chef";

/**
 * 쉐프의 합격 확률을 계산합니다.
 * 5개 스탯 총합(최대 500)을 백분율로 환산
 */
export const calculatePassRate = (chef: Chef): number => {
  const { proficiency, creativity, taste, mental, speed } = chef.stats;
  const totalStats = proficiency + creativity + taste + mental + speed;
  return (totalStats / 500) * 100;
};

/**
 * 합격 여부를 판정합니다.
 * @returns true = 합격, false = 탈락
 */
export const judgeChef = (chef: Chef): boolean => {
  const passRate = calculatePassRate(chef);
  const roll = Math.random() * 100;
  return roll < passRate;
};

/**
 * 속도 스탯을 기반으로 가중치 셔플된 큐를 생성합니다.
 * 속도가 높을수록 앞쪽에 배치될 확률이 높음
 */
export const createSpeedWeightedQueue = (chefs: Chef[]): string[] => {
  // 가중치 랜덤 정렬: speed를 가중치로 사용
  const weighted = chefs.map((chef) => ({
    id: chef.id,
    weight: chef.stats.speed + Math.random() * 20, // 속도 + 랜덤 요소
  }));

  // 가중치 내림차순 정렬
  weighted.sort((a, b) => b.weight - a.weight);

  return weighted.map((item) => item.id);
};

/**
 * 쉐프 목록을 정렬합니다.
 * 순서: 생존 흑수저 → 생존 백수저 → 탈락 흑수저 → 탈락 백수저
 */
export const sortChefList = (chefs: Chef[]): Chef[] => {
  return [...chefs].sort((a, b) => {
    // 1. 상태로 정렬 (alive 먼저)
    if (a.status !== b.status) {
      return a.status === "alive" ? -1 : 1;
    }

    // 2. 같은 상태 내에서 rank로 정렬 (BLACK 먼저)
    if (a.rank !== b.rank) {
      return a.rank === "BLACK" ? -1 : 1;
    }

    return 0;
  });
};
