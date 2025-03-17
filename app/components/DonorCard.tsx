import { Donor } from '@/app/lib/donorService';
import { UserCircleIcon, PencilIcon, ChartBarIcon, EnvelopeIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DonorCardProps {
  donor: Donor;
  onEdit: (donor: Donor) => void;
  onGenerateMessage: (donor: Donor) => void;
  onAnalyze: (donor: Donor) => void;
  onDelete: (id: string) => void;
  generatingMessage: boolean;
}

const getEngagementLabel = (engagement: number): string => {
  if (engagement >= 80) return 'High';
  if (engagement >= 50) return 'Medium';
  return 'Low';
};

const getEngagementColor = (engagement: number): string => {
  if (engagement >= 80) return 'text-green-600 bg-green-100';
  if (engagement >= 50) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

export default function DonorCard({
  donor,
  onEdit,
  onGenerateMessage,
  onAnalyze,
  onDelete,
  generatingMessage
}: DonorCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserCircleIcon className="h-10 w-10 text-gray-400 mr-3" />
          <div>
            <h3 className="font-medium">{donor.name}</h3>
            <p className="text-sm text-gray-500">{donor.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(donor)}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => onGenerateMessage(donor)}
            disabled={generatingMessage}
            className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
          >
            <EnvelopeIcon className="h-4 w-4 mr-1" />
            {generatingMessage ? 'Generating...' : 'Message'}
          </button>
          <button
            onClick={() => onAnalyze(donor)}
            className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            <ChartBarIcon className="h-4 w-4 mr-1" />
            Analyze
          </button>
          <button
            onClick={() => onDelete(donor.id)}
            className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Last Donation:</span>
          <span className="ml-1">{new Date(donor.last_donation).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Amount:</span>
          <span className="ml-1">${donor.amount.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Engagement:</span>
          <span className={`ml-1 ${getEngagementColor(donor.engagement)}`}>
            {getEngagementLabel(donor.engagement)} ({donor.engagement}%)
          </span>
        </div>
      </div>
    </div>
  );
} 