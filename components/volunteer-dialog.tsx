import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { XIcon } from 'lucide-react';
import type { Volunteer } from '@/app/lib/types';

interface VolunteerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Volunteer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  volunteer?: Volunteer | null;
}

export function VolunteerDialog({ isOpen, onClose, onSubmit, volunteer }: VolunteerDialogProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'pending' as Volunteer['status'],
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
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'pending',
        skills: [],
        interests: [],
        availability: {
          weekdays: false,
          weekends: false,
          hours: ''
        },
        total_hours: 0
      });
    }
  }, [volunteer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSkillsChange = (value: string) => {
    const skills = value.split(',').map(skill => skill.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      skills
    }));
  };

  const handleInterestsChange = (value: string) => {
    const interests = value.split(',').map(interest => interest.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      interests
    }));
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const removeInterest = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-xl rounded-lg">
        <DialogHeader className="border-b pb-4 sticky top-0 bg-white z-10">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            {volunteer ? 'Edit Volunteer' : 'Add New Volunteer'}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {volunteer ? 'Update volunteer information below.' : 'Fill in the volunteer information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-gray-700 font-medium">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Enter first name"
                required
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-gray-700 font-medium">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter last name"
                required
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                required
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-gray-700 font-medium">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Volunteer['status'] }))}
            >
              <SelectTrigger className="w-full border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="pending" className="cursor-pointer hover:bg-gray-50">Pending</SelectItem>
                <SelectItem value="active" className="cursor-pointer hover:bg-gray-50">Active</SelectItem>
                <SelectItem value="inactive" className="cursor-pointer hover:bg-gray-50">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills" className="text-gray-700 font-medium">Skills</Label>
            <Input
              id="skills"
              value={formData.skills.join(', ')}
              onChange={(e) => handleSkillsChange(e.target.value)}
              placeholder="Enter skills (comma-separated)"
              required
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            />
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests" className="text-gray-700 font-medium">Interests</Label>
            <Input
              id="interests"
              value={formData.interests.join(', ')}
              onChange={(e) => handleInterestsChange(e.target.value)}
              placeholder="Enter interests (comma-separated)"
              required
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            />
            {formData.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100">
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <Label className="text-gray-700 font-medium">Availability</Label>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="weekdays"
                  checked={formData.availability.weekdays}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    availability: { ...prev.availability, weekdays: checked }
                  }))}
                />
                <Label htmlFor="weekdays" className="text-gray-700">Available on Weekdays</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="weekends"
                  checked={formData.availability.weekends}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    availability: { ...prev.availability, weekends: checked }
                  }))}
                />
                <Label htmlFor="weekends" className="text-gray-700">Available on Weekends</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours" className="text-gray-700">Preferred Hours</Label>
                <Input
                  id="hours"
                  value={formData.availability.hours}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    availability: { ...prev.availability, hours: e.target.value }
                  }))}
                  placeholder="e.g., 9 AM - 5 PM"
                  required
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 sticky bottom-0 bg-white z-10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-w-[100px] border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button type="submit" className="min-w-[100px] bg-purple-600 hover:bg-purple-700 text-white">
              {volunteer ? 'Update' : 'Add'} Volunteer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 