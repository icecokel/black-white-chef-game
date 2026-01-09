import { useChefStore } from "../store/useChefStore";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/Badge";
import { ChefCard } from "./ChefCard";
import type { Chef } from "../types/chef";
import type { Dish } from "../types/match";
import { motion } from "framer-motion";

export const Round3View = () => {
  const { currentRound, setRound3Prediction, playRound3Match } = useChefStore();

  if (!currentRound || !currentRound.round3State) return null;
  const { round3State } = currentRound;
  const { userPrediction, judges, blackTeamScore, whiteTeamScore, matches } =
    round3State;

  // Helper to create dummy team chef for display
  const createTeamChef = (
    id: string,
    name: string,
    rank: "BLACK" | "WHITE",
    dish: Dish
  ): Chef => ({
    id,
    name,
    nickname: name,
    rank,
    image: "", // Use ChefCard's default placeholder
    cuisine: "FUSION", // Dummy
    specialties: ["FUSION"], // Dummy
    status: "alive",
    stats: {
      taste: dish.scores.taste,
      creativity: dish.scores.creativity,
      proficiency: dish.scores.completeness,
      mental: 95,
      speed: 95,
    },
    revealedStats: ["taste", "creativity", "proficiency", "mental", "speed"],
    isPlayerPick: false,
  });

  // Last completed match (to show result)
  const lastMatch = matches.length > 0 ? matches[matches.length - 1] : null;

  const currentMatchNum = round3State.currentMatchIndex + 1;
  const isCompleted = currentRound.status === "completed";

  // 예측 단계
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
          <div className="text-spoon-black-text flex flex-col items-end">
            <span className="text-sm opacity-50">흑수저 팀</span>
            <span>{blackTeamScore}점</span>
          </div>
          <span className="text-gray-600 text-lg">vs</span>
          <div className="text-spoon-white-text flex flex-col items-start">
            <span className="text-sm opacity-50">백수저 팀</span>
            <span>{whiteTeamScore}점</span>
          </div>
        </div>
      </div>

      {/* Main Battle Area relative to LAST MATCH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-4 items-start">
        {/* Black Team Dish */}
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
                  lastMatch.blackDish
                )}
                layout="horizontal"
                isFlipped={true}
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center text-gray-500 animate-pulse gap-2">
              <span className="text-4xl">🔪</span>
              <span>재료 손질 중...</span>
            </div>
          )}
        </div>

        {/* White Team Dish */}
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
                  lastMatch.whiteDish
                )}
                layout="horizontal"
                isFlipped={true}
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-white/5 rounded-xl border border-white/5 flex flex-col items-center justify-center text-gray-500 animate-pulse gap-2">
              <span className="text-4xl">🔥</span>
              <span>육수 끓이는 중...</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls & Result */}
      <div className="flex justify-center my-8">
        {!isCompleted ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              size="lg"
              className="text-xl px-12 py-8 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all active:scale-95 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
              onClick={playRound3Match}
            >
              {round3State.currentMatchIndex === 0
                ? "1차전 시작 (100인 심사)"
                : round3State.currentMatchIndex === 1
                ? "2차전 시작 (50인 심사)"
                : "3차전 시작 (10인 심사)"}
            </Button>
            <p className="text-sm text-gray-500">
              {round3State.currentMatchIndex === 0
                ? "승리 팀에게 1점 부여"
                : round3State.currentMatchIndex === 1
                ? "승리 팀에게 2점 부여 (누적)"
                : "승리 팀에게 10점 부여 (역전 가능)"}
            </p>
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

      {/* Judges Grid */}
      <Card className="p-6 bg-black/40 border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h4 className="text-gray-300 font-bold text-lg">
              생존 심사위원 ({judges.length}명)
            </h4>
            <span className="text-xs text-gray-500">
              {matches.length > 0
                ? "* 지난 매치 결과에 따라 생존한 심사위원들입니다."
                : "* 100인의 미식 평가단이 준비되었습니다."}
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
          </div>
        </div>
        <div
          className="grid gap-2 place-items-center"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(12px, 1fr))`,
          }}
        >
          <div className="flex flex-wrap gap-2 justify-center w-full">
            {judges.map((judge, i) => {
              // Determine color based on last vote
              const lastMatchIndex = round3State.currentMatchIndex - 1;
              const lastVote = judge.voteHistory.find(
                (v) => v.matchIndex === lastMatchIndex
              );
              const colorClass = lastVote
                ? lastVote.pick === "BLACK"
                  ? "bg-spoon-black-accent shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  : "bg-spoon-white-accent shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                : "bg-gray-700";

              return (
                <motion.div
                  key={judge.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.005 }}
                  className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full ${colorClass} opacity-90 hover:opacity-100 transition-all cursor-help`}
                  title={`${
                    judge.name
                  } (Taste: ${judge.preferences.taste.toFixed(0)})`}
                />
              );
            })}
          </div>
        </div>
      </Card>
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
