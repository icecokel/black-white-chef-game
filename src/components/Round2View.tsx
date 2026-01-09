import { useState, useEffect } from "react";
import { useChefStore } from "../store/useChefStore";
import { Button } from "./ui/button";
import { ChefCard } from "./ChefCard";
import type { Dish, Match } from "../types/match";
import { Round2MatchList } from "./Round2MatchList";
import { Round2Summary } from "./Round2Summary";

export const Round2View = () => {
  const { currentRound, startRound2, playNextRound2Highlight } = useChefStore();

  // 라운드 진입 시 자동 시작
  useEffect(() => {
    if (
      currentRound?.roundNumber === 1 &&
      currentRound.status === "completed"
    ) {
      startRound2();
    }
  }, [currentRound, startRound2]);

  if (!currentRound || currentRound.roundNumber !== 2) {
    return (
      <div className="text-white text-center p-10">라운드 2 준비 중...</div>
    );
  }

  // 1. Picking Phase
  if (currentRound.round2State?.phase === "picking") {
    return <Round2MatchList />;
  }

  // 2. Summary Phase
  if (currentRound.round2State?.phase === "summary") {
    return <Round2Summary />;
  }

  // 3. Revealing Phase (Highlight Matches)
  if (
    (currentRound.round2State?.phase === "revealing_user" ||
      currentRound.round2State?.phase === "revealing_random") &&
    currentRound.matches
  ) {
    const { highlightMatches, currentRevealIndex, userPicks } =
      currentRound.round2State;
    const matchId = highlightMatches[currentRevealIndex];
    const match = currentRound.matches.find((m) => m.id === matchId);

    if (!match) return <div>매치 정보 오류</div>;

    const isUserPickMatch =
      userPicks.includes(match.blackChefId) ||
      userPicks.includes(match.whiteChefId);

    // 유저가 예측한 진영 ("BLACK" | "WHITE" | null) -- 이 화면에서는 이미 결정됨
    // 여기서는 유저 픽이 누구였는지 보여주는 용도
    const myPickSide = userPicks.includes(match.blackChefId)
      ? "BLACK"
      : userPicks.includes(match.whiteChefId)
      ? "WHITE"
      : null;

    return (
      <Round2MatchDetail
        match={match}
        matchIndex={currentRevealIndex}
        totalMatches={highlightMatches.length}
        onNext={playNextRound2Highlight}
        myPickSide={myPickSide}
        isUserPickMatch={isUserPickMatch}
      />
    );
  }

  return <div>라운드 상태 오류</div>;
};

