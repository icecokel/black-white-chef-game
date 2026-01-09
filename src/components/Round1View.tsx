import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useChefStore } from "../store/useChefStore";
import { ChefCard } from "./ChefCard";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import type { JudgingResult } from "../types/round";
import type { Chef } from "../types/chef";

export const Round1View = () => {
  const {
    currentRound,
    chefs,
    getAliveBlackChefs,
    getUserPicks,
    toggleUserPick,
    startRound1Judging,

    startRound2,
  } = useChefStore();

  const [showResultFor, setShowResultFor] = useState<{
    startIndex: number;
    flipped: boolean;
  } | null>(null);
  const [cookingMessage, setCookingMessage] = useState<string | null>(null);

  // 이전 인덱스를 추적하여 "방금 심사된 배치"를 감지
  const prevJudgingIndex = useRef(currentRound?.currentJudgingIndex || 0);
  const prevMessageLength = useRef(currentRound?.messageLog.length || 0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentRound?.messageLog]);

  // 메시지 로그 감지하여 쿠킹 메시지 표시
  useEffect(() => {
    if (!currentRound) return;
    const currentLength = currentRound.messageLog.length;
    if (currentLength > prevMessageLength.current) {
      const lastMsg = currentRound.messageLog[currentLength - 1];
      if (lastMsg.includes("요리 완료")) {
        setCookingMessage(lastMsg);
        setTimeout(() => setCookingMessage(null), 2000);
      }
    }
    prevMessageLength.current = currentLength;
  }, [currentRound?.messageLog]);

  // 심사 진행 감지 및 UI 업데이트
  useEffect(() => {
    if (!currentRound) return;
    const currentIndex = currentRound.currentJudgingIndex;
    const prevIndex = prevJudgingIndex.current;

    if (currentIndex > prevIndex) {
      // 인덱스가 증가했다 = 심사가 진행되었다.
      // 직전 배치의 결과를 보여주기 위해 상태 설정
      // 이전 배치의 시작 인덱스는 prevIndex
      setShowResultFor({ startIndex: prevIndex, flipped: false });

      // 잠시 후 뒤집기 (결과 공개)
      const flipTimer = setTimeout(() => {
        setShowResultFor({ startIndex: prevIndex, flipped: true });
      }, 500);

      // 충분히 보여준 후 현재 대기 상태로 복귀
      const resetTimer = setTimeout(() => {
        setShowResultFor(null);
      }, 2500); // 2.5초 동안 결과 보여줌

      prevJudgingIndex.current = currentIndex;

      return () => {
        clearTimeout(flipTimer);
        clearTimeout(resetTimer);
      };
    } else {
      // 인덱스가 같거나 줄어듦 (리셋 등)
      prevJudgingIndex.current = currentIndex;
    }
  }, [currentRound?.currentJudgingIndex, currentRound]);

  // 화면에 보여줄 쉐프들 계산
  // showResultFor가 있으면 그 배치를, 없으면 현재 대기중인 배치를 보여줌
  const displayStartIndex = showResultFor
    ? showResultFor.startIndex
    : currentRound?.currentJudgingIndex || 0;

  const displayChefsLength = 4;
  const displayChefsIds = currentRound?.judgingQueue.slice(
    displayStartIndex,
    displayStartIndex + displayChefsLength
  );

  const displayChefs = displayChefsIds
    ? displayChefsIds
        .map((id) => chefs.find((c) => c.id === id))
        .filter((c): c is Chef => c !== undefined)
    : [];

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
          심사 시작
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

  // 2. 심사 단계 (judging)
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
              {displayChefs.length > 0 ? (
                // 4개 슬롯 고정 (채워지는 대로)
                [...Array(4)].map((_, idx) => {
                  const chef = displayChefs[idx];
                  if (!chef) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="aspect-[3/4] bg-gray-800/30 rounded-xl border border-gray-700/50 flex items-center justify-center"
                      >
                        <span className="text-4xl opacity-20">⚖️</span>
                      </div>
                    );
                  }

                  // 결과 계산
                  // showResultFor 상태라면 그것에 따름 (flipped 여부)
                  // 아니라면 대기 상태 (뒷면 or 앞면?)
                  // 심사 전 대기 상태: 앞면(프로필) -> 심사 -> 뒷면(결과) 연출?
                  // 기존 ChefCard: isFlipped=true면 뒷면(결과) 보여줌?
                  // 확인: ChefCard 구현을 안 봤음. 보통 isFlipped가 true면 뒷면이라고 가정.

                  // 로직:
                  // 1. showResultFor가 null이다 -> 현재 대기중인 애들 -> 아직 심사 안함 -> 프로필(앞면) 보여줌. (isFlipped = false)
                  // 2. showResultFor가 있다 -> 방금 심사 끝난 애들.
                  //    - flipped = false -> 아직 결과 공개 전 (긴장감) -> 뒷면? 앞면?
                  //      기존 로직: flipped=false(초기) -> true(공개).
                  //      보통 카드 뒤집기 연출은: 앞면(프로필) -> 뒷면(결과).
                  //      여기서 `isFlipped` prop의 의미가 중요함.
                  //      (가정: isFlipped=true여야 결과(뒷면)가 보임)

                  //      T0(심사직후): flipped=false. 즉 아직 결과 안 보여줌. (앞면 유지 or 뒷면으로 돌려서 대기?)
                  //      T1(500ms): flipped=true. 결과 보여줌.

                  const isResultView = showResultFor !== null;
                  const showResult = isResultView
                    ? showResultFor.flipped
                    : false;

                  // Chef 객체 상태에 따른 결과 매핑
                  let resultType: "pass" | "fail" | "pending" | undefined =
                    undefined;

                  if (
                    chef.status === "alive" ||
                    currentRound.passedChefIds.includes(chef.id)
                  )
                    resultType = "pass";
                  else if (chef.status === "eliminated") resultType = "fail";
                  else if (chef.status === "pending") resultType = "pending";

                  // 아직 심사 전인 애들(현재 대기열)은 resultType이 undefined여야 함?
                  // 하지만 chef.status는 이전 라운드 살아남은 상태인 'alive'일 수 있음.
                  // 따라서, '현재 라운드에서 통과했냐'를 봐야 함.
                  const isPassed = currentRound.passedChefIds.includes(chef.id);
                  const isEliminated = currentRound.eliminatedChefIds.includes(
                    chef.id
                  );
                  const isPending = currentRound.pendingChefIds.includes(
                    chef.id
                  );

                  if (isPassed) resultType = "pass";
                  else if (isEliminated) resultType = "fail";
                  else if (isPending) resultType = "pending";
                  else resultType = undefined; // 아직 심사 전

                  return (
                    <div key={chef.id} className="w-full">
                      <ChefCard
                        chef={chef}
                        isFlipped={showResult}
                        judgingResult={resultType}
                      />
                    </div>
                  );
                })
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
        <p className="text-red-400 font-bold animate-pulse">
          ⚠️ 생존자 {passedChefs.length}명을 제외한 전원(
          {eliminatedChefs.length}명)이 탈락 처리되었습니다.
        </p>

        <Button
          size="lg"
          onClick={() => startRound2()}
          className="bg-white text-black hover:bg-gray-200 font-bold text-lg px-8 py-6 animate-pulse"
        >
          ⚔️ 2라운드 시작하기
        </Button>

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
      </div>
    );
  }

  return null;
};
