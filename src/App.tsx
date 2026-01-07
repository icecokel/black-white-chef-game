import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">Culinary Class Wars</h1>
      <div className="p-4 border rounded-lg shadow-lg bg-card text-card-foreground">
        <p className="mb-4">Tailwind CSS v4 + shadcn/ui Setup Complete</p>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
