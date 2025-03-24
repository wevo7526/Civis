import { useState } from 'react';
import { Donor } from '@/lib/types';

interface DonorFormProps {
  donor?: Donor;
  onSubmit: (data: Omit<Donor, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export function DonorForm({ donor, onSubmit, onCancel }: DonorFormProps) {
  const [formData, setFormData] = useState<Omit<Donor, 'id' | 'created_at' | 'updated_at'>>({
    name: donor?.name || '',
    email: donor?.email || '',
    phone: donor?.phone || '',
    type: donor?.type || 'individual',
    status: donor?.status || 'active',
    amount: donor?.amount || 0,
    giving_history: donor?.giving_history || [],
    total_given: donor?.total_given || 0,
    last_gift_date: donor?.last_gift_date || new Date().toISOString().split('T')[0],
    last_gift_amount: donor?.last_gift_amount || 0,
    preferred_communication: donor?.preferred_communication || 'email',
    notes: donor?.notes || '',
    last_donation: donor?.last_donation || '',
    donation_date: donor?.donation_date || '',
    last_contact: donor?.last_contact || '',
    engagement: donor?.engagement || 0,
    user_id: donor?.user_id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as Donor['type'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          required
        >
          <option value="individual">Individual</option>
          <option value="corporate">Corporate</option>
          <option value="foundation">Foundation</option>
          <option value="government">Government</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as Donor['status'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          required
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          type="number"
          id="amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          required
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label htmlFor="preferred_communication" className="block text-sm font-medium text-gray-700">
          Preferred Communication
        </label>
        <select
          id="preferred_communication"
          value={formData.preferred_communication}
          onChange={(e) => setFormData({ ...formData, preferred_communication: e.target.value as Donor['preferred_communication'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          required
        >
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="mail">Mail</option>
          <option value="any">Any</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          rows={3}
          required
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          {donor ? 'Update' : 'Create'} Donor
        </button>
      </div>
    </form>
  );
} 