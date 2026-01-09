export type ChefRank = "BLACK" | "WHITE";

export interface ChefStats {
  proficiency: number; // 숙련도
  creativity: number; // 창의력
  taste: number; // 미각
  mental: number; // 멘탈
  speed: number; // 속도 (5th stat)
}

export type ChefStatus = "alive" | "pending" | "eliminated";

export type CuisineType =
  | "KOREAN" // 한식
  | "CHINESE" // 중식
  | "JAPANESE" // 일식
  | "WESTERN" // 양식
  | "FUSION" // 퓨전
  | "SOUTHEAST_ASIAN" // 동남아
  | "INDIAN" // 인도
  | "MIDDLE_EASTERN" // 중동
  | "MEXICAN" // 멕시코
  | "DESSERT"; // 디저트

// 카테고리 한글 표시 매핑
export const CUISINE_LABELS: Record<CuisineType, string> = {
  KOREAN: "한식",
  CHINESE: "중식",
  JAPANESE: "일식",
  WESTERN: "양식",
  FUSION: "퓨전",
  SOUTHEAST_ASIAN: "동남아",
  INDIAN: "인도",
  MIDDLE_EASTERN: "중동",
  MEXICAN: "멕시코",
  DESSERT: "디저트",
};

export interface Chef {
  id: string;
  name: string; // 실명 (랜덤 생성)
  nickname: string; // 별명 (랜덤 생성)
  rank: ChefRank;
  stats: ChefStats;
  revealedStats: (keyof ChefStats)[]; // 공개된 스탯 목록
  cuisine: CuisineType; // 주 요리 장르 (deprecated, specialties로 대체)
  specialties: CuisineType[]; // 전문 분야 (1~3개)
  image?: string;
  bio?: string;
  status: ChefStatus; // 생존 상태
  eliminatedRound?: number; // 탈락한 라운드
  isPlayerPick?: boolean; // 플레이어 예측 여부
}
