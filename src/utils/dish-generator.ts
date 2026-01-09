import type { Chef, CuisineType } from "../types/chef";
import type { Dish } from "../types/match";

// 재료 타입 정의
export interface Ingredient {
  name: string;
  cuisineAffinity: CuisineType[]; // 이 재료와 어울리는 요리 장르
}

// 메인 재료 리스트 (10개 매치용 + 여유분) - 카테고리 친화도 포함
export const MAIN_INGREDIENTS: Ingredient[] = [
  { name: "흑돼지", cuisineAffinity: ["KOREAN"] },
  { name: "전복", cuisineAffinity: ["KOREAN", "JAPANESE", "CHINESE"] },
  { name: "트러플", cuisineAffinity: ["WESTERN", "FUSION"] },
  { name: "한우", cuisineAffinity: ["KOREAN", "WESTERN"] },
  { name: "들기름", cuisineAffinity: ["KOREAN"] },
  { name: "랍스터", cuisineAffinity: ["WESTERN", "FUSION"] },
  { name: "두부", cuisineAffinity: ["KOREAN", "JAPANESE", "CHINESE"] },
  { name: "장어", cuisineAffinity: ["KOREAN", "JAPANESE"] },
  { name: "캐비어", cuisineAffinity: ["WESTERN", "FUSION"] },
  { name: "묵은지", cuisineAffinity: ["KOREAN", "FUSION"] },
  { name: "참치", cuisineAffinity: ["JAPANESE", "WESTERN"] },
  { name: "가리비", cuisineAffinity: ["JAPANESE", "WESTERN", "FUSION"] },
  { name: "성게알", cuisineAffinity: ["JAPANESE"] },
  { name: "오골계", cuisineAffinity: ["KOREAN", "CHINESE"] },
  { name: "고사리", cuisineAffinity: ["KOREAN"] },
  { name: "물곰", cuisineAffinity: ["KOREAN", "FUSION"] },
  { name: "홍어", cuisineAffinity: ["KOREAN"] },
  { name: "토마토", cuisineAffinity: ["WESTERN", "MEXICAN", "INDIAN"] },
  { name: "바질", cuisineAffinity: ["WESTERN", "FUSION"] },
  { name: "치즈", cuisineAffinity: ["WESTERN", "MEXICAN", "FUSION"] },
  { name: "쌀국수", cuisineAffinity: ["SOUTHEAST_ASIAN"] },
  { name: "커리", cuisineAffinity: ["INDIAN", "JAPANESE", "SOUTHEAST_ASIAN"] },
  { name: "할라피뇨", cuisineAffinity: ["MEXICAN"] },
  { name: "타히니", cuisineAffinity: ["MIDDLE_EASTERN"] },
  { name: "램고기", cuisineAffinity: ["MIDDLE_EASTERN", "INDIAN"] },
  { name: "망고", cuisineAffinity: ["SOUTHEAST_ASIAN", "DESSERT", "INDIAN"] },
  { name: "팥", cuisineAffinity: ["KOREAN", "JAPANESE", "DESSERT"] },
  { name: "초콜릿", cuisineAffinity: ["DESSERT", "WESTERN"] },
  { name: "마라소스", cuisineAffinity: ["CHINESE"] },
  { name: "코코넛", cuisineAffinity: ["SOUTHEAST_ASIAN", "INDIAN", "DESSERT"] },
  // 추가 재료 20개
  { name: "연어", cuisineAffinity: ["JAPANESE", "WESTERN", "FUSION"] },
  { name: "오리", cuisineAffinity: ["CHINESE", "WESTERN", "KOREAN"] },
  { name: "새우", cuisineAffinity: ["SOUTHEAST_ASIAN", "JAPANESE", "WESTERN"] },
  { name: "문어", cuisineAffinity: ["JAPANESE", "WESTERN", "KOREAN"] },
  { name: "게", cuisineAffinity: ["KOREAN", "JAPANESE", "CHINESE"] },
  { name: "굴", cuisineAffinity: ["KOREAN", "WESTERN", "JAPANESE"] },
  { name: "송이버섯", cuisineAffinity: ["KOREAN", "JAPANESE"] },
  { name: "표고버섯", cuisineAffinity: ["KOREAN", "CHINESE", "JAPANESE"] },
  { name: "아보카도", cuisineAffinity: ["MEXICAN", "WESTERN", "FUSION"] },
  { name: "고추냉이", cuisineAffinity: ["JAPANESE"] },
  { name: "된장", cuisineAffinity: ["KOREAN"] },
  { name: "간장", cuisineAffinity: ["KOREAN", "JAPANESE", "CHINESE"] },
  { name: "사프란", cuisineAffinity: ["INDIAN", "MIDDLE_EASTERN", "WESTERN"] },
  { name: "레몬그라스", cuisineAffinity: ["SOUTHEAST_ASIAN"] },
  { name: "라임", cuisineAffinity: ["MEXICAN", "SOUTHEAST_ASIAN", "FUSION"] },
  { name: "파프리카", cuisineAffinity: ["WESTERN", "MEXICAN"] },
  { name: "딸기", cuisineAffinity: ["DESSERT", "WESTERN"] },
  { name: "앙금", cuisineAffinity: ["KOREAN", "JAPANESE", "DESSERT"] },
  { name: "후무스", cuisineAffinity: ["MIDDLE_EASTERN"] },
  { name: "탄두리", cuisineAffinity: ["INDIAN"] },
];

