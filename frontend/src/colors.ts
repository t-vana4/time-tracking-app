const COLORS = [
  '#2c5f72', '#548ea6', '#f38c8d', '#f2b8a2', '#f3d2b3',                                                                                                                                   
  '#3a7a8c', '#7baabb', '#e8a0a0', '#f0c8b0', '#f5dcc5',         
];

export function buildColorMap(names: string[]): Record<string, string> {
  const sorted = [...names].sort();
  const map: Record<string, string> = {};
  sorted.forEach((name, i) => {
    map[name] = COLORS[i % COLORS.length];
  });
  return map;
}
