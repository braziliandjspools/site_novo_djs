const KEY_HUES: Record<string, number> = {
  "1A": 330,
  "1B": 340,
  "2A": 280,
  "2B": 270,
  "3A": 200,
  "3B": 190,
  "4A": 48,
  "4B": 42,
  "5A": 25,
  "5B": 18,
  "6A": 160,
  "6B": 150,
  "7A": 120,
  "7B": 110,
  "8A": 85,
  "8B": 75,
  "9A": 175,
  "9B": 185,
  "10A": 210,
  "10B": 220,
  "11A": 255,
  "11B": 245,
  "12A": 300,
  "12B": 310,
};

function hueForKey(value: string) {
  const normalized = value.trim().toUpperCase();
  if (KEY_HUES[normalized] != null) return KEY_HUES[normalized];
  return [...normalized].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
}

export function MusicalKeyBadge({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-zinc-600">—</span>;
  }
  const hue = hueForKey(value);
  return (
    <span
      className="inline-flex min-w-[2rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
      style={{
        backgroundColor: `hsl(${hue} 72% 82%)`,
        color: `hsl(${hue} 45% 22%)`,
      }}
    >
      {value}
    </span>
  );
}
