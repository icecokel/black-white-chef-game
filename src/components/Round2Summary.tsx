import { useChefStore } from "../store/useChefStore";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { Match } from "@/types/match";
import type { Chef } from "@/types/chef";

export const Round2Summary = () => {
  const { currentRound, chefs, startRound3 } = useChefStore();

  if (
    !currentRound ||
    !currentRound.matches ||
    currentRound.round2State?.phase !== "summary"
  ) {
    return null;
  }

  const matches = currentRound.matches;
  const { userPicks } = currentRound.round2State;

  // 통계 계산
  const blackSurvivors = chefs.filter(
    (c) => c.rank === "BLACK" && c.status === "alive"
  ).length;
  const whiteSurvivors = chefs.filter(
    (c) => c.rank === "WHITE" && c.status === "alive"
  ).length;

  // 유저 픽 적중 수
  const correctPicks = userPicks.filter((pickId) =>
    chefs.find((c) => c.id === pickId && c.status === "alive")
  ).length;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 p-6">
      {/* Header Stat */}
      <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-xl border border-gray-800">
        <div className="flex gap-8 items-center">
          <h2 className="text-3xl font-bold">Round 2 결과</h2>
          <div className="flex gap-6 text-xl">
            <span className="text-spoon-black-accent">
              흑수저 생존: <strong>{blackSurvivors}</strong>명
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-spoon-white-accent">
              백수저 생존: <strong>{whiteSurvivors}</strong>명
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-sm text-gray-500 block">예측 적중</span>
            <span className="text-2xl font-bold text-amber-500">
              {correctPicks} / {userPicks.length}
            </span>
          </div>

          <Button
            size="lg"
            onClick={() => startRound3()}
            className="bg-white text-black hover:bg-gray-200 font-bold text-lg px-8 py-6 animate-pulse"
          >
            ⚔️ 3라운드 시작하기
          </Button>
        </div>
      </div>

      {/* Result Table */}
      <div className="flex-1 overflow-y-auto bg-gray-900/30 rounded-xl border border-gray-800/50">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-gray-400 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="p-4 w-[25%] font-normal">흑수저 쉐프 & 요리</th>
              <th className="p-4 w-[10%] text-center font-normal">결과</th>
              <th className="p-4 w-[25%] text-right font-normal">
                백수저 쉐프 & 요리
              </th>
              <th className="p-4 w-[40%] font-normal pl-8">심사평</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {matches.map((match) => {
              const result = getMatchResultRow(match, chefs, userPicks);
              if (!result) return null;
              return (
                <tr
                  key={match.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  {result}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper implementation
const getMatchResultRow = (
  match: Match,
  allChefs: Chef[],
  userPicks: string[]
) => {
  const blackChef = allChefs.find((c) => c.id === match.blackChefId);
  const whiteChef = allChefs.find((c) => c.id === match.whiteChefId);
  if (!blackChef || !whiteChef || !match.blackDish || !match.whiteDish)
    return null;

  const winnerId = match.winnerId;
  const isBlackWin = winnerId === blackChef.id;

  // 심사평 하나 랜덤 가져오기 (P or A)
  const comment = match.votes[0]?.comment || "심사평 없음";

  return (
    <>
      {/* Black Side */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-1 h-12 rounded-full",
              isBlackWin ? "bg-amber-500" : "bg-gray-700"
            )}
          />
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-bold text-base",
                  isBlackWin ? "text-amber-500" : "text-gray-500 line-through"
                )}
              >
                {blackChef.nickname}
              </span>
              {userPicks.includes(blackChef.id) && (
                <span className="text-[10px] bg-blue-600 text-white px-1.5 rounded">
                  MY PICK
                </span>
              )}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              {match.blackDish.name}
            </div>
          </div>
        </div>
      </td>

      {/* Result Score/Status */}
      <td className="p-4 text-center">
        {match.isTie ? (
          <span className="text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded text-xs">
            무승부
          </span>
        ) : (
          <span className="text-gray-600 font-mono text-xs">2 : 0</span>
        )}
      </td>

      {/* White Side */}
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-3">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-2">
              {userPicks.includes(whiteChef.id) && (
                <span className="text-[10px] bg-blue-600 text-white px-1.5 rounded">
                  MY PICK
                </span>
              )}
              <span
                className={cn(
                  "font-bold text-base",
                  !isBlackWin ? "text-amber-500" : "text-gray-500 line-through"
                )}
              >
                {whiteChef.name}
              </span>
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              {match.whiteDish.name}
            </div>
          </div>
          <div
            className={cn(
              "w-1 h-12 rounded-full",
              !isBlackWin ? "bg-amber-500" : "bg-gray-700"
            )}
          />
        </div>
      </td>

      {/* Comment */}
      <td className="p-4 pl-8 text-gray-400 italic text-xs border-l border-gray-800/50">
        "{comment}"
      </td>
    </>
  );
};
