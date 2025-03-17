import { useState } from 'react';
import { Donor } from '@/app/lib/donorService';

interface DonorFormProps {
  donor?: Donor;
  onSubmit: (donor: Omit<Donor, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  onCancel: () => void;
}

export default function DonorForm({ donor, onSubmit, onCancel }: DonorFormProps) {
  const [formData, setFormData] = useState({
    name: donor?.name || '',
    email: donor?.email || '',
    last_donation: donor?.last_donation || new Date().toISOString().split('T')[0],
    amount: donor?.amount || 0,
    engagement: donor?.engagement || 0,
    last_contact: donor?.last_contact || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="last_donation" className="block text-sm font-medium text-gray-700">
          Last Donation Date
        </label>
        <input
          type="date"
          id="last_donation"
          value={formData.last_donation}
          onChange={(e) => setFormData({ ...formData, last_donation: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Donation Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label htmlFor="engagement" className="block text-sm font-medium text-gray-700">
          Engagement Level (0-100)
        </label>
        <input
          type="number"
          id="engagement"
          value={formData.engagement}
          onChange={(e) => setFormData({ ...formData, engagement: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
          min="0"
          max="100"
        />
      </div>

      <div>
        <label htmlFor="last_contact" className="block text-sm font-medium text-gray-700">
          Last Contact Date
        </label>
        <input
          type="date"
          id="last_contact"
          value={formData.last_contact}
          onChange={(e) => setFormData({ ...formData, last_contact: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {donor ? 'Update' : 'Add'} Donor
        </button>
      </div>
    </form>
  );
} 