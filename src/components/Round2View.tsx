import { useState, useEffect } from "react";
import { useChefStore } from "../store/useChefStore";
import { Button } from "./ui/button";
import { ChefCard } from "./ChefCard";
import type { Dish } from "../types/match";

export const Round2View = () => {
  const { currentRound, chefs, startRound2, judgeMatch, startRound3 } =
    useChefStore();
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [userPrediction, setUserPrediction] = useState<
    "BLACK" | "WHITE" | null
  >(null);

  // 라운드 진입 시 자동 시작
  useEffect(() => {
    if (
      currentRound?.roundNumber === 1 &&
      currentRound.status === "completed"
    ) {
      startRound2();
    }
  }, [currentRound, startRound2]);

  if (
    !currentRound ||
    currentRound.roundNumber !== 2 ||
    !currentRound.matches
  ) {
    return (
      <div className="text-white text-center p-10">라운드 2 준비 중...</div>
    );
  }

  if (currentRound.status === "completed") {
    return (
      <div className="flex flex-col items-center gap-6 p-8 h-[calc(100vh-100px)] overflow-y-auto">
        <h2 className="text-3xl font-bold">Round 2 완료!</h2>

        <Button
          size="lg"
          onClick={() => startRound3()}
          className="bg-white text-black hover:bg-gray-200 font-bold text-lg px-8 py-6 animate-pulse"
        >
          ⚔️ 3라운드 시작하기
        </Button>

        <div className="flex gap-8 text-center bg-gray-900/50 p-6 rounded-xl border border-gray-800">
          <div>
            <p className="text-4xl font-bold text-spoon-black-accent">
              {
                chefs.filter((c) => c.rank === "BLACK" && c.status === "alive")
                  .length
              }
            </p>
            <p className="text-muted-foreground">흑수저 생존</p>
          </div>
          <div className="text-4xl font-thin opacity-30">|</div>
          <div>
            <p className="text-4xl font-bold text-spoon-white-accent">
              {
                chefs.filter((c) => c.rank === "WHITE" && c.status === "alive")
                  .length
              }
            </p>
            <p className="text-muted-foreground">백수저 생존</p>
          </div>
        </div>

        <div className="mt-4 w-full max-w-6xl">
          <h3 className="text-xl font-bold mb-4 text-center">생존자 명단</h3>
          <div className="grid grid-cols-5 gap-4">
            {chefs
              .filter((c) => c.status === "alive")
              .map((chef) => (
                <div key={chef.id} className="scale-90">
                  <ChefCard chef={chef} isFlipped={true} />
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  const matcheCount = currentRound.matches.length;
  const match = currentRound.matches[currentMatchIndex];

  const blackChef = chefs.find((c) => c.id === match.blackChefId);
  const whiteChef = chefs.find((c) => c.id === match.whiteChefId);

  const handlePrediction = (prediction: "BLACK" | "WHITE") => {
    if (userPrediction) return; // 이미 선택함
    setUserPrediction(prediction);

    // 심사 시작
    setTimeout(() => {
      judgeMatch(match.id);
      setShowResult(true);
    }, 600);
  };

  const handleNextMatch = () => {
    if (currentMatchIndex < matcheCount - 1) {
      setCurrentMatchIndex((prev) => prev + 1);
      setShowResult(false);
      setUserPrediction(null);
    }
  };

  const getVoteComment = (type: "P" | "A") => {
    const vote = match.votes.find((v) => v.judge === type);
    if (!vote) return "심사 중...";
    return `"${vote.comment}"`;
  };

  const getVoteResult = (type: "P" | "A") => {
    const vote = match.votes.find((v) => v.judge === type);
    if (!vote) return null;
    return vote.pick === match.blackChefId ? "BLACK" : "WHITE";
  };

  const isPredictionCorrect =
    match.winnerId &&
    ((userPrediction === "BLACK" && match.winnerId === match.blackChefId) ||
      (userPrediction === "WHITE" && match.winnerId === match.whiteChefId));

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] p-6 gap-6 relative">
      {/* Top Status */}
      <div className="flex justify-between items-center text-white p-4 bg-gray-900/50 rounded-xl">
        <h2 className="text-xl font-bold">Round 2: 1vs1 흑백 대전</h2>
        <div className="text-lg font-mono">
          MATCH {currentMatchIndex + 1} / {matcheCount}
        </div>
      </div>

      {/* Main Match Area */}
      <div className="flex-1 flex gap-8 items-stretch justify-center">
        {/* Black Chef Side */}
        <div className="flex-1 flex flex-col gap-6 items-center">
          {/* Dish Area (Prominent) */}
          <div
            className={`flex-1 w-full max-w-md bg-gray-800/60 rounded-xl border-2 p-6 flex items-center justify-center relative overflow-hidden group transition-all duration-300 cursor-pointer
              ${
                userPrediction === "BLACK"
                  ? "border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                  : "border-gray-700/50 hover:border-gray-500"
              }
              ${
                userPrediction && userPrediction !== "BLACK"
                  ? "opacity-50 grayscale"
                  : ""
              }
            `}
            onClick={() => !userPrediction && handlePrediction("BLACK")}
          >
            {/* Hover Effect Helper */}
            {!userPrediction && (
              <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 font-bold text-2xl text-amber-500">
                승리 예측하기
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent transition-all" />

            {match.blackDish && <DishCard dish={match.blackDish} size="lg" />}
            <div className="absolute top-4 left-4">
              <span className="bg-black/80 text-white px-3 py-1 rounded-full text-sm font-bold border border-gray-600">
                BLACK DISH
              </span>
            </div>
            {userPrediction === "BLACK" && (
              <div className="absolute top-4 right-4 z-20 bg-amber-500 text-black px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                MY PICK
              </div>
            )}
          </div>

          {/* Chef Info (Smaller) */}
          {blackChef && (
            <div
              className={`w-full max-w-sm transition-all duration-500 ${
                userPrediction && userPrediction !== "BLACK"
                  ? "opacity-40"
                  : "opacity-100"
              }`}
            >
              <ChefCard
                chef={blackChef}
                isFlipped={true}
                layout="horizontal"
                maskStats={true}
              />
            </div>
          )}
        </div>

        {/* VS / Judging Area */}
        <div className="w-96 flex flex-col gap-2 items-center justify-center z-10 pt-10">
          {/* Main Ingredient Badge - Moved up and styled to avoid overlap */}
          {match.mainIngredient && (
            <div className="flex flex-col items-center animate-bounce-custom mb-4 relative z-30">
              <span className="text-gray-400 text-[10px] tracking-[0.2em] uppercase mb-1">
                Main Ingredient
              </span>
              <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-8 py-3 rounded-full text-2xl font-black shadow-lg border-2 border-amber-400/50 min-w-[200px] text-center">
                {match.mainIngredient}
              </div>
            </div>
          )}

          {!showResult ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="text-8xl font-black italic text-red-600 drop-shadow-lg mb-8 scale-110">
                VS
              </div>
              <p className="text-gray-400 text-sm animate-pulse">
                승리할 것 같은 요리를 선택하세요
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4 bg-black/60 p-6 rounded-lg border border-gray-700 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
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
                        : getVoteResult("P") === "WHITE"
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {getVoteResult("P") === "BLACK"
                      ? "⚫️ 흑수저"
                      : getVoteResult("P") === "WHITE"
                      ? "⚪️ 백수저"
                      : "심사 중..."}
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
                        : getVoteResult("A") === "WHITE"
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {getVoteResult("A") === "BLACK"
                      ? "⚫️ 흑수저"
                      : getVoteResult("A") === "WHITE"
                      ? "⚪️ 백수저"
                      : "심사 중..."}
                  </div>
                </div>
                <div className="text-xs text-gray-400 italic max-w-[140px] text-right border-l border-gray-600 pl-3">
                  {getVoteComment("A")}
                </div>
              </div>

              {/* Results */}
              {match.isTie ? (
                <div className="bg-yellow-500/10 text-yellow-500 px-4 py-3 rounded-lg text-center border border-yellow-500/30 shadow-lg mt-2">
                  <div className="text-3xl font-black mb-1">1 : 1</div>
                  <div className="text-sm font-bold text-white mb-2">
                    {match.winnerId === match.blackChefId
                      ? "무승부 (흑수저 판정승)"
                      : "무승부 (백수저 판정승)"}
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 text-green-500 px-4 py-3 rounded-lg text-center border border-green-500/30 shadow-lg mt-2">
                  <div className="text-4xl font-black mb-1">2 : 0</div>
                  <div className="text-lg font-bold text-white">
                    🏆{" "}
                    {match.winnerId === match.blackChefId ? "흑수저" : "백수저"}{" "}
                    생존!
                  </div>
                </div>
              )}

              {/* Prediction Result Msg */}
              {isPredictionCorrect ? (
                <div className="text-center text-green-400 font-bold text-sm animate-pulse">
                  ✨ 예측 성공! 안목이 대단하시네요.
                </div>
              ) : (
                <div className="text-center text-red-400 font-bold text-sm">
                  😓 아쉽네요... 다음엔 맞혀보세요!
                </div>
              )}

              <Button
                size="lg"
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-6 text-lg shadow-lg border border-blue-400/30 animate-pulse"
                onClick={handleNextMatch}
                disabled={currentMatchIndex >= matcheCount - 1}
              >
                다음 매치 진행 ➡️
              </Button>
            </div>
          )}
        </div>

        {/* White Chef Side */}
        <div className="flex-1 flex flex-col gap-6 items-center">
          {/* Dish Area (Prominent) */}
          <div
            className={`flex-1 w-full max-w-md bg-gray-800/60 rounded-xl border-2 p-6 flex items-center justify-center relative overflow-hidden group transition-all duration-300 cursor-pointer
                ${
                  userPrediction === "WHITE"
                    ? "border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                    : "border-gray-700/50 hover:border-gray-500"
                }
                ${
                  userPrediction && userPrediction !== "WHITE"
                    ? "opacity-50 grayscale"
                    : ""
                }
              `}
            onClick={() => !userPrediction && handlePrediction("WHITE")}
          >
            {/* Hover Effect Helper */}
            {!userPrediction && (
              <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 font-bold text-2xl text-black shadow-inner">
                승리 예측하기
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-bl from-white/10 to-transparent transition-all" />

            {match.whiteDish && <DishCard dish={match.whiteDish} size="lg" />}
            <div className="absolute top-4 right-4">
              <span className="bg-white/90 text-black px-3 py-1 rounded-full text-sm font-bold border border-gray-400">
                WHITE DISH
              </span>
            </div>
            {userPrediction === "WHITE" && (
              <div className="absolute top-4 left-4 z-20 bg-amber-500 text-black px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                MY PICK
              </div>
            )}
          </div>

          {/* Chef Info (Smaller) */}
          {whiteChef && (
            <div
              className={`w-full max-w-sm transition-all duration-500 ${
                userPrediction && userPrediction !== "WHITE"
                  ? "opacity-40"
                  : "opacity-100"
              }`}
            >
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
