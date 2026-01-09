import { motion } from "framer-motion";
import type { Chef } from "@/types/chef";
import { CUISINE_LABELS } from "@/types/chef";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { JudgingResult } from "@/types/round";

export interface ChefCardProps {
  chef: Chef;
  isRevealed?: boolean;
  isFlipped?: boolean;
  revealedStat?: keyof import("@/types/chef").ChefStats;
  judgingResult?: JudgingResult;
  onClick?: () => void;
  className?: string;
  layout?: "vertical" | "horizontal";
  maskStats?: boolean;
}

export const ChefCard = ({
  chef,
  isFlipped = false,
  judgingResult,
  onClick,
  className,
  layout = "vertical",
  maskStats = false,
}: ChefCardProps) => {
  const isBlack = chef.rank === "BLACK";
  const isEliminated = chef.status === "eliminated";
  const isPending = chef.status === "pending";
  const placeholderImage = `${import.meta.env.BASE_URL}chef-placeholder.png`;

  return (
    <div
      className={cn("perspective-1000 w-full", className)}
      onClick={onClick}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative w-full preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front - 카드 뒷면 (플립 전) */}
        <div
          className={cn(
            "absolute inset-0 w-full rounded-xl overflow-hidden backface-hidden",
            "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700",
            "flex items-center justify-center"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-gray-400 text-sm">심사 대기</p>
          </div>
        </div>

        {/* Back - 카드 앞면 (플립 후) */}
        <motion.div
          className={cn(
            "relative w-full rounded-xl overflow-hidden cursor-pointer group shadow-xl",
            isBlack
              ? "bg-spoon-black-bg border border-spoon-black-border shadow-spoon-black-accent/10"
              : "bg-spoon-white-bg border border-spoon-white-border shadow-spoon-white-accent/10",
            isEliminated && "opacity-50 grayscale",
            isPending && "ring-2 ring-yellow-500",
            chef.isPlayerPick &&
              !isEliminated &&
              "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background",
            layout === "horizontal" && "flex flex-row h-32"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* 판정 결과 오버레이 - 기존 디자인 + 가독성 개선 (Stamp Style) */}
          {judgingResult && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "border-4 rounded-lg px-4 py-2 transform -rotate-12 backdrop-blur-[2px] shadow-2xl",
                  judgingResult === "pass" &&
                    "border-green-500 bg-green-500/20 text-green-400",
                  judgingResult === "pending" &&
                    "border-yellow-500 bg-yellow-500/20 text-yellow-500",
                  judgingResult === "fail" &&
                    "border-red-500 bg-red-500/20 text-red-500"
                )}
              >
                <span className="text-4xl font-black uppercase tracking-widest drop-shadow-md">
                  {judgingResult === "pass"
                    ? "PASS"
                    : judgingResult === "pending"
                    ? "HOLD"
                    : "FAIL"}
                </span>
              </div>
            </div>
          )}

          {/* 탈락 라운드 배지 */}
          {isEliminated && chef.eliminatedRound && (
            <div className="absolute top-2 right-2 z-30 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              R{chef.eliminatedRound} 탈락
            </div>
          )}

          {/* 보류 배지 */}
          {isPending && !judgingResult && (
            <div className="absolute top-2 right-2 z-30 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
              보류
            </div>
          )}

          {/* 플레이어 픽 표시 */}
          {chef.isPlayerPick && !isEliminated && !isPending && (
            <div className="absolute top-2 right-2 z-30 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-bold">
              ⭐ 픽
            </div>
          )}

          {/* Texture */}
          <div
            className={cn(
              "absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay",
              isBlack
                ? `bg-[url('${
                    import.meta.env.BASE_URL
                  }paper-texture.png')] bg-repeat`
                : `bg-[url('${
                    import.meta.env.BASE_URL
                  }marble-texture.png')] bg-cover`
            )}
          />

          {/* Image Section */}
          <div
            className={cn(
              "relative overflow-hidden",
              layout === "horizontal" ? "w-1/3 h-full" : "w-full aspect-[4/3]"
            )}
          >
            <img
              src={chef.image || placeholderImage}
              alt={isBlack ? chef.nickname : chef.name}
              className="w-full h-full object-cover"
            />
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
                isBlack ? "from-spoon-black-bg" : "from-spoon-white-bg"
              )}
            />
            <div className="absolute top-3 left-3">
              <Badge
                variant={isBlack ? "black" : "white"}
                className="uppercase tracking-widest text-[10px] px-2 py-1"
              >
                {isBlack ? "Black" : "White"}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div
            className={cn(
              "relative z-10 p-4 flex flex-col justify-center gap-1",
              layout === "horizontal" ? "w-2/3 pl-2 py-2" : "w-full"
            )}
          >
            <h3
              className={cn(
                "font-bold leading-tight break-keep",
                layout === "horizontal"
                  ? "text-base line-clamp-1 mb-1"
                  : "text-lg min-h-[4.2rem] line-clamp-3",
                isBlack
                  ? "text-spoon-black-text font-sans tracking-tight"
                  : "text-spoon-white-text font-serif italic"
              )}
            >
              {isBlack ? chef.nickname : chef.name}
            </h3>

            {/* 전문분야 표시 */}
            {chef.specialties && chef.specialties.length > 0 && (
              <p
                className={cn(
                  "text-xs opacity-70 truncate",
                  layout === "horizontal" ? "text-[10px]" : "mb-1"
                )}
              >
                {chef.specialties.map((s) => CUISINE_LABELS[s]).join(" · ")}
              </p>
            )}

            <div
              className={cn(
                "flex flex-col gap-0.5",
                !isBlack &&
                  layout !== "horizontal" &&
                  "pt-2 border-t border-spoon-white-border/30",
                layout === "horizontal" && "text-[10px]"
              )}
            >
              {/* Horizontal Layout: Always show stats (masked if needed) */}
              {layout === "horizontal" ? (
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  <StatMinimal
                    label="맛"
                    value={chef.stats.taste}
                    isBlack={isBlack}
                    mask={maskStats || !chef.revealedStats?.includes("taste")}
                  />
                  <StatMinimal
                    label="창의"
                    value={chef.stats.creativity}
                    isBlack={isBlack}
                    mask={
                      maskStats || !chef.revealedStats?.includes("creativity")
                    }
                  />
                  <StatMinimal
                    label="숙련"
                    value={chef.stats.proficiency}
                    isBlack={isBlack}
                    mask={
                      maskStats || !chef.revealedStats?.includes("proficiency")
                    }
                  />
                  <StatMinimal
                    label="멘탈"
                    value={chef.stats.mental}
                    isBlack={isBlack}
                    mask={maskStats || !chef.revealedStats?.includes("mental")}
                  />
                  <StatMinimal
                    label="속도"
                    value={chef.stats.speed}
                    isBlack={isBlack}
                    mask={maskStats || !chef.revealedStats?.includes("speed")}
                  />
                </div>
              ) : (
                /* Vertical Layout: Always show full stats */
                <>
                  <StatRow
                    label="맛"
                    value={chef.stats.taste}
                    isBlack={isBlack}
                    mask={maskStats || !chef.revealedStats?.includes("taste")}
                  />
                  <StatRow
                    label="창의력"
                    value={chef.stats.creativity}
                    isBlack={isBlack}
                    mask={
                      maskStats || !chef.revealedStats?.includes("creativity")
                    }
                  />
                  <StatRow
                    label="숙련도"
                    value={chef.stats.proficiency}
                    isBlack={isBlack}
                    mask={
                      maskStats || !chef.revealedStats?.includes("proficiency")
                    }
                  />
                  <StatRow
                    label="멘탈"
                    value={chef.stats.mental}
                    isBlack={isBlack}
                    mask={maskStats || !chef.revealedStats?.includes("mental")}
                  />
                  <StatRow
                    label="속도"
                    value={chef.stats.speed}
                    isBlack={isBlack}
                    mask={maskStats || !chef.revealedStats?.includes("speed")}
                  />
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const StatRow = ({
  label,
  value,
  isBlack,
  mask,
}: {
  label: string;
  value: number;
  isBlack: boolean;
  mask?: boolean;
}) => (
  <div className="flex justify-between items-center text-xs opacity-80">
    <span
      className={isBlack ? "text-spoon-black-text" : "text-spoon-white-text"}
    >
      {label}
    </span>
    <span
      className={cn(
        "font-mono font-medium",
        isBlack ? "text-spoon-black-accent" : "text-spoon-white-accent",
        mask && "opacity-30 text-gray-500" // 가려진 스탯은 어둡게 처리
      )}
    >
      {mask ? "??" : value}
    </span>
  </div>
);

const StatMinimal = ({
  label,
  value,
  isBlack,
  mask,
}: {
  label: string;
  value: number;
  isBlack: boolean;
  mask?: boolean;
}) => (
  <div className="flex justify-between items-center opacity-80">
    <span
      className={cn(
        isBlack ? "text-spoon-black-text" : "text-spoon-white-text",
        "opacity-70"
      )}
    >
      {label}
    </span>
    <span
      className={cn(
        "font-mono font-bold",
        isBlack ? "text-spoon-black-accent" : "text-spoon-white-accent",
        mask && "opacity-30 text-gray-500" // 가려진 스탯은 어둡게 처리
      )}
    >
      {mask ? "??" : value}
    </span>
  </div>
);
