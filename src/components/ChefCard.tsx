import { motion } from "framer-motion";
import type { Chef } from "@/types/chef";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface ChefCardProps {
  chef: Chef;
  isRevealed?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ChefCard = ({
  chef,
  // isRevealed = true, // Temporarily unused, but part of interface
  onClick,
  className,
}: ChefCardProps) => {
  const isBlack = chef.rank === "BLACK";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        "relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group shadow-xl",
        isBlack
          ? "bg-spoon-black-bg border border-spoon-black-border shadow-spoon-black-accent/10"
          : "bg-spoon-white-bg border border-spoon-white-border shadow-spoon-white-accent/10",
        className
      )}
    >
      {/* Texture / Background Effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay",
          isBlack
            ? "bg-[url('/paper-texture.png')] bg-repeat"
            : "bg-[url('/marble-texture.png')] bg-cover"
        )}
      />

      {/* Content Container */}
      <div className="relative z-10 h-full p-6 flex flex-col justify-between">
        {/* Header: Rank Badge */}
        <div className="flex justify-between items-start">
          <Badge
            variant={isBlack ? "black" : "white"}
            className="uppercase tracking-widest text-[10px] px-2 py-1"
          >
            {isBlack ? "Black Spoon" : "White Spoon"}
          </Badge>
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isBlack ? "bg-spoon-black-accent" : "bg-spoon-white-accent"
            )}
          />
        </div>

        {/* Main Info */}
        <div className="flex flex-col gap-2">
          {/* Name */}
          <h3
            className={cn(
              "text-2xl font-bold leading-tight break-keep",
              isBlack
                ? "text-spoon-black-text font-sans tracking-tight"
                : "text-spoon-white-text font-serif italic"
            )}
          >
            {chef.name}
          </h3>

          {/* Stats Preview (Top 3) */}
          <div
            className={cn(
              "mt-4 pt-4 border-t flex flex-col gap-1.5",
              isBlack
                ? "border-spoon-black-border/30"
                : "border-spoon-white-border/30"
            )}
          >
            <StatRow label="맛" value={chef.stats.taste} isBlack={isBlack} />
            <StatRow
              label="창의력"
              value={chef.stats.creativity}
              isBlack={isBlack}
            />
            <StatRow
              label="숙련도"
              value={chef.stats.proficiency}
              isBlack={isBlack}
            />
          </div>
        </div>
      </div>

      {/* Hover Shimmnmer */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"
        style={{ skewX: -20 }}
      />
    </motion.div>
  );
};

const StatRow = ({
  label,
  value,
  isBlack,
}: {
  label: string;
  value: number;
  isBlack: boolean;
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
        isBlack ? "text-spoon-black-accent" : "text-spoon-white-accent"
      )}
    >
      {value}
    </span>
  </div>
);
