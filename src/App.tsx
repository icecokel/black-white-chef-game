import { useState, useEffect } from "react";
import { ChefGrid } from "./components/ChefGrid";
import { InitialScreen } from "./components/InitialScreen";
import { GameTabs, type TabType } from "./components/GameTabs";
import { Round1View } from "./components/Round1View";
import { Round2View } from "./components/Round2View";
import { Round3View } from "./components/Round3View";
import { useChefStore } from "./store/useChefStore";
import { GameLoop } from "./components/GameLoop";

type GameState = "intro" | "playing" | "result";

function App() {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [activeTab, setActiveTab] = useState<TabType>("round");
  const { initializeGame, startRound2, startRound3, chefs, currentRound } =
    useChefStore();

  // 환경 변수로 라운드 스킵 (테스트용)
  // 사용법: npm run dev:r2 또는 npm run dev:r3
  useEffect(() => {
    const startRound = import.meta.env.VITE_START_ROUND;

    if (startRound && gameState === "intro") {
      const targetRound = parseInt(startRound, 10);
      if (targetRound >= 1 && targetRound <= 3) {
        console.log(`🚀 라운드 ${targetRound}로 바로 시작합니다...`);
        initializeGame();
        setGameState("playing");

        if (targetRound >= 2) {
          setTimeout(() => {
            startRound2(true);
            if (targetRound === 3) {
              setTimeout(() => startRound3(true), 100);
            }
          }, 100);
        }
      }
    }
  }, []);

  const handleStartGame = () => {
    initializeGame();
    setGameState("playing");
  };

  if (gameState === "intro") {
    return <InitialScreen onStart={handleStartGame} />;
  }

  // 생존자 수 계산
  const aliveCount = chefs.filter((c) => c.status === "alive").length;
  const passedCount = currentRound?.passedChefIds.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b p-4 mb-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tighter">
            Culinary Class Wars
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              생존: {aliveCount}명
            </span>
            {currentRound && (
              <span className="text-sm text-green-500">
                통과: {passedCount}/{currentRound.targetPassCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <GameTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Content */}
      <GameLoop />
      {activeTab === "round" ? (
        currentRound?.roundNumber === 3 ? (
          <Round3View />
        ) : currentRound?.roundNumber === 2 ? (
          <Round2View />
        ) : (
          <Round1View />
        )
      ) : (
        <ChefGrid enablePick={!currentRound} />
      )}
    </div>
  );
}

export default App;