// 재료 이름만 추출 (하위 호환성)
export const MAIN_INGREDIENT_NAMES = MAIN_INGREDIENTS.map((i) => i.name);

// 요리 이름 접두사/접미사 (다양성 확보)
const ADJECTIVES = [
  "전설의",
  "완벽한",
  "실험적인",
  "묵직한",
  "섬세한",
  "추억의",
  "지옥에서 온",
  "환상의",
  "대담한",
  "절제된",
  "화려한",
  "소박한",
  "반전있는",
  "깊은 풍미의",
  "매혹적인",
  "차가운",
  "뜨거운",
  "부드러운",
  "거친",
  "이국적인",
  "할머니의",
  "미래적인",
  "전통적인",
  "퓨전",
  "야생의",
];

const DISH_TYPES = [
  "스테이크",
  "파스타",
  "리조또",
  "비빔밥",
  "국밥",
  "짬뽕",
  "초밥",
  "튀김",
  "볶음요리",
  "수프",
  "구이",
  "찜",
  "조림",
  "샐러드",
  "타르타르",
  "카르파치오",
  "무침",
  "솥밥",
  "만두",
  "샌드위치",
  "케이크",
  "아이스크림",
  "면요리",
  "전골",
  "감바스",
];

const DESCRIPTIONS = [
  "재료 본연의 맛을 살린 요리입니다.",
  "대담한 향신료 사용이 돋보입니다.",
  "플레이팅이 예술적인 접시입니다.",
  "한 입 먹으면 고향이 생각나는 맛입니다.",
  "식감이 다채롭게 어우러진 요리입니다.",
  "소스의 밸런스가 완벽에 가깝습니다.",
  "익힘 정도가 아주 이븐(Even)해서 놀라운 식감을 줍니다.",
  "재료의 잠재력을 최대한으로 끌어올렸습니다.",
  "창의적인 해석이 돋보이는 퓨전 요리입니다.",
  "기본기에 충실하면서도 깊은 맛을 냅니다.",
  "예상치 못한 맛의 조합이 즐거움을 줍니다.",
  "마치 하나의 예술 작품을 보는 듯합니다.",
  "입안에서 폭죽이 터지는 듯한 강렬한 맛입니다.",
  "은은한 향이 오랫동안 여운을 남깁니다.",
  "텍스처의 대비가 재미있는 요리입니다.",
  "신선한 재료의 맛이 살아있습니다.",
  "정성이 가득 들어간 것이 느껴지는 맛입니다.",
  "투박해 보이지만 섬세한 터치가 느껴집니다.",
  "클래식한 레시피를 현대적으로 재해석했습니다.",
  "재료 하나하나의 맛이 조화롭게 어우러집니다.",
  "불향이 입안 가득 퍼지는 매력적인 요리입니다.",
  "상큼한 산미가 식욕을 돋웁니다.",
  "진한 육수의 풍미가 일품입니다.",
  "바삭한 식감과 부드러운 속살의 조화가 좋습니다.",
  "보는 맛과 먹는 맛을 동시에 잡았습니다.",
];

