export const NICKNAME_PREFIXES = [
  "전설의",
  "지옥에서 온",
  "돌아온",
  "미친",
  "천재",
  "괴물",
  "방랑",
  "고독한",
  "새벽의",
  "밤의",
  "숨겨진",
  "재야의",
  "반전",
  "절대 미각",
  "칼잡이",
  "불꽃",
  "얼음",
  "그림자",
  "마지막",
  "최후의",
  "낭만",
  "감성",
  "야생",
  "집밥",
  "편의점",
  "배달",
  "급식",
  "반찬",
  "야식",
  "안주",
  "해장",
  "비건",
  "육식",
];

export const NICKNAME_MIDDLES = [
  "요리",
  "주방",
  "식칼",
  "국자",
  "냄비",
  "프라이팬",
  "화구",
  "레시피",
  "소스",
  "양념",
  "육수",
  "면발",
  "밥알",
  "불판",
  "도마",
  "앞치마",
  "냉장고",
  "오븐",
  "설거지",
  "서빙",
  "배달",
  "포장",
  "먹방",
  "미식",
  "대식",
  "소식",
  "채식",
  "육식",
  "한식",
  "중식",
  "일식",
  "양식",
];

export const NICKNAME_SUFFIXES = [
  "마스터",
  "장인",
  "고수",
  "달인",
  "선생",
  "박사",
  "교수",
  "대왕",
  "황제",
  "여왕",
  "여신",
  "남신",
  "요정",
  "천사",
  "악마",
  "귀신",
  "괴물",
  "로봇",
  "마법사",
  "연금술사",
  "예술가",
  "디자이너",
  "건축가",
  "해결사",
  "승부사",
  "전략가",
  "개척자",
  "선구자",
  "지배자",
  "파괴자",
  "구원자",
  "수호자",
];

export const WHITE_SPOON_REAL_NAMES = [
  "최현석",
  "에드워드 리",
  "정지선",
  "여경래",
  "이연복",
  "오세득",
  "박준우",
  "김풍",
  "샘 킴",
  "레이먼 킴",
  "미카엘",
  "강레오",
  "노희영",
  "백종원",
  "안성재",
  "고든 램지",
  "제이미 올리버",
  "피에르 가니에르",
  "알랭 뒤카스",
  "토마스 켈러",
];

// 한국 성씨
const LAST_NAMES = [
  "김",
  "이",
  "박",
  "최",
  "정",
  "강",
  "조",
  "윤",
  "장",
  "임",
  "한",
  "오",
  "서",
  "신",
  "권",
  "황",
  "안",
  "송",
  "류",
  "전",
  "홍",
  "고",
  "문",
  "양",
  "손",
  "배",
  "백",
  "허",
  "유",
  "남",
];

// 한국 이름 (1~2글자)
const FIRST_NAMES = [
  "민준",
  "서연",
  "도윤",
  "서현",
  "시우",
  "하윤",
  "주원",
  "하은",
  "지호",
  "윤서",
  "준서",
  "민서",
  "예준",
  "지민",
  "서준",
  "서윤",
  "지우",
  "수빈",
  "지원",
  "다은",
  "현우",
  "예진",
  "우진",
  "소율",
  "승현",
  "가은",
  "태민",
  "나은",
  "정우",
  "채원",
  "지훈",
  "수아",
  "준혁",
  "유진",
  "동현",
  "서아",
  "성민",
  "예은",
  "재현",
  "소민",
  "민재",
  "지아",
  "현준",
  "은서",
  "승우",
  "초아",
  "시현",
  "연우",
];

/**
 * 한국 실명 스타일로 랜덤 생성합니다.
 */
export const generateRealName = (): string => {
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  return `${lastName}${firstName}`;
};

export const generateCombinatorialName = (): string => {
  const prefix =
    NICKNAME_PREFIXES[Math.floor(Math.random() * NICKNAME_PREFIXES.length)];
  const middle =
    NICKNAME_MIDDLES[Math.floor(Math.random() * NICKNAME_MIDDLES.length)];
  const suffix =
    NICKNAME_SUFFIXES[Math.floor(Math.random() * NICKNAME_SUFFIXES.length)];

  // 30% chance to omit middle part for variety
  if (Math.random() < 0.3) {
    return `${prefix} ${suffix}`;
  }

  return `${prefix} ${middle} ${suffix}`;
};

export const generateWhiteSpoonName = (): string => {
  const index = Math.floor(Math.random() * WHITE_SPOON_REAL_NAMES.length);
  return WHITE_SPOON_REAL_NAMES[index];
};
