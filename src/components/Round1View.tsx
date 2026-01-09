import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useChefStore } from "../store/useChefStore";
import { ChefCard } from "./ChefCard";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import type { JudgingResult } from "../types/round";
import type { Chef } from "../types/chef";

interface BatchState {
  chefs: Chef[];
  results: JudgingResult[];
  messages: string[];
  flipped: boolean;
}

export const Round1View = () => {
  const {
    currentRound,
    chefs,
    getAliveBlackChefs,
    getUserPicks,
    toggleUserPick,
    startRound1Judging,
    advanceRound1Cooking,
    advanceRound1Judging,
  } = useChefStore();

  const [batchState, setBatchState] = useState<BatchState | null>(null);
  const [cookingMessage, setCookingMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentRound?.messageLog]);

  // 요리 진행 (좀 더 자:주 호출)
  useEffect(() => {
    if (currentRound?.status === "judging") {
      const timer = setInterval(() => {
        const result = advanceRound1Cooking();
        if (result && result.messages.length > 0) {
          setCookingMessage(result.messages[result.messages.length - 1]);
          setTimeout(() => setCookingMessage(null), 2000);
        }
      }, 1000); // 1초마다 요리 완료 체크
      return () => clearInterval(timer);
    }
  }, [currentRound?.status, advanceRound1Cooking]);

  // 채점 진행 (기존 로직 유지)
  useEffect(() => {
    if (currentRound?.status === "judging" && !batchState) {
      // 채점 큐에 사람이 충분히 있거나, 요리가 다 끝났는데 사람이 있으면 진행
      const canAdvance =
        currentRound.judgingQueue.length > currentRound.currentJudgingIndex ||
        (currentRound.cookingChefIds.length === 0 &&
          currentRound.judgingQueue.length > currentRound.currentJudgingIndex);

      if (canAdvance) {
        const result = advanceRound1Judging();
        if (result) {
          setBatchState({ ...result, flipped: false });
          setTimeout(() => {
            setBatchState((prev) => (prev ? { ...prev, flipped: true } : null));
          }, 500);
          setTimeout(() => {
            setBatchState(null);
          }, 2000);
        }
      }
    }
  }, [
    currentRound?.status,
    batchState,
    currentRound?.judgingQueue.length,
    currentRound?.currentJudgingIndex,
    advanceRound1Judging,
  ]);

  if (!currentRound) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        게임을 시작해주세요.
      </div>
    );
  }

  // 1. 선택 단계 (picking)
  if (currentRound.status === "picking") {
    const aliveBlacks = getAliveBlackChefs();
    const userPicks = getUserPicks();

    return (
      <div className="flex flex-col items-center gap-6 p-8">
        <h2 className="text-3xl font-bold">Round {currentRound.roundNumber}</h2>
        <p className="text-muted-foreground">
          흑수저 {aliveBlacks.length}명 중 {currentRound.targetPassCount}명이
          통과합니다.
        </p>

        <div className="flex items-center gap-4 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
          <span className="text-yellow-400 text-2xl">⭐</span>
          <div>
            <p className="font-medium">
              합격할 것 같은 쉐프 {currentRound.userPickLimit}명을 선택하세요!
            </p>
            <p className="text-sm text-muted-foreground">
              선택: {userPicks.length} / {currentRound.userPickLimit}
            </p>
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => startRound1Judging()}
          disabled={userPicks.length !== currentRound.userPickLimit}
        >
          채점 시작
        </Button>

        <div className="grid grid-cols-5 gap-4 mt-6 max-w-6xl">
          {aliveBlacks.map((chef) => (
            <div
              key={chef.id}
              onClick={() => toggleUserPick(chef.id)}
              className="cursor-pointer"
            >
              <ChefCard chef={chef} isFlipped={true} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. 채점 단계 (judging)
  if (currentRound.status === "judging") {
    const cookingChefs = currentRound.cookingChefIds
      .map((id) => chefs.find((c) => c.id === id))
      .filter((c): c is Chef => c !== undefined);

    const waitingChefs = currentRound.judgingQueue
      .slice(currentRound.currentJudgingIndex)
      .map((id) => chefs.find((c) => c.id === id))
      .filter((c): c is Chef => c !== undefined);

    const totalParticipants =
      currentRound.cookingChefIds.length + currentRound.judgingQueue.length;
    const progressPercent =
      totalParticipants > 0
        ? Math.round(
            (currentRound.currentJudgingIndex / totalParticipants) * 100
          )
        : 0;

    return (
      <div className="flex flex-col h-[calc(100vh-100px)] p-6 gap-6">
        {/* 상단 상태 바 */}
        <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Current Round</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
                통과 {currentRound.passedChefIds.length} /{" "}
                {currentRound.targetPassCount}
              </span>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm font-medium">
                보류 {currentRound.pendingChefIds.length}
              </span>
              <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm font-medium">
                탈락 {currentRound.eliminatedChefIds.length}
              </span>
            </div>
          </div>
          <div className="w-1/3">
            <div className="flex justify-between text-xs mb-1 text-muted-foreground">
              <span>심사 진행률</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* 왼쪽: 요리 중 영역 */}
          <div className="w-1/4 flex flex-col gap-4 bg-gray-900/30 rounded-xl p-4 border border-gray-800/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              🔥 요리 중 ({cookingChefs.length})
            </h3>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {cookingChefs.map((chef) => (
                  <div
                    key={chef.id}
                    className="p-3 bg-gray-800/50 rounded-lg flex items-center gap-3 animate-pulse"
                  >
                    <div className="text-2xl">🍳</div>
                    <div>
                      <div className="font-medium text-sm text-spoon-black-text">
                        {chef.nickname}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Speed: {chef.stats.speed}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 중앙: 심사 영역 */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 bg-gray-900/30 rounded-xl p-8 border border-gray-800/50 relative">
            <div className="absolute top-4 left-4 text-sm text-muted-foreground">
              심사 대기: {waitingChefs.length}명
            </div>

            <div className="grid grid-cols-4 gap-4 w-full max-w-4xl">
              {batchState ? (
                batchState.chefs.map((chef, idx) => (
                  <div key={chef.id} className="w-full">
                    <ChefCard
                      chef={chef}
                      isFlipped={batchState.flipped}
                      judgingResult={
                        batchState.flipped ? batchState.results[idx] : undefined
                      }
                    />
                  </div>
                ))
              ) : (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] bg-gray-800/30 rounded-xl border border-gray-700/50 flex items-center justify-center"
                    >
                      <span className="text-4xl opacity-20">⚖️</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {cookingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-8 bg-black/80 text-white px-6 py-3 rounded-full border border-gray-700 shadow-xl backdrop-blur-md"
              >
                {cookingMessage}
              </motion.div>
            )}
          </div>

          {/* 오른쪽: 메시지 로그 */}
          <div className="w-1/4 flex flex-col gap-4 bg-black/40 rounded-xl p-4 border border-gray-800">
            <h3 className="text-lg font-bold flex items-center gap-2">
              📝 현장 기록
            </h3>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-2 pr-2 font-mono text-sm"
              style={{ maxHeight: "calc(100vh-250px)" }}
            >
              {currentRound.messageLog.map((log, i) => (
                <div
                  key={i}
                  className="p-2 border-b border-gray-800/50 last:border-0 break-keep"
                >
                  <span className="opacity-70">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. 완료 단계 (completed)
  if (currentRound.status === "completed") {
    const passedChefs = chefs.filter((c) =>
      currentRound.passedChefIds.includes(c.id)
    );
    const eliminatedChefs = chefs.filter(
      (c) => c.rank === "BLACK" && c.status === "eliminated"
    );
    const userPicks = getUserPicks();
    const correctPicks = userPicks.filter((c) =>
      currentRound.passedChefIds.includes(c.id)
    );

    return (
      <div className="flex flex-col items-center gap-6 p-8">
        <h2 className="text-3xl font-bold">
          Round {currentRound.roundNumber} 완료!
        </h2>

        <div className="flex gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-green-500">
              {passedChefs.length}
            </p>
            <p className="text-muted-foreground">통과</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-red-500">
              {eliminatedChefs.length}
            </p>
            <p className="text-muted-foreground">탈락</p>
          </div>
        </div>

        {userPicks.length > 0 && (
          <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
            <p>
              ⭐ 예측 결과: {correctPicks.length} / {userPicks.length} 적중!
            </p>
          </div>
        )}

        <div className="mt-8">
          <p className="text-muted-foreground mb-4">
            통과한 쉐프 (정확히 {currentRound.targetPassCount}명):
          </p>
          <div className="grid grid-cols-5 gap-4 max-w-5xl">
            {passedChefs.map((chef) => (
              <div key={chef.id} className="w-full">
                <ChefCard chef={chef} isFlipped={true} />
              </div>
            ))}
          </div>
        </div>

        <Button className="mt-8" disabled>
          다음 라운드 (준비 중)
        </Button>
      </div>
    );
  }

  return null;
};