// -- Internal Component: Match Detail --
const Round2MatchDetail = ({
  match,
  matchIndex,
  totalMatches,
  onNext,
  myPickSide,
  isUserPickMatch,
}: {
  match: Match;
  matchIndex: number;
  totalMatches: number;
  onNext: () => void;
  myPickSide: "BLACK" | "WHITE" | null;
  isUserPickMatch: boolean;
}) => {
  const { chefs, judgeMatch } = useChefStore();
  const [showResult, setShowResult] = useState(false);

  // 자동 재생 연출 (심사 대기 -> 결과 공개)
  useEffect(() => {
    setShowResult(false);
    const timer = setTimeout(() => {
      setShowResult(true);
      // 이미 결과는 store level에서 judgeMatch로 생성되어 있음
    }, 2000); // 2초 두근두근

    return () => clearTimeout(timer);
  }, [match.id]);

  const blackChef = chefs.find((c) => c.id === match.blackChefId);
  const whiteChef = chefs.find((c) => c.id === match.whiteChefId);

  const getVoteComment = (type: "P" | "A") => {
    const vote = match.votes.find((v) => v.judge === type);
    if (!vote) return "...";
    return `"${vote.comment}"`;
  };

  const getVoteResult = (type: "P" | "A") => {
    const vote = match.votes.find((v) => v.judge === type);
    if (!vote) return null;
    return vote.pick === match.blackChefId ? "BLACK" : "WHITE";
  };

  const isWin =
    (myPickSide === "BLACK" && match.winnerId === match.blackChefId) ||
    (myPickSide === "WHITE" && match.winnerId === match.whiteChefId);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] p-6 gap-6 relative">
      {/* Top Status */}
      <div className="flex justify-between items-center text-white p-4 bg-gray-900/50 rounded-xl">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Round 2: 하이라이트 매치</h2>
          {isUserPickMatch && (
            <span className="bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded animate-pulse">
              MY PICK MATCH
            </span>
          )}
        </div>
        <div className="text-lg font-mono">
          PLAYING {matchIndex + 1} / {totalMatches}
        </div>
      </div>

      {/* Main Match Area */}
      <div className="flex-1 flex gap-8 items-stretch justify-center">
        {/* Black Side */}
        <div className="flex-1 flex flex-col gap-6 items-center">
          <div
            className={`flex-1 w-full max-w-md bg-gray-800/60 rounded-xl border-2 p-6 flex items-center justify-center relative overflow-hidden transition-all duration-500
              ${
                myPickSide === "BLACK"
                  ? "border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                  : "border-gray-700/50"
              }
              ${
                showResult && match.loserId === match.blackChefId
                  ? "opacity-50 grayscale"
                  : "opacity-100"
              }
            `}
          >
            {match.blackDish && <DishCard dish={match.blackDish} size="lg" />}
            <div className="absolute top-4 left-4">
              <span className="bg-black/80 text-white px-3 py-1 rounded-full text-sm font-bold border border-gray-600">
                BLACK
              </span>
            </div>
            {myPickSide === "BLACK" && (
              <div className="absolute top-4 right-4 z-20 bg-amber-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                MY PICK
              </div>
            )}
            {/* 승리 뱃지 */}
            {showResult && match.winnerId === match.blackChefId && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <div className="bg-green-500 text-white text-4xl font-black px-8 py-4 rounded-xl border-4 border-white shadow-2xl animate-bounce-custom transform rotate-12">
                  WINNER!
                </div>
              </div>
            )}
          </div>
          {blackChef && (
            <div className="w-full max-w-sm">
              <ChefCard
                chef={blackChef}
                isFlipped={true}
                layout="horizontal"
                maskStats={true}
              />
            </div>
          )}
        </div>

        {/* Center / Result Area */}
        <div className="w-96 flex flex-col gap-4 items-center justify-center z-10">
          {/* Main Ingredient */}
          <div className="flex flex-col items-center mb-4">
            <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-8 py-2 rounded-full text-xl font-bold shadow-lg border border-amber-400/50">
              {match.mainIngredient}
            </div>
          </div>

          {!showResult ? (
            <div className="flex flex-col items-center justify-center py-10 animate-pulse">
              <div className="text-8xl font-black italic text-red-600 drop-shadow-lg mb-8">
                VS
              </div>
              <p className="text-amber-400 font-bold text-lg">
                심사 위원 맛 평가 중...
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4 bg-black/60 p-6 rounded-lg border border-gray-700 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
              {/* Judge P */}
              <div className="flex justify-between items-center rounded bg-black/40 p-3 border border-gray-800">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    Judge. Paik
                  </span>
                  <div
                    className={`text-lg font-bold ${
                      getVoteResult("P") === "BLACK"
                        ? "text-gray-300"
                        : "text-white"
                    }`}
                  >
                    {getVoteResult("P") === "BLACK"
                      ? "⚫️ 흑수저"
                      : "⚪️ 백수저"}
                  </div>
                </div>
                <div className="text-xs text-gray-400 italic max-w-[140px] text-right border-l border-gray-600 pl-3">
                  {getVoteComment("P")}
                </div>
              </div>

              {/* Judge A */}
              <div className="flex justify-between items-center rounded bg-black/40 p-3 border border-gray-800">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    Judge. Ahn
                  </span>
                  <div
                    className={`text-lg font-bold ${
                      getVoteResult("A") === "BLACK"
                        ? "text-gray-300"
                        : "text-white"
                    }`}
                  >
                    {getVoteResult("A") === "BLACK"
                      ? "⚫️ 흑수저"
                      : "⚪️ 백수저"}
                  </div>
                </div>
                <div className="text-xs text-gray-400 italic max-w-[140px] text-right border-l border-gray-600 pl-3">
                  {getVoteComment("A")}
                </div>
              </div>

              {/* Final Score */}
              <div
                className={`text-center px-4 py-3 rounded-lg border shadow-lg mt-2 ${
                  match.isTie
                    ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                    : "bg-green-500/10 text-green-500 border-green-500/30"
                }`}
              >
                <div className="text-3xl font-black mb-1">
                  {match.isTie ? "1 : 1" : "2 : 0"}
                </div>
                <div className="text-sm font-bold text-white">
                  {match.isTie ? "무승부 (랜덤 판정)" : "완승!"}
                </div>
              </div>

              {myPickSide && (
                <div
                  className={`text-center font-bold text-sm animate-pulse ${
                    isWin ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isWin
                    ? "✨ 예측 성공! 안목이 대단하시네요."
                    : "😓 아쉽게도 예측이 빗나갔습니다."}
                </div>
              )}

              <Button
                size="lg"
                className="w-full mt-2 bg-white text-black hover:bg-gray-200 font-bold py-4 text-lg"
                onClick={onNext}
              >
                다음 ➡️
              </Button>
            </div>
          )}
        </div>

        {/* White Side */}
        <div className="flex-1 flex flex-col gap-6 items-center">
          <div
            className={`flex-1 w-full max-w-md bg-gray-800/60 rounded-xl border-2 p-6 flex items-center justify-center relative overflow-hidden transition-all duration-500
                ${
                  myPickSide === "WHITE"
                    ? "border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                    : "border-gray-700/50"
                }
                ${
                  showResult && match.loserId === match.whiteChefId
                    ? "opacity-50 grayscale"
                    : "opacity-100"
                }
              `}
          >
            {match.whiteDish && <DishCard dish={match.whiteDish} size="lg" />}
            <div className="absolute top-4 right-4">
              <span className="bg-white/90 text-black px-3 py-1 rounded-full text-sm font-bold border border-gray-400">
                WHITE
              </span>
            </div>
            {myPickSide === "WHITE" && (
              <div className="absolute top-4 left-4 z-20 bg-amber-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                MY PICK
              </div>
            )}
            {/* 승리 뱃지 */}
            {showResult && match.winnerId === match.whiteChefId && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <div className="bg-green-500 text-white text-4xl font-black px-8 py-4 rounded-xl border-4 border-white shadow-2xl animate-bounce-custom transform -rotate-12">
                  WINNER!
                </div>
              </div>
            )}
          </div>
          {whiteChef && (
            <div className="w-full max-w-sm">
              <ChefCard chef={whiteChef} isFlipped={true} layout="horizontal" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DishCard = ({
  dish,
  size = "md",
}: {
  dish: Dish;
  size?: "md" | "lg";
}) => {
  return (
    <div
      className={`w-full flex flex-col gap-3 relative z-10 ${
        size === "lg" ? "items-center text-center" : ""
      }`}
    >
      <h3
        className={`${
          size === "lg" ? "text-3xl" : "text-lg"
        } font-bold text-amber-500 drop-shadow-sm`}
      >
        {dish.name}
      </h3>
      <p className={`${size === "lg" ? "text-lg" : "text-sm"} text-gray-300`}>
        {dish.description}
      </p>
      <div
        className={`flex flex-wrap gap-2 mt-2 ${
          size === "lg" ? "justify-center" : ""
        }`}
      >
        {dish.tags.map((tag) => (
          <span
            key={tag}
            className={`px-2 py-1 bg-gray-700 text-xs rounded text-gray-300 border border-gray-600`}
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};
