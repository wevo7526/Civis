import { DocumentTextIcon, PencilIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface SavedItemCardProps {
  item: {
    id: string;
    title?: string;
    content: string;
    status?: string;
    created_at: string;
    type: 'grant' | 'fundraising' | 'insights';
  };
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export default function SavedItemCard({ item, onEdit, onDelete }: SavedItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([item.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title || item.type || 'document'}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDelete = () => {
    const itemToDelete = {
      ...item,
      type: item.type || 'grant'
    };
    onDelete(itemToDelete);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
          {item.title || (item.type === 'insights' ? 'Project Insights' : 'Untitled Document')}
        </h4>
        {item.status && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            item.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
            item.status === 'approved' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Created on {new Date(item.created_at).toLocaleDateString()}
      </p>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(item)}
          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        >
          <PencilIcon className="h-3 w-3 mr-1" />
          Edit
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
          Download
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
        >
          <TrashIcon className="h-3 w-3 mr-1" />
          Delete
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Item</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this {item.type === 'insights' ? 'insight' : 'document'}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 