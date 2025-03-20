import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Volunteer } from '@/lib/types';

interface VolunteerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Volunteer, 'id' | 'created_at'>) => void;
  volunteer?: Volunteer | null;
}

export function VolunteerDialog({ isOpen, onClose, onSubmit, volunteer }: VolunteerDialogProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'pending',
    skills: [] as string[],
    interests: [] as string[],
    availability: {
      weekdays: false,
      weekends: false,
      hours: ''
    },
    total_hours: 0
  });

  useEffect(() => {
    if (volunteer) {
      setFormData({
        first_name: volunteer.first_name,
        last_name: volunteer.last_name,
        email: volunteer.email,
        phone: volunteer.phone,
        status: volunteer.status,
        skills: volunteer.skills,
        interests: volunteer.interests,
        availability: volunteer.availability,
        total_hours: volunteer.total_hours
      });
    }
  }, [volunteer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSkillsChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: value.split(',').map(skill => skill.trim()).filter(Boolean)
    }));
  };

  const handleInterestsChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      interests: value.split(',').map(interest => interest.trim()).filter(Boolean)
    }));
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {volunteer ? 'Edit Volunteer' : 'Add New Volunteer'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Textarea
                  id="skills"
                  value={formData.skills.join(', ')}
                  onChange={(e) => handleSkillsChange(e.target.value)}
                  placeholder="e.g. teaching, mentoring, web development"
                />
              </div>

              <div>
                <Label htmlFor="interests">Interests (comma-separated)</Label>
                <Textarea
                  id="interests"
                  value={formData.interests.join(', ')}
                  onChange={(e) => handleInterestsChange(e.target.value)}
                  placeholder="e.g. education, environment, healthcare"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Availability</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekdays">Weekdays</Label>
                  <Switch
                    id="weekdays"
                    checked={formData.availability.weekdays}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      availability: { ...prev.availability, weekdays: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekends">Weekends</Label>
                  <Switch
                    id="weekends"
                    checked={formData.availability.weekends}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      availability: { ...prev.availability, weekends: checked }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hours">Preferred Hours</Label>
                  <Input
                    id="hours"
                    value={formData.availability.hours}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      availability: { ...prev.availability, hours: e.target.value }
                    }))}
                    placeholder="e.g. 9 AM - 5 PM"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {volunteer ? 'Update' : 'Add'} Volunteer
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 