import { Donor } from '@/lib/types';
import { UserCircleIcon, PencilIcon, ChartBarIcon, EnvelopeIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DonorCardProps {
  donor: Donor;
  onEdit: (donor: Donor) => void;
  onGenerateMessage: (donor: Donor) => void;
  onAnalyze: (donor: Donor) => void;
  onDelete: (id: string) => void;
  generatingMessage: boolean;
}

export function DonorCard({ donor, onEdit, onGenerateMessage, onAnalyze, onDelete, generatingMessage }: DonorCardProps) {
  const fullName = `${donor.first_name} ${donor.last_name}`.trim();
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="h-10 w-10 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">{fullName}</h3>
            <p className="text-sm text-gray-500">{donor.email}</p>
            {donor.phone && <p className="text-sm text-gray-500">{donor.phone}</p>}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(donor)}
            className="p-1 text-gray-400 hover:text-gray-500"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onGenerateMessage(donor)}
            disabled={generatingMessage}
            className="p-1 text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <EnvelopeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onAnalyze(donor)}
            className="p-1 text-gray-400 hover:text-gray-500"
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(donor.id)}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Given</p>
            <p className="font-medium">${donor.total_given.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Last Gift</p>
            <p className="font-medium">${donor.last_gift_amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Last Gift Date</p>
            <p className="font-medium">{new Date(donor.last_gift_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Preferred Contact</p>
            <p className="font-medium capitalize">{donor.preferred_communication}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 