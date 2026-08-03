// Palette portee telle quelle depuis app_template.html (memes valeurs, meme
// algorithme de hash pour la couleur d'un provider sans logo).

export const CATEGORICAL = [
  "#2a78d6", "#eb6834", "#1baf7a", "#eda100",
  "#e87ba4", "#008300", "#4a3aa7", "#e34948",
];

export const SEQUENTIAL = [
  "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7",
  "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b",
];

export function providerColor(provider: string): string {
  let hash = 0;
  for (let i = 0; i < provider.length; i++) {
    hash = (hash * 31 + provider.charCodeAt(i)) >>> 0;
  }
  return CATEGORICAL[hash % CATEGORICAL.length];
}

/** level: 0..10 */
export function seqColor(level: number): string {
  const i = Math.round((level * (SEQUENTIAL.length - 1)) / 10);
  return SEQUENTIAL[Math.max(0, Math.min(SEQUENTIAL.length - 1, i))];
}

export function seqTextColor(level: number): string {
  return level >= 6 ? "#ffffff" : "#0b0b0b";
}
