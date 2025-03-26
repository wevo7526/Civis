import { useState } from 'react';
import { Donor } from '@/app/lib/types';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { cn } from '@/app/lib/utils';

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
    status: donor?.status || 'active',
    total_given: donor?.total_given || 0,
    last_gift_date: donor?.last_gift_date || '',
    last_gift_amount: donor?.last_gift_amount || 0,
    preferred_communication: donor?.preferred_communication || 'email',
    notes: donor?.notes || '',
    user_id: donor?.user_id || '',
    donation_date: donor?.donation_date || new Date().toISOString().split('T')[0],
    amount: donor?.amount || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as Donor['status'] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            type="number"
            id="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_gift_amount">Last Gift Amount</Label>
          <Input
            type="number"
            id="last_gift_amount"
            value={formData.last_gift_amount}
            onChange={(e) => setFormData({ ...formData, last_gift_amount: Number(e.target.value) })}
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_gift_date">Last Gift Date</Label>
          <Input
            type="date"
            id="last_gift_date"
            value={formData.last_gift_date}
            onChange={(e) => setFormData({ ...formData, last_gift_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="donation_date">Donation Date</Label>
          <Input
            type="date"
            id="donation_date"
            value={formData.donation_date}
            onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred_communication">Preferred Communication</Label>
          <Select
            value={formData.preferred_communication}
            onValueChange={(value) => setFormData({ ...formData, preferred_communication: value as Donor['preferred_communication'] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select preferred communication" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="mail">Mail</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit">
          {donor ? 'Update' : 'Create'} Donor
        </Button>
      </div>
    </form>
  );
} 