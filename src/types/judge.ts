export interface Judge {
  id: string;
  name: string;
  // 선호도 (0~100): 높을수록 해당 스탯을 중요하게 봄
  preferences: {
    taste: number;
    creativity: number;
    completeness: number;
  };
  // 투표 이력
  voteHistory: {
    matchIndex: number; // 1, 2, 3
    pick: "BLACK" | "WHITE";
  }[];
}

// 100명의 심사위원 생성 (랜덤 성향)
export const generateJudges = (count: number): Judge[] => {
  return Array.from({ length: count }, (_, i) => {
    const isTasteOriented = Math.random() > 0.5; // 맛 중시파 vs 밸런스파

    return {
      id: `judge-${i + 1}`,
      name: `심사위원 ${i + 1}`,
      preferences: {
        taste: isTasteOriented
          ? 80 + Math.random() * 20 // 80~100
          : 50 + Math.random() * 50, // 50~100
        creativity: Math.random() * 100,
        completeness: Math.random() * 100,
      },
      voteHistory: [],
    };
  });
};
