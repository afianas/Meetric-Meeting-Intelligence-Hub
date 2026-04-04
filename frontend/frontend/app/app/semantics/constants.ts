export const EMOTIONS = ["agreement", "concern", "conflict", "uncertainty", "neutral"];

export const EMOTION_COLORS: Record<string, string> = {
  agreement: "#15803d",
  conflict: "#b91c1c",
  concern: "#d97706",
  uncertainty: "#7c3aed",
  neutral: "#64748b"
};

export const EMOTION_WEIGHTS: Record<string, number> = {
  agreement: 10,
  conflict: -10,
  concern: -5,
  uncertainty: 5,
  neutral: 0
};

export const SPEAKER_PALETTE = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"
];

export const DEFAULT_EMOTION_COLOR = "#94a3b8";

export function getEmotionColor(emotion: string | undefined): string {
  if (!emotion) return DEFAULT_EMOTION_COLOR;
  return EMOTION_COLORS[emotion.toLowerCase()] || DEFAULT_EMOTION_COLOR;
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return `rgba(148, 163, 184, ${alpha})`; // fallback to DEFAULT_EMOTION_COLOR rgb
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getEmotionBg(emotion: string | undefined, alpha: number = 0.15): string {
  return hexToRgba(getEmotionColor(emotion), alpha);
}

export function getEmotionWeight(emotion: string | undefined): number {
  if (!emotion) return EMOTION_WEIGHTS["neutral"];
  return EMOTION_WEIGHTS[emotion.toLowerCase()] ?? EMOTION_WEIGHTS["neutral"];
}
