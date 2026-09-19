import { useState, type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  numeric?: boolean;
  value: (row: T) => number | string | null;
  render?: (row: T) => ReactNode;
  wrap?: boolean;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  initialSort: { key: string; dir: 1 | -1 };
  sortable?: boolean;
  footer?: ReactNode;
  rowClassName?: (row: T) => string;
  locale: string;
}

export default function SortableTable<T>({ rows, columns, rowKey, initialSort, sortable = true, footer, rowClassName, locale }: Props<T>) {
  const [sort, setSort] = useState(initialSort);
  const column = columns.find((c) => c.key === sort.key) ?? columns[0];

  const sorted = [...rows].sort((a, b) => {
    const av = column.value(a);
    const bv = column.value(b);
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), locale);
    return cmp * sort.dir;
  });

  const sortBy = (c: Column<T>) =>
    setSort((s) => (s.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: c.numeric ? -1 : 1 }));

  const cell = 'px-2 py-1.5 border-b border-slate-200 dark:border-slate-700';

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse whitespace-nowrap text-sm">
        <thead>
          <tr>
            {columns.map((c) => {
              const active = c.key === sort.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                  className={`${cell} font-semibold text-brand dark:text-slate-100 ${c.numeric ? 'text-right' : 'text-left'}`}
                >
                  {sortable ? (
                    <button type="button" onClick={() => sortBy(c)} className="cursor-pointer font-semibold hover:underline">
                      {c.label}
                      {active && <span aria-hidden="true">{sort.dir === 1 ? ' ▲' : ' ▼'}</span>}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={rowKey(row)} className={rowClassName?.(row) ?? ''}>
              {columns.map((c) => (
                <td key={c.key} className={`${cell} ${c.numeric ? 'text-right tabular-nums' : ''} ${c.wrap ? 'min-w-48 whitespace-normal text-slate-600 dark:text-slate-300' : ''}`}>
                  {c.render ? c.render(row) : (c.value(row) ?? '–')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="font-semibold [&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left">{footer}</tfoot>}
      </table>
    </div>
  );
}