/**
 * 재료와 쉐프 전문분야 매칭 여부 확인
 * @returns 매칭된 전문분야가 있으면 true
 */
const hasSpecialtyBonus = (chef: Chef, ingredientName: string): boolean => {
  const ingredient = MAIN_INGREDIENTS.find((i) => i.name === ingredientName);
  if (!ingredient) return false;

  // 쉐프의 전문분야 중 하나라도 재료 친화도에 포함되면 보너스
  return chef.specialties.some((specialty) =>
    ingredient.cuisineAffinity.includes(specialty)
  );
};

export const generateDish = (chef: Chef, mainIngredient?: string): Dish => {
  const { proficiency, creativity, taste, mental, speed } = chef.stats;

  // 1. 점수 계산 (랜덤 변수 ±10%)
  // Base Score = Stat * (0.9 ~ 1.1)
  const getScore = (stat: number) =>
    Math.round(stat * (0.9 + Math.random() * 0.2));

  let dishTaste = getScore(taste);
  let dishCreativity = getScore(creativity);
  // 완성도는 숙련도와 멘탈의 영향을 받음
  let dishCompleteness = getScore((proficiency + mental) / 2);

  // 2. 전문분야 보너스 (+10%)
  if (mainIngredient && hasSpecialtyBonus(chef, mainIngredient)) {
    dishTaste = Math.round(dishTaste * 1.1);
    dishCreativity = Math.round(dishCreativity * 1.1);
    dishCompleteness = Math.round(dishCompleteness * 1.1);
  }

  // 3. 특수 변수 영향 (점수에만 영향, 태그에는 영향 X)
  // 멘탈이 낮으면 완성도 하락
  if (mental < 70 && Math.random() < 0.2) {
    dishCompleteness -= 30;
  }

  // 속도가 높으면 완성도 보너스
  if (speed > 85) {
    dishCompleteness += 5;
  }

  // 창의력이 매우 높으면 맛 변동성 증가, 창의성 상승
  if (creativity > 90) {
    dishTaste += Math.random() < 0.5 ? 10 : -10;
    dishCreativity += 10;
  }

  // 점수 범위 보정 (0~100)
  dishTaste = Math.min(100, Math.max(0, dishTaste));
  dishCreativity = Math.min(100, Math.max(0, dishCreativity));
  dishCompleteness = Math.min(100, Math.max(0, dishCompleteness));

  // 4. 태그 생성 (고정 3개, 구간별 긍정적 멘트)
  const tags: string[] = [];

  // Taste Tags
  if (dishTaste >= 90) tags.push("천상의 맛");
  else if (dishTaste >= 80) tags.push("훌륭한 간");
  else tags.push("담백한 여운");

  // Creativity Tags
  if (dishCreativity >= 90) tags.push("충격적인 조화");
  else if (dishCreativity >= 80) tags.push("신선한 해석");
  else tags.push("친숙한 맛");

  // Completeness Tags
  if (dishCompleteness >= 90) tags.push("이븐하게 익음");
  else if (dishCompleteness >= 80) tags.push("완벽한 식감");
  else tags.push("새로운 식감");

  // 5. 이름 및 설명 생성
  // 메인 재료가 있으면 이름에 포함
  const randomAdjective =
    ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const randomDishType =
    DISH_TYPES[Math.floor(Math.random() * DISH_TYPES.length)];

  let name = "";
  if (mainIngredient) {
    if (Math.random() < 0.5) {
      name = `${randomAdjective} ${mainIngredient} ${randomDishType}`;
    } else {
      name = `${mainIngredient} ${randomDishType}`;
    }
  } else {
    name = `${randomAdjective} ${randomDishType}`;
  }

  const description =
    DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];

  return {
    id: `dish-${chef.id}-${Date.now()}`,
    chefId: chef.id,
    name,
    description,
    scores: {
      taste: dishTaste,
      creativity: dishCreativity,
      completeness: dishCompleteness,
    },
    tags,
  };
};
