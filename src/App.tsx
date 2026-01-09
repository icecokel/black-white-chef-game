import { useState } from "react";
import { ChefGrid } from "./components/ChefGrid";
import { InitialScreen } from "./components/InitialScreen";
import { useChefStore } from "./store/useChefStore";

type GameState = "intro" | "playing" | "result";

function App() {
  const [gameState, setGameState] = useState<GameState>("intro");
  const { initializeGame } = useChefStore();

  const handleStartGame = () => {
    initializeGame();
    setGameState("playing");
  };

  if (gameState === "intro") {
    return <InitialScreen onStart={handleStartGame} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b p-4 mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tighter">
          Culinary Class Wars
        </h1>
        <span className="text-sm text-muted-foreground">Survivors: 100</span>
      </div>

      <ChefGrid />
    </div>
  );
}

export default App;
