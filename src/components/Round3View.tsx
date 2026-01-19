import { useState, useEffect, useRef } from "react";
import { useChefStore } from "../store/useChefStore";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/Badge";
import { ChefCard } from "./ChefCard";
import type { Chef } from "../types/chef";
import type { Dish } from "../types/match";
import type { VoteHistory } from "../types/judge";
import { motion, AnimatePresence } from "framer-motion";

import { calculateRevealOrder } from "../utils/round3-logic";

export const Round3View = () => {
  const { currentRound, setRound3Prediction, playRound3Match, chefs } =
    useChefStore();
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isCooking, setIsCooking] = useState(false); // 요리 연출 상태
  const [isWaitingForReveal, setIsWaitingForReveal] = useState(false); // [NEW] 심사 대기 상태
  const prevMatchesLengthRef = useRef(0);

  const round3State = currentRound?.round3State;
  const matches = round3State?.matches || [];

  // Last completed match (to show result)
  const lastMatch = matches.length > 0 ? matches[matches.length - 1] : null;

  const handlePlayMatch = () => {
    // 1. 요리 연출 시작 (4.5초)
    setIsCooking(true);

    setTimeout(() => {
      // 2. 실제 매치 결과 생성 및 store 업데이트
      playRound3Match();
      setRevealedCount(0); // [FIX] Reset dots/score logic immediately
      setIsCooking(false);
      setIsWaitingForReveal(true); // 심사 대기 시작
    }, 4500); // 1.5초 * 3회 = 4.5초
  };

  // Determine display judges (random shuffle per match)
  const rawJudges = lastMatch?.judgesSnapshot || round3State?.judges || [];

  const [shuffledJudges, setShuffledJudges] = useState<any[]>([]);
  const [revealOrder, setRevealOrder] = useState<number[]>([]);

  // Use shuffled judges if available, otherwise raw (but we trigger shuffle on new match)
  const displayJudges = shuffledJudges.length > 0 ? shuffledJudges : rawJudges;

  // Animation & Shuffle Logic Combined
  useEffect(() => {
    // Only trigger if a NEW match has occurred (or first load with matches)
    if (matches.length > prevMatchesLengthRef.current) {
      if (!lastMatch) return;

      const matchIdx = matches.length - 1;
      const totalJudges = lastMatch.judgesSnapshot?.length || 0;

      // 1. Shuffle Judges for Layout
      const currentJudges = [...(lastMatch.judgesSnapshot || [])];

      // Fisher-Yates Shuffle
      for (let i = currentJudges.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentJudges[i], currentJudges[j]] = [
          currentJudges[j],
          currentJudges[i],
        ];
      }
      setShuffledJudges(currentJudges);

      // 2. Calculate Reveal Order using Utility
      // Extract votes from the SHUFFLED judges
      const votes = currentJudges.map((judge) => {
        const history = judge.voteHistory.find(
          (v: VoteHistory) => v.matchIndex === matchIdx,
        );
        return history?.pick;
      });

      const { revealOrder: newRevealOrder, phase1Count } =
        calculateRevealOrder(votes);

      setRevealOrder(newRevealOrder);

      // 4. Start Animation
      setTimeout(() => {
        setIsWaitingForReveal(false);
        setIsRevealing(true);
        setRevealedCount(0);

        let currentStep = 0;

        const phase1Interval = setInterval(() => {
          if (currentStep < phase1Count) {
            currentStep++;
            setRevealedCount(currentStep); // This updates state
          } else {
            clearInterval(phase1Interval);

            // Suspense Pause
            setTimeout(() => {
              setRevealedCount(totalJudges); // Reveal All
              setTimeout(() => setIsRevealing(false), 2000);
            }, 1000);
          }
        }, 100);
      }, 3000);
    }
    prevMatchesLengthRef.current = matches.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches]);

  if (!currentRound || !round3State) return null;

  const { userPrediction, blackTeamScore, whiteTeamScore } = round3State;

  // [NEW] Auto-start Match 1 when prediction is made
  useEffect(() => {
    if (
      userPrediction &&
      matches.length === 0 &&
      !isCooking &&
      !isWaitingForReveal &&
      !isRevealing
    ) {
      handlePlayMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPrediction, matches.length]);

  // [NEW] Auto-advance between matches
  useEffect(() => {
    // Should trigger when reveal finishes (isRevealing goes true -> false)
    if (
      !isRevealing &&
      !isWaitingForReveal &&
      !isCooking &&
      matches.length > 0 &&
      matches.length < 3
    ) {
      const timer = setTimeout(() => {
        handlePlayMatch();
      }, 4000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevealing, isWaitingForReveal, isCooking, matches.length]);

  const currentMatchNum = round3State.currentMatchIndex + 1;
  const isCompleted = currentRound.status === "completed";

  // ... (createTeamChef helper remains) ...
  // Helper to create dummy team chef for display
  const createTeamChef = (
    id: string,
    name: string,
    rank: "BLACK" | "WHITE",
    dish: Dish,
  ): Chef => ({
    id,
    name,
    nickname: name,
    rank,
    image: "",
    cuisine: "FUSION",
    specialties: ["FUSION"],
    status: "alive",
    stats: {
      taste: dish.scores.taste,
      creativity: dish.scores.creativity,
      proficiency: dish.scores.completeness,
      mental: 95,
      speed: 95,
    },
    revealedStats: ["taste", "creativity", "proficiency", "mental", "speed"], // All revealed
    isPlayerPick: false,
  });

  // Grid Layout
  const getGridCols = (count: number) => {
    if (count >= 100) return 25; // 4x25
    if (count >= 20) return 5; // 4x5
    return 10; // 1x10 (일렬)
  };
  const gridCols = getGridCols(displayJudges.length);

  // Live Score Calculation
  let liveBlackScore = blackTeamScore;
  let liveWhiteScore = whiteTeamScore;

  if ((isRevealing || isWaitingForReveal) && lastMatch) {
    // Current match weight
    let weight = 1;
    const matchIdx = matches.length - 1;
    if (matchIdx === 1) weight = 5;
    if (matchIdx === 2) weight = 10;

    // Calculate votes based on strictly what is revealed in THIS animation step
    // revealedCount is number of dots shown.
    // actual indices shown are revealOrder[0...revealedCount-1]

    // Total final scores for this match need to be subtracted first

    // 1. Get current match full results
    let fullBlackVotes = 0;
    let fullWhiteVotes = 0;

    // [FIX] Use lastMatch.judgesSnapshot (accurate recent data) for deduction
    // instead of displayJudges (which might be stale during transition).
    const deductionSource = lastMatch.judgesSnapshot || [];

    deductionSource.forEach((j) => {
      const h = j.voteHistory.find(
        (v: VoteHistory) => v.matchIndex === matchIdx,
      );
      if (h?.pick === "BLACK") fullBlackVotes++;
      if (h?.pick === "WHITE") fullWhiteVotes++;
    });

    const fullBlackMatchScore = fullBlackVotes * weight;
    const fullWhiteMatchScore = fullWhiteVotes * weight;

    // Base score (score before this match)
    const baseBlackScore = blackTeamScore - fullBlackMatchScore;
    const baseWhiteScore = whiteTeamScore - fullWhiteMatchScore;

    // 2. Calculate currently revealed votes
    let currentBlackVotes = 0;
    let currentWhiteVotes = 0;

    // Only count up to revealedCount using revealOrder
    for (let i = 0; i < revealedCount; i++) {
      if (i >= revealOrder.length) break;
      const judgeIndex = revealOrder[i];
      const judge = displayJudges[judgeIndex];
      const h = judge?.voteHistory.find(
        (v: VoteHistory) => v.matchIndex === matchIdx,
      );
      if (h?.pick === "BLACK") currentBlackVotes++;
      if (h?.pick === "WHITE") currentWhiteVotes++;
    }

    liveBlackScore = baseBlackScore + currentBlackVotes * weight;
    liveWhiteScore = baseWhiteScore + currentWhiteVotes * weight;
  }

  // View: Prediction
  if (!userPrediction) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] gap-8">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-lg px-4 py-1 mb-4">
            ROUND 3
          </Badge>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">
            흑백 팀전: 재료의 방
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            100인의 평가단이 당신의 요리를 심사합니다.
            <br />
            승리할 팀을 예측해보세요!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
          <Card
            className="p-8 border-spoon-black-accent/30 bg-black/40 hover:bg-black/60 cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center gap-4 group"
            onClick={() => setRound3Prediction("BLACK")}
          >
            <div className="w-24 h-24 rounded-full bg-spoon-black/20 flex items-center justify-center group-hover:bg-spoon-black/40 transition-colors">
              <span className="text-4xl">🌑</span>
            </div>
            <h3 className="text-2xl font-bold text-spoon-black-text">
              흑수저 팀
            </h3>
            <p className="text-sm text-gray-500">패기와 열정의 조화</p>
          </Card>

          <Card
            className="p-8 border-spoon-white-accent/30 bg-white/5 hover:bg-white/10 cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center gap-4 group"
            onClick={() => setRound3Prediction("WHITE")}
          >
            <div className="w-24 h-24 rounded-full bg-spoon-white/20 flex items-center justify-center group-hover:bg-spoon-white/40 transition-colors">
              <span className="text-4xl">⚪</span>
            </div>
            <h3 className="text-2xl font-bold text-spoon-white-text">
              백수저 팀
            </h3>
            <p className="text-sm text-gray-500">연륜과 기술의 정점</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm sticky top-[72px] z-40">
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="w-fit">
            ROUND 3
          </Badge>
          <span className="text-lg font-bold text-gray-300">
            {isCompleted
              ? "FINAL RESULT"
              : matches.length === 0
                ? "MATCH 1 PREPARATION"
                : `MATCH ${matches.length} RESULT / MATCH ${currentMatchNum} READY`}
          </span>
        </div>
        <div className="flex gap-8 text-2xl font-bold items-center">
          <motion.div
            className="text-spoon-black-text flex flex-col items-end"
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            <span className="text-sm opacity-50">흑수저 팀</span>
            <span className="tabular-nums">
              {isCooking ? "?" : liveBlackScore}점
            </span>
            <div className="flex items-center gap-1 mt-1 bg-black/40 px-2 py-0.5 rounded text-xs text-gray-400 font-normal">
              <span>👤</span>
              <span>
                {
                  chefs.filter(
                    (c) => c.rank === "BLACK" && c.status === "alive",
                  ).length
                }
                명 생존
              </span>
            </div>
          </motion.div>
          <span className="text-gray-600 text-lg">vs</span>
          <motion.div
            className="text-gray-100 flex flex-col items-start"
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            <span className="text-sm opacity-50">백수저 팀</span>
            <span className="tabular-nums">
              {isCooking ? "?" : liveWhiteScore}점
            </span>
            <div className="flex items-center gap-1 mt-1 bg-black/40 px-2 py-0.5 rounded text-xs text-gray-400 font-normal">
              <span>👤</span>
              <span>
                {
                  chefs.filter(
                    (c) => c.rank === "WHITE" && c.status === "alive",
                  ).length
                }
                명 생존
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Battle Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-4 items-start">
        {/* Black Dish */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold text-spoon-black-accent text-center flex items-center justify-center gap-2">
            <span>흑수저 팀의 요리</span>
            {lastMatch && (
              <Badge variant="secondary" className="text-xs">
                {lastMatch.mainIngredient}
              </Badge>
            )}
          </h3>
          {lastMatch?.blackDish ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DishCard dish={lastMatch.blackDish} size="md" />
              <ChefCard
                chef={createTeamChef(
                  "team-black",
                  "흑수저 팀",
                  "BLACK",
                  lastMatch.blackDish,
                )}
                layout="horizontal"
                isFlipped={true}
              />
            </div>
          ) : (
            <CookingStateDisplay team="black" isActive={isCooking} />
          )}
        </div>

        {/* White Dish */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold text-spoon-white-accent text-center flex items-center justify-center gap-2">
            <span>백수저 팀의 요리</span>
            {lastMatch && (
              <Badge variant="secondary" className="text-xs">
                {lastMatch.mainIngredient}
              </Badge>
            )}
          </h3>
          {lastMatch?.whiteDish ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              <DishCard dish={lastMatch.whiteDish} size="md" />
              <ChefCard
                chef={createTeamChef(
                  "team-white",
                  "백수저 팀",
                  "WHITE",
                  lastMatch.whiteDish,
                )}
                layout="horizontal"
                isFlipped={true}
              />
            </div>
          ) : (
            <CookingStateDisplay team="white" isActive={isCooking} />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center my-8">
        {!isCompleted && !isRevealing && !isCooking && !isWaitingForReveal ? (
          <div className="flex flex-col items-center gap-2 animate-pulse">
            {/* Manual Start Button Removed for Auto-Advance */}
            <p className="text-xl font-bold text-gray-300">
              {matches.length === 0
                ? "잠시 후 1차전이 시작됩니다..."
                : matches.length === 1
                  ? "잠시 후 2차전이 시작됩니다..."
                  : "잠시 후 3차전이 시작됩니다..."}
            </p>
          </div>
        ) : isRevealing || isWaitingForReveal ? (
          <div className="text-center p-4">
            <h3 className="text-2xl font-bold text-gray-300 animate-pulse">
              {isWaitingForReveal
                ? "심사위원단 입장..."
                : "심사 결과 집계 중..."}
            </h3>
          </div>
        ) : isCooking ? (
          <div className="text-center p-4">
            <h3 className="text-2xl font-bold text-gray-300 animate-pulse">
              요리 대결 진행 중...
            </h3>
          </div>
        ) : (
          <div className="text-center p-8 bg-gradient-to-b from-transparent to-purple-900/20 rounded-2xl border border-purple-500/30 w-full max-w-2xl animate-in zoom-in duration-500">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              {blackTeamScore >= whiteTeamScore
                ? "🏆 흑수저 팀 최종 승리!"
                : "🏆 백수저 팀 최종 승리!"}
            </h2>
            <div className="text-2xl font-bold mb-6 flex justify-center gap-8">
              <span className="text-spoon-black-text">
                흑: {blackTeamScore}
              </span>
              <span className="text-spoon-white-text">
                백: {whiteTeamScore}
              </span>
            </div>
            <p className="text-gray-300 text-lg bg-black/40 p-4 rounded-lg inline-block">
              {userPrediction ===
              (blackTeamScore >= whiteTeamScore ? "BLACK" : "WHITE")
                ? "🎉 축하합니다! 예측에 성공하셨습니다."
                : "😅 아쉽네요. 예측이 빗나갔습니다."}
            </p>
          </div>
        )}
      </div>

      {/* Grid */}
      <AnimatePresence>
        {!isCooking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-black/40 border-white/10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h4 className="text-gray-300 font-bold text-lg">
                    {isRevealing
                      ? "실시간 투표 현황"
                      : matches.length > 0
                        ? "심사 결과"
                        : "심사위원단"}
                  </h4>
                  <span className="text-xs text-gray-500">
                    총 {displayJudges.length}명
                  </span>
                </div>
                <div className="flex gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-spoon-black-accent"></div>
                    <span>흑수저 투표</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-spoon-white-accent"></div>
                    <span>백수저 투표</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                    <span>비공개</span>
                  </div>
                </div>
              </div>
              <div
                className="grid gap-2 place-items-center"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                }}
              >
                <AnimatePresence>
                  {displayJudges.map((judge, i) => {
                    const matchIndex = matches.length - 1;
                    // If matches.length=0, displayJudges is 100 fresh judges (no history relevant to *Round 3* yet, or irrelevant).
                    // In that case, show Gray.

                    let vote: "BLACK" | "WHITE" | undefined = undefined;

                    if (matchIndex >= 0) {
                      const history = judge.voteHistory.find(
                        (v: VoteHistory) => v.matchIndex === matchIndex,
                      );
                      vote = history?.pick;
                    }

                    // Reveal Logic check:
                    // Only reveal if the current index 'i' is inside the 'revealed' subset of 'revealOrder'
                    // revealedCount -> how many items in revealOrder are shown.
                    // The items shown are revealOrder[0...revealedCount-1].
                    const isRevealedInOrder = revealOrder
                      .slice(0, revealedCount)
                      .includes(i);
                    const isConfirmed = isRevealing ? isRevealedInOrder : true; // If not animating, show all (except waiting state)

                    // If waiting for reveal, hide ALL
                    if (isWaitingForReveal && !isRevealing) {
                      // Keep everything hidden
                      return (
                        <JudgeDot key={judge.id} vote={vote} isHidden={true} />
                      );
                    }

                    // If matchIndex < 0 (Match 0 prep), force hidden/neutral
                    const forceHidden = matchIndex < 0;
                    const isHidden = forceHidden || !isConfirmed;

                    return (
                      <JudgeDot
                        key={judge.id}
                        vote={vote}
                        isHidden={isHidden}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
const DishCard = ({
  dish,
  size = "md",
}: {
  dish: Dish;
  size?: "md" | "lg";
}) => {
  return (
    <div
      className={`w-full flex flex-col gap-3 relative z-10 ${size === "lg" ? "items-center text-center" : ""}`}
    >
      <h3
        className={`${size === "lg" ? "text-3xl" : "text-lg"} font-bold text-amber-500 drop-shadow-sm`}
      >
        {dish.name}
      </h3>
      <p className={`${size === "lg" ? "text-lg" : "text-sm"} text-gray-300`}>
        {dish.description}
      </p>
      <div
        className={`flex flex-wrap gap-2 mt-2 ${size === "lg" ? "justify-center" : ""}`}
      >
        {dish.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300 border border-gray-600"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};

const JudgeDot = ({
  vote,
  isHidden,
}: {
  vote?: "BLACK" | "WHITE";
  isHidden: boolean;
}) => {
  return (
    <motion.div
      title={isHidden ? "?" : vote}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotateY: isHidden ? 0 : 180, // Flip effect
        backgroundColor: isHidden
          ? "#374151"
          : vote === "BLACK"
            ? "#1a1a1a"
            : "#e5e7eb",
        color: isHidden ? "#9ca3af" : "transparent", // Text color for "?"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full cursor-help relative flex items-center justify-center text-[10px] font-bold`}
    >
      {isHidden && "?"}
    </motion.div>
  );
};

// 요리 상태 정의 (픽셀아트 이미지 사용)
// 요리 상태 정의 (픽셀아트 이미지 사용)
const COOKING_STATES = [
  {
    image: `${import.meta.env.BASE_URL}assets/cooking/chopping.png`,
    text: "재료 손질 중...",
    animationType: "chopping",
  },
  {
    image: `${import.meta.env.BASE_URL}assets/cooking/stir_fry.png`,
    text: "센 불에 볶는 중...",
    animationType: "stir_fry",
  },
  {
    image: `${import.meta.env.BASE_URL}assets/cooking/grilling.png`,
    text: "정성껏 굽는 중...",
    animationType: "grilling",
  },
  {
    image: `${import.meta.env.BASE_URL}assets/cooking/simmering.png`,
    text: "육수 우려내는 중...",
    animationType: "simmering",
  },
  {
    image: `${import.meta.env.BASE_URL}assets/cooking/plating.png`,
    text: "플레이팅 마무리...",
    animationType: "plating",
  },
];

// Use explicit typing to avoid union type issues with optional 'initial'
const cookingVariants: Record<string, { initial?: any; animate: any }> = {
  chopping: {
    initial: { scale: 1 },
    animate: {
      y: [0, -8, 0], // 상하 8%
      scale: 1,
      transition: {
        duration: 0.15,
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  },
  stir_fry: {
    initial: { scale: 1 },
    animate: {
      x: [-4, 0, 4], // Left to Right
      y: [0, 2, 0], // Down in middle (U-shape)
      rotate: [-5, 0, 5],
      scale: 1,
      transition: {
        duration: 0.5, // Slower
        repeat: Infinity,
        repeatType: "mirror",
      },
    },
  },
  grilling: {
    animate: {
      x: [-1, 1, -1],
      y: [-1, 1, -1],
      scale: [1, 1.02, 1],
      transition: {
        duration: 0.1,
        repeat: Infinity,
      },
    },
  },
  simmering: {
    animate: {
      y: [-2, 2, -2],
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  plating: {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
  },
};

const CookingStateDisplay = ({
  team,
  isActive,
}: {
  team: "black" | "white";
  isActive: boolean;
}) => {
  const [stateIndex, setStateIndex] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    // 랜덤 시작점
    setStateIndex(Math.floor(Math.random() * COOKING_STATES.length));

    // 1.5초마다 상태 변경
    const interval = setInterval(() => {
      setStateIndex((prev) => {
        // 랜덤하게 다음 상태 선택 (현재와 다른 상태)
        let next = Math.floor(Math.random() * COOKING_STATES.length);
        while (next === prev) {
          next = Math.floor(Math.random() * COOKING_STATES.length);
        }
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isActive]);

  const currentState = COOKING_STATES[stateIndex];
  // [FIX] Background is always white to match asset background
  const bgClass = "bg-white";
  const animationType = currentState.animationType;

  return (
    <div
      className={`aspect-[4/3] ${bgClass} rounded-xl border border-gray-200 flex flex-col items-center justify-center text-gray-800 gap-4 overflow-hidden relative`}
    >
      {/* 배경 효과 */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            "radial-gradient(circle at 30% 40%, rgba(255,165,0,0.3) 0%, transparent 50%)",
            "radial-gradient(circle at 70% 60%, rgba(255,100,0,0.3) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 50%, rgba(255,165,0,0.3) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative">
        <motion.img
          src={currentState.image}
          alt={currentState.text}
          className="w-24 h-24 object-contain pixelated"
          style={{ imageRendering: "pixelated" }}
          initial={cookingVariants[animationType]?.initial || { scale: 0 }}
          animate={cookingVariants[animationType]?.animate || { scale: 1 }}
        />
      </div>

      {/* 텍스트 애니메이션 */}
      <AnimatePresence mode="wait">
        <motion.span
          key={stateIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-medium"
        >
          {currentState.text}
        </motion.span>
      </AnimatePresence>

      {/* 진행 바 (4.5초 동안 채워짐) */}
      {isActive && (
        <motion.div className="absolute bottom-4 left-4 right-4 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4.5, ease: "linear" }}
          />
        </motion.div>
      )}
    </div>
  );
};
