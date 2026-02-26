const COLORS = [
  '#0f3b4c', '#17505f', '#207d93', '#2a9baa', '#3dbfc4',
  '#6dcfcf', '#8ad8d8', '#a8e4e0', '#c4eee8', '#daf5f0',
];

export function buildColorMap(names: string[]): Record<string, string> {
  const sorted = [...names].sort();
  const map: Record<string, string> = {};
  sorted.forEach((name, i) => {
    map[name] = COLORS[i % COLORS.length];
  });
  return map;
}
