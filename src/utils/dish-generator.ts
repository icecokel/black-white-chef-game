import type { Chef } from "../types/chef";
import type { Dish } from "../types/match";

// 요리 이름 접두사/접미사 (간단한 랜덤 생성용)
// 메인 재료 리스트 (10개 매치용 + 여유분)
export const MAIN_INGREDIENTS = [
  "흑돼지",
  "전복",
  "트러플",
  "한우",
  "들기름",
  "랍스터",
  "두부",
  "장어",
  "캐비어",
  "묵은지",
  "참치",
  "가리비",
  "성게알",
  "오골계",
  "고사리",
  "물곰",
  "홍어",
  "토마토",
  "바질",
  "치즈",
];

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

  // 2. 특수 변수 영향 (점수에만 영향, 태그에는 영향 X)
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

  // 3. 태그 생성 (고정 3개, 구간별 긍정적 멘트)
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

  // 4. 이름 및 설명 생성
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
