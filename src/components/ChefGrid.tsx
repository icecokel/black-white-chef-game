import { useChefStore } from "../store/useChefStore";
import { ChefCard } from "./ChefCard";
import { motion } from "framer-motion";

interface ChefGridProps {
  enablePick?: boolean; // 픽 모드 활성화
}

export const ChefGrid = ({ enablePick = false }: ChefGridProps) => {
  const { getSortedChefs, toggleUserPick, currentRound } = useChefStore();
  const sortedChefs = getSortedChefs();

  const handleCardClick = (chefId: string) => {
    if (enablePick && !currentRound) {
      toggleUserPick(chefId);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      {enablePick && !currentRound && (
        <div className="mb-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-center text-sm">
          💡 합격할 것 같은 흑수저를 클릭하여 선택하세요!
        </div>
      )}
      <div className="grid grid-cols-5 gap-4 md:gap-6">
        {sortedChefs.map((chef, index) => {
          const delay = index * 0.02;

          // 결과 매핑
          let resultType: "pass" | "fail" | "pending" | undefined = undefined;

          if (currentRound && currentRound.roundNumber === 1) {
            const isPassed = currentRound.passedChefIds.includes(chef.id);
            const isEliminated = currentRound.eliminatedChefIds.includes(
              chef.id
            );
            const isPending = currentRound.pendingChefIds.includes(chef.id);

            if (isPassed) resultType = "pass";
            else if (isEliminated) resultType = "fail";
            else if (isPending) resultType = "pending";
          }

          return (
            <motion.div
              key={chef.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.4 }}
              className="col-span-1"
            >
              <div className="w-full">
                <ChefCard
                  chef={chef}
                  isFlipped={true} // 목록에서는 항상 얼굴 공개
                  judgingResult={resultType}
                  onClick={() => handleCardClick(chef.id)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
