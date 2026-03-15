import { useId } from "react";
import { ScoreFactors } from "@/components/score-factors";

interface ScoreFactor {
  name: string;
  impact: number;
  maxImpact: number;
  direction: "positive" | "negative" | "neutral";
  description: string;
  weight: number;
}

interface CreditScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  testId?: string;
  factors?: ScoreFactor[];
  showFactors?: boolean;
}

function getScoreColor(score: number): { main: string; mainDark: string; glow: string; label: string } {
  if (score >= 750) return { main: "hsl(142 55% 40%)", mainDark: "hsl(142 55% 50%)", glow: "hsl(142 55% 40% / 0.3)", label: "Excellent" };
  if (score >= 670) return { main: "hsl(175 55% 28%)", mainDark: "hsl(175 55% 40%)", glow: "hsl(175 55% 28% / 0.3)", label: "Good" };
  if (score >= 580) return { main: "hsl(43 80% 55%)", mainDark: "hsl(43 80% 60%)", glow: "hsl(43 80% 55% / 0.3)", label: "Fair" };
  if (score >= 450) return { main: "hsl(14 70% 50%)", mainDark: "hsl(14 70% 58%)", glow: "hsl(14 70% 50% / 0.3)", label: "Poor" };
  return { main: "hsl(0 72% 42%)", mainDark: "hsl(0 72% 52%)", glow: "hsl(0 72% 42% / 0.3)", label: "Very Poor" };
}

export function CreditScoreGauge({ score, size = 180, label, testId, factors, showFactors = false }: CreditScoreGaugeProps) {
  const uid = useId();
  const gradId = `gauge-grad-${uid}`;
  const glowId = `gauge-glow-${uid}`;
  const bgGradId = `gauge-bg-${uid}`;

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;

  const minScore = 300;
  const maxScore = 850;
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const progress = (clampedScore - minScore) / (maxScore - minScore);
  const scoreAngle = startAngle + totalAngle * progress;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (from: number, to: number, r: number) => {
    const x1 = cx + r * Math.cos(toRad(from));
    const y1 = cy + r * Math.sin(toRad(from));
    const x2 = cx + r * Math.cos(toRad(to));
    const y2 = cy + r * Math.sin(toRad(to));
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const scoreColor = getScoreColor(score);
  const mainColor = isDark ? scoreColor.mainDark : scoreColor.main;
  const { glow, label: scoreLabel } = scoreColor;
  const displayLabel = label || scoreLabel;
  const labelFill = isDark ? "hsl(200 10% 65%)" : "hsl(200 10% 46%)";
  const minMaxFill = isDark ? "hsl(200 10% 55%)" : "hsl(200 10% 46% / 0.5)";

  const tickCount = 6;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const val = minScore + ((maxScore - minScore) / (tickCount - 1)) * i;
    const angle = startAngle + totalAngle * ((val - minScore) / (maxScore - minScore));
    const outerR = radius + strokeWidth * 0.6;
    const innerR = radius - strokeWidth * 0.6;
    return {
      val: Math.round(val),
      x1: cx + outerR * Math.cos(toRad(angle)),
      y1: cy + outerR * Math.sin(toRad(angle)),
      x2: cx + innerR * Math.cos(toRad(angle)),
      y2: cy + innerR * Math.sin(toRad(angle)),
      labelX: cx + (radius + strokeWidth * 1.8) * Math.cos(toRad(angle)),
      labelY: cy + (radius + strokeWidth * 1.8) * Math.sin(toRad(angle)),
    };
  });

  return (
    <div className="flex flex-col items-center" data-testid={testId}>
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.92}`} role="img" aria-label={`Credit score: ${score}`}>
        <title>Credit Score: {score} - {displayLabel}</title>
        <defs>
          <linearGradient id={bgGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(200 10% 46% / 0.15)" />
            <stop offset="100%" stopColor="hsl(200 10% 46% / 0.08)" />
          </linearGradient>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={mainColor} />
            <stop offset="100%" stopColor={mainColor} stopOpacity="0.7" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={arcPath(startAngle, endAngle, radius)}
          fill="none"
          stroke={`url(#${bgGradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {progress > 0.005 && (
          <path
            d={arcPath(startAngle, scoreAngle, radius)}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            style={{
              transition: "d 1s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        )}

        {ticks.map((tick) => (
          <g key={tick.val}>
            <line
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="hsl(200 10% 46% / 0.2)"
              strokeWidth="1"
            />
          </g>
        ))}

        <text
          x={cx}
          y={cy - size * 0.06}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: size * 0.22,
            fontWeight: 800,
            fill: mainColor,
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + size * 0.1}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: size * 0.075,
            fontWeight: 600,
            fill: labelFill,
            fontFamily: "Inter, system-ui, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {displayLabel}
        </text>

        <text
          x={cx - radius * 0.7}
          y={cy + radius * 0.85}
          textAnchor="middle"
          style={{
            fontSize: size * 0.06,
            fill: minMaxFill,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {minScore}
        </text>
        <text
          x={cx + radius * 0.7}
          y={cy + radius * 0.85}
          textAnchor="middle"
          style={{
            fontSize: size * 0.06,
            fill: minMaxFill,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {maxScore}
        </text>
      </svg>
      {showFactors && factors && factors.length > 0 && (
        <div className="mt-4 w-full max-w-sm">
          <ScoreFactors factors={factors} compact />
        </div>
      )}
    </div>
  );
}
