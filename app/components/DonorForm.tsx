import { useState } from 'react';
import { Donor } from '@/lib/types';
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
    first_name: donor?.first_name || '',
    last_name: donor?.last_name || '',
    email: donor?.email || '',
    phone: donor?.phone || '',
    address: donor?.address || '',
    city: donor?.city || '',
    state: donor?.state || '',
    zip_code: donor?.zip_code || '',
    total_given: donor?.total_given || 0,
    last_gift_date: donor?.last_gift_date || new Date().toISOString().split('T')[0],
    last_gift_amount: donor?.last_gift_amount || 0,
    preferred_communication: donor?.preferred_communication || 'email',
    frequency: donor?.frequency || 'one-time',
    recurring: donor?.recurring || false,
    payment_method: donor?.payment_method || 'online',
    interaction_count: donor?.interaction_count || 0,
    user_id: donor?.user_id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="total_given">Total Given</Label>
          <Input
            id="total_given"
            type="number"
            min="0"
            step="0.01"
            value={formData.total_given}
            onChange={(e) => setFormData({ ...formData, total_given: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="last_gift_amount">Last Gift Amount</Label>
          <Input
            id="last_gift_amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.last_gift_amount}
            onChange={(e) => setFormData({ ...formData, last_gift_amount: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="last_gift_date">Last Gift Date</Label>
        <Input
          id="last_gift_date"
          type="date"
          value={formData.last_gift_date}
          onChange={(e) => setFormData({ ...formData, last_gift_date: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="preferred_communication">Preferred Communication</Label>
        <Select
          value={formData.preferred_communication}
          onValueChange={(value: 'email' | 'phone' | 'mail') => 
            setFormData({ ...formData, preferred_communication: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select communication preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="mail">Mail</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="frequency">Giving Frequency</Label>
        <Select
          value={formData.frequency}
          onValueChange={(value: 'monthly' | 'quarterly' | 'annual' | 'one-time') => 
            setFormData({ ...formData, frequency: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
            <SelectItem value="one-time">One-time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="payment_method">Payment Method</Label>
        <Select
          value={formData.payment_method}
          onValueChange={(value: 'online' | 'check' | 'cash') => 
            setFormData({ ...formData, payment_method: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="recurring"
          checked={formData.recurring}
          onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="recurring">Recurring Donor</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {donor ? 'Update Donor' : 'Add Donor'}
        </Button>
      </div>
    </form>
  );
} 