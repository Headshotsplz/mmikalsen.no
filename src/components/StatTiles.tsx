export interface Tile {
  value: string;
  label: string;
  sub?: string;
}

export default function StatTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-800">
          <span className="block text-2xl font-bold leading-tight text-brand dark:text-white">{tile.value}</span>
          <span className="text-xs text-slate-600 dark:text-slate-300">{tile.label}</span>
          {tile.sub && <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{tile.sub}</span>}
        </div>
      ))}
    </div>
  );
}
