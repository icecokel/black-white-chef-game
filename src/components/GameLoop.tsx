import { useEffect } from "react";
import { useChefStore } from "../store/useChefStore";

export const GameLoop = () => {
  const { currentRound, advanceRound1Cooking } = useChefStore();

  // 라운드 1 요리 진행 루프
  useEffect(() => {
    if (currentRound?.status === "judging") {
      const timer = setInterval(() => {
        // 요리 진행 (Cooking)
        advanceRound1Cooking();
      }, 1000); // 1초마다 요리 완료 체크

      return () => clearInterval(timer);
    }
  }, [currentRound?.status, advanceRound1Cooking]);

  // 라운드 1 심사 진행 루프
  useEffect(() => {
    // Round 1 Judging
    if (currentRound?.status === "judging") {
      const timer = setInterval(() => {
        const { currentRound: round, advanceRound1Judging } =
          useChefStore.getState();

        if (!round || round.status !== "judging") return;

        // 심사 대기 큐에 사람이 충분히 있거나, 요리가 다 끝났는데 사람이 있으면 진행
        const canAdvance =
          round.judgingQueue.length > round.currentJudgingIndex ||
          (round.cookingChefIds.length === 0 &&
            round.judgingQueue.length > round.currentJudgingIndex);

        if (canAdvance) {
          advanceRound1Judging();
        }
      }, 3000); // 3초마다 심사 진행 (애니메이션 2.5초 + 여유 0.5초)

      return () => clearInterval(timer);
    }
  }, [currentRound?.status]);

  return null;
};
