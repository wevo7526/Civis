import { Donor } from '@/app/lib/types';
import { UserCircleIcon, PencilIcon, ChartBarIcon, EnvelopeIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DonorCardProps {
  donor: Donor;
  onEdit: (donor: Donor) => void;
  onGenerateMessage: (donor: Donor) => void;
  onAnalyze: (donor: Donor) => void;
  onDelete: (id: string) => void;
  generatingMessage: boolean;
}

export default function DonorCard({
  donor,
  onEdit,
  onGenerateMessage,
  onAnalyze,
  onDelete,
  generatingMessage
}: DonorCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="h-10 w-10 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">{donor.name}</h3>
            <p className="text-sm text-gray-500">{donor.email}</p>
            {donor.phone && <p className="text-sm text-gray-500">{donor.phone}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(donor)}
            className="p-2 text-gray-400 hover:text-gray-500"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onGenerateMessage(donor)}
            disabled={generatingMessage}
            className="p-2 text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <EnvelopeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onAnalyze(donor)}
            className="p-2 text-gray-400 hover:text-gray-500"
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(donor.id)}
            className="p-2 text-gray-400 hover:text-red-500"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Status</p>
          <p className="mt-1 text-sm text-gray-900">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              donor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {donor.status}
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Donation Amount</p>
          <p className="mt-1 text-sm text-gray-900">${donor.amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Last Donation</p>
          <p className="mt-1 text-sm text-gray-900">
            {donor.last_donation ? new Date(donor.last_donation).toLocaleDateString() : 'Never'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Engagement</p>
          <p className="mt-1 text-sm text-gray-900">{donor.engagement || 0}%</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Last Contact</p>
          <p className="mt-1 text-sm text-gray-900">
            {donor.last_contact ? new Date(donor.last_contact).toLocaleDateString() : 'Never'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Donation Date</p>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(donor.donation_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {donor.notes && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500">Notes</p>
          <p className="mt-1 text-sm text-gray-900">{donor.notes}</p>
        </div>
      )}
    </div>
  );
} 