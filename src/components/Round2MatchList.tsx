import { useChefStore } from "../store/useChefStore";
import { Button } from "./ui/button";
import { ChefCard } from "./ChefCard";
import { cn } from "@/lib/utils";

export const Round2MatchList = () => {
  const { currentRound, chefs, toggleRound2UserPick, proceedToRound2Reveal } =
    useChefStore();

  if (
    !currentRound ||
    !currentRound.matches ||
    !currentRound.round2State ||
    currentRound.round2State.phase !== "picking"
  ) {
    return null;
  }

  const { userPicks } = currentRound.round2State;
  const matches = currentRound.matches;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-900/90 p-6 rounded-xl border border-gray-800 backdrop-blur-md sticky top-0 z-30 shadow-2xl">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Round 2: 1vs1 흑백 대전
          </h2>
          <p className="text-gray-400 text-lg">
            승리할 쉐프 <span className="text-amber-500 font-bold">2명</span>을
            선택해주세요. 선택한 쉐프의 경기 결과를 먼저 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="text-sm text-gray-500 block font-medium tracking-wider">
              MY PICK
            </span>
            <span
              className={cn(
                "text-3xl font-black",
                userPicks.length === 2 ? "text-green-500" : "text-amber-500"
              )}
            >
              {userPicks.length}{" "}
              <span className="text-gray-600 text-xl">/ 2</span>
            </span>
          </div>
          <Button
            size="lg"
            onClick={proceedToRound2Reveal}
            disabled={userPicks.length === 0}
            className={cn(
              "font-bold text-xl px-10 py-7 transition-all rounded-xl",
              userPicks.length > 0
                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            )}
          >
            결과 확인하기 ➡️
          </Button>
        </div>
      </div>

      {/* Match List Grid - 2 Columns for better visibility */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-6 p-2 pb-20 auto-rows-min">
        {matches.map((match, index) => {
          const blackChef = chefs.find((c) => c.id === match.blackChefId);
          const whiteChef = chefs.find((c) => c.id === match.whiteChefId);

          if (!blackChef || !whiteChef) return null;

          const isBlackPicked = userPicks.includes(blackChef.id);
          const isWhitePicked = userPicks.includes(whiteChef.id);

          return (
            <div
              key={match.id}
              className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden flex flex-col relative group transition-all duration-300 hover:border-gray-600 hover:shadow-xl"
            >
              {/* Match Header Bar */}
              <div className="relative h-12 bg-black/40 border-b border-gray-800 flex items-center justify-between px-6">
                <div className="text-gray-500 font-mono font-bold">
                  MATCH {String(index + 1).padStart(2, "0")}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-amber-500/50"></div>
                  <span className="text-amber-500 font-bold bg-gray-900 border border-amber-900/50 px-3 py-0.5 rounded-full text-sm shadow-sm">
                    {match.mainIngredient}
                  </span>
                  <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-amber-500/50"></div>
                </div>
              </div>

              {/* Chef Comparison Area */}
              <div className="flex-1 flex items-stretch relative">
                {/* VS Badge Center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="bg-black text-white text-xl font-black italic px-3 py-1 rounded border border-gray-700 shadow-xl">
                    VS
                  </div>
                </div>

                {/* Black Side */}
                <div
                  className={cn(
                    "flex-1 p-6 flex flex-col items-center gap-4 cursor-pointer transition-all relative border-r border-gray-800/50",
                    isBlackPicked ? "bg-amber-950/20" : "hover:bg-white/5"
                  )}
                  onClick={() => toggleRound2UserPick(blackChef.id)}
                >
                  <div className="w-full max-w-[280px]">
                    <ChefCard chef={blackChef} isFlipped={true} />
                  </div>

                  {isBlackPicked ? (
                    <div className="w-full bg-amber-500 text-black font-bold text-center py-2 rounded-lg animate-pulse">
                      PICKED ✓
                    </div>
                  ) : (
                    <div className="w-full border border-gray-700 text-gray-400 font-bold text-center py-2 rounded-lg group-hover:border-gray-500 group-hover:text-gray-300 transition-colors">
                      선택하기
                    </div>
                  )}
                </div>

                {/* White Side */}
                <div
                  className={cn(
                    "flex-1 p-6 flex flex-col items-center gap-4 cursor-pointer transition-all relative border-l border-gray-800/50",
                    isWhitePicked ? "bg-amber-950/20" : "hover:bg-white/5"
                  )}
                  onClick={() => toggleRound2UserPick(whiteChef.id)}
                >
                  <div className="w-full max-w-[280px]">
                    <ChefCard chef={whiteChef} isFlipped={true} />
                  </div>

                  {isWhitePicked ? (
                    <div className="w-full bg-amber-500 text-black font-bold text-center py-2 rounded-lg animate-pulse">
                      PICKED ✓
                    </div>
                  ) : (
                    <div className="w-full border border-gray-700 text-gray-400 font-bold text-center py-2 rounded-lg group-hover:border-gray-500 group-hover:text-gray-300 transition-colors">
                      선택하기
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
