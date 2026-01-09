import { cn } from "@/lib/utils";

type TabType = "round" | "chefs";

interface GameTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const GameTabs = ({ activeTab, onTabChange }: GameTabsProps) => {
  return (
    <div className="flex gap-2 p-2 bg-muted/30 rounded-lg">
      <TabButton
        active={activeTab === "round"}
        onClick={() => onTabChange("round")}
      >
        라운드
      </TabButton>
      <TabButton
        active={activeTab === "chefs"}
        onClick={() => onTabChange("chefs")}
      >
        쉐프 목록
      </TabButton>
    </div>
  );
};

const TabButton = ({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    {children}
  </button>
);

export type { TabType };
