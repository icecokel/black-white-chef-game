import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChefStore } from "../store/useChefStore";
import { ChefCard } from "./ChefCard";
import { Button } from "./ui/button";

export const RoundView = () => {
  const {
    currentRound,
    chefs,
    getAliveBlackChefs,
    getUserPicks,
    toggleUserPick,
    startJudging,
    advanceJudging,
  } = useChefStore();

  const [message, setMessage] = useState<string>("");
  const [lastResult, setLastResult] = useState<{
    chef: (typeof chefs)[0];
    passed: boolean;
  } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Judging 상태 진입 시 자동 시작
  useEffect(() => {
    if (currentRound?.status === "judging") {
      // 자동 진행 시작
      intervalRef.current = setInterval(() => {
        const result = advanceJudging();
        if (!result) {
          // Round 완료
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          setMessage(result.message);
          setLastResult({ chef: result.chef, passed: result.passed });
        }
      }, 600);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentRound?.status, advanceJudging]);

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
          onClick={() => startJudging()}
          disabled={userPicks.length !== currentRound.userPickLimit}
        >
          채점 시작
        </Button>

        {/* 흑수저 목록 */}
        <div className="grid grid-cols-5 gap-4 mt-6 max-w-6xl">
          {aliveBlacks.map((chef) => (
            <div
              key={chef.id}
              onClick={() => toggleUserPick(chef.id)}
              className="cursor-pointer"
            >
              <ChefCard chef={chef} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. 채점 단계 (judging)
  if (currentRound.status === "judging") {
    const currentChefId =
      currentRound.judgingQueue[currentRound.currentJudgingIndex - 1];
    const currentChef = chefs.find((c) => c.id === currentChefId);

    return (
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            Round {currentRound.roundNumber} 진행 중
          </h2>
          <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
            {currentRound.passedChefIds.length} / {currentRound.targetPassCount}{" "}
            통과
          </span>
        </div>

        <div className="text-muted-foreground text-sm">
          탈락: {currentRound.eliminatedChefIds.length}명
        </div>

        {/* 메시지 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xl font-medium text-center min-h-[2em]"
          >
            {message || "채점을 시작합니다..."}
          </motion.div>
        </AnimatePresence>

        {/* 현재 쉐프 */}
        {currentChef && (
          <div className="relative w-64">
            <ChefCard chef={currentChef} />
            {lastResult && lastResult.chef.id === currentChef.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute inset-0 flex items-center justify-center rounded-xl ${
                  lastResult.passed ? "bg-green-500/40" : "bg-red-500/40"
                }`}
              >
                <span className="text-4xl font-bold text-white">
                  {lastResult.passed ? "통과!" : "탈락"}
                </span>
              </motion.div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. 완료 단계 (completed)
  if (currentRound.status === "completed") {
    const passedChefs = chefs.filter((c) =>
      currentRound.passedChefIds.includes(c.id)
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
              {currentRound.eliminatedChefIds.length}
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
          <p className="text-muted-foreground mb-4">통과한 쉐프:</p>
          <div className="grid grid-cols-5 gap-4 max-w-5xl">
            {passedChefs.slice(0, 10).map((chef) => (
              <div key={chef.id} className="w-full">
                <ChefCard chef={chef} />
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
