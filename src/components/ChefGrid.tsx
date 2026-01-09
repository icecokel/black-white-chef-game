import { useChefStore } from "../store/useChefStore";
import { ChefCard } from "./ChefCard";
import { motion } from "framer-motion";

export const ChefGrid = () => {
  const { chefs } = useChefStore();

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-5 gap-4 md:gap-6">
        {chefs.map((chef, index) => {
          // 간단한 선형 딜레이: 순서대로 등장
          const delay = index * 0.03; // 0.03초 간격으로 등장

          return (
            <motion.div
              key={chef.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.4 }}
              className="col-span-1"
            >
              <div className="w-full">
                <ChefCard chef={chef} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
