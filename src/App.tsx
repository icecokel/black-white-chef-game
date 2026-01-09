import type { Chef } from "./types/chef";
import { ChefCard } from "./components/ChefCard";

const SAMPLE_BLACK_SPOON: Chef = {
  id: "black-1",
  name: "히든 천재",
  rank: "BLACK",
  stats: {
    proficiency: 95,
    creativity: 98,
    taste: 92,
    mental: 85,
    speed: 90,
  },
};

const SAMPLE_WHITE_SPOON: Chef = {
  id: "white-1",
  name: "에드워드 리",
  rank: "WHITE",
  stats: {
    proficiency: 99,
    creativity: 96,
    taste: 97,
    mental: 98,
    speed: 88,
  },
};

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8 gap-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter">
          Culinary Class Wars
        </h1>
        <p className="text-muted-foreground">
          Cinematic Theme & Card Component Verification
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-4xl">
        <div className="w-64">
          <ChefCard chef={SAMPLE_BLACK_SPOON} />
          <p className="text-center mt-4 text-sm text-muted-foreground">
            Black Spoon Variant
          </p>
        </div>

        <div className="w-64">
          <ChefCard chef={SAMPLE_WHITE_SPOON} />
          <p className="text-center mt-4 text-sm text-muted-foreground">
            White Spoon Variant
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
