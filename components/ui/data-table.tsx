import { useState } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface Column {
  header: string;
  accessorKey?: string;
  accessorFn?: (row: any) => string;
  cell?: (props: { row: { original: any } }) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    const column = columns.find(col => 
      col.accessorKey === sortConfig.key || 
      (col.accessorFn && sortConfig.key === col.header)
    );

    if (!column) return 0;

    let aValue: any;
    let bValue: any;

    if (column.accessorFn) {
      aValue = column.accessorFn(a);
      bValue = column.accessorFn(b);
    } else if (column.accessorKey) {
      aValue = (a as any)[column.accessorKey];
      bValue = (b as any)[column.accessorKey];
    } else {
      return 0;
    }

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const modifier = sortConfig.direction === 'asc' ? 1 : -1;
    return aValue < bValue ? -1 * modifier : 1 * modifier;
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                onClick={() => column.accessorKey && handleSort(column.accessorKey)}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.accessorKey ? 'cursor-pointer hover:text-gray-900' : ''
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.accessorKey && sortConfig?.key === column.accessorKey && (
                    <span className="inline-block w-4 h-4">
                      {sortConfig.direction === 'asc' ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row, rowIndex) => (
            <tr
              key={row.id}
              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.cell ? (
                    column.cell({ row: { original: row } })
                  ) : column.accessorFn ? (
                    column.accessorFn(row)
                  ) : column.accessorKey ? (
                    (row as any)[column.accessorKey]
                  ) : null}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(row)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(row.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 