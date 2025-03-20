import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SavedItemCardProps {
  item: {
    id: string;
    title: string;
    content: string;
    created_at: string;
  };
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export default function SavedItemCard({ item, onEdit, onDelete }: SavedItemCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="text-gray-500 hover:text-gray-700"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3 mb-2">{item.content}</p>
        <p className="text-xs text-gray-400">
          Created {new Date(item.created_at).toLocaleDateString()}
        </p>
      </div>
    </Card>
  )
} 