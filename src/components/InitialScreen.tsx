import { motion } from "framer-motion";
import { useChefStore } from "../store/useChefStore";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useEffect, useState } from "react";
import type { Chef } from "../types/chef";

interface InitialScreenProps {
  onStart: () => void;
}

export function InitialScreen({ onStart }: InitialScreenProps) {
  const { initializeGame, chefs } = useChefStore();
  const [displayChefs, setDisplayChefs] = useState<Chef[]>([]);

  useEffect(() => {
    // 게임 시작 전에 백그라운드용 셰프 데이터를 미리 생성
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    // 셰프 데이터가 로드되면 상위 30명만 표시 (성능 고려)
    if (chefs.length > 0) {
      setDisplayChefs(chefs.slice(0, 30));
    }
  }, [chefs]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background Card Grid */}
      <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 opacity-20 pointer-events-none">
        {displayChefs.map((chef, index) => (
          <motion.div
            key={chef.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
          >
            <Card className="h-full overflow-hidden border-2 border-muted/20">
              <CardContent className="p-2 flex flex-col items-center gap-1">
                <div className="w-full aspect-square bg-muted rounded-md mb-1" />
                <span className="text-xs font-bold truncate w-full text-center">
                  {chef.name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase">
                  {chef.rank} SPOON
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Hero Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 p-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
            Culinary
            <br />
            Class Wars
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Last Spoon Standing
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="mb-8 text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            80명의 흑수저와 20명의 백수저.
            <br />
            당신의 안목으로 최후의 1인을 선택하세요.
          </p>
          <Button
            size="lg"
            onClick={onStart}
            className="text-lg font-bold px-12 py-6 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all"
          >
            서바이벌 시작하기
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
