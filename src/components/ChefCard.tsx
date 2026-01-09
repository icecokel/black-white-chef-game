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
  const placeholderImage = "/chef-placeholder.png";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        "relative w-full rounded-xl overflow-hidden cursor-pointer group shadow-xl",
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

      {/* Image Section */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={chef.image || placeholderImage}
          alt={isBlack ? chef.nickname : chef.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for smooth transition to content */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
            isBlack ? "from-spoon-black-bg" : "from-spoon-white-bg"
          )}
        />
        {/* Badge on image */}
        <div className="absolute top-3 left-3">
          <Badge
            variant={isBlack ? "black" : "white"}
            className="uppercase tracking-widest text-[10px] px-2 py-1"
          >
            {isBlack ? "Black Spoon" : "White Spoon"}
          </Badge>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-4 flex flex-col gap-2">
        {/* Name - 흑수저는 별명, 백수저는 실명 표시 */}
        <h3
          className={cn(
            "text-lg font-bold leading-tight break-keep",
            isBlack
              ? "text-spoon-black-text font-sans tracking-tight"
              : "text-spoon-white-text font-serif italic"
          )}
        >
          {isBlack ? chef.nickname : chef.name}
        </h3>

        {/* Stats - Only for White Spoons */}
        {!isBlack && (
          <div
            className={cn(
              "pt-2 border-t flex flex-col gap-0.5",
              "border-spoon-white-border/30"
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
            <StatRow label="멘탈" value={chef.stats.mental} isBlack={isBlack} />
            <StatRow label="속도" value={chef.stats.speed} isBlack={isBlack} />
          </div>
        )}

        {/* Black Spoon Placeholder */}
        {isBlack && (
          <div className="pt-2 border-t border-spoon-black-border/30 opacity-50 text-xs text-center font-mono">
            ???
          </div>
        )}
      </div>

      {/* Hover Shimmer */}
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
