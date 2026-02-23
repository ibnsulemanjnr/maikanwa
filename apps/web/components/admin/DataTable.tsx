// apps/web/components/admin/DataTable.tsx
import { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;

  // NEW (optional)
  loading?: boolean;
  emptyText?: string;
  getRowKey?: (item: T, index: number) => string;
}

function defaultCellValue(v: any) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  // for objects/arrays: avoid [object Object]
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyText = "No data available",
  getRowKey,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={[
                  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                  column.headerClassName ?? "",
                ].join(" ")}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-[#E5E7EB]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const key = getRowKey
                ? getRowKey(item, index)
                : item?.id
                  ? String(item.id)
                  : String(index);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? "cursor-pointer hover:bg-[#FAFAFA]" : ""}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={[
                        "px-6 py-4 whitespace-nowrap text-sm text-[#111827]",
                        column.className ?? "",
                      ].join(" ")}
                    >
                      {column.render
                        ? column.render(item)
                        : defaultCellValue(item[column.key as keyof T])}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
