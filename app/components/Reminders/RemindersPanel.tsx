import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';

interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'cancelled';
  category: 'grant' | 'donor' | 'report' | 'task' | 'general';
  related_id?: string;
  related_type?: string;
  notification_sent: boolean;
  reminder_frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  reminder_count: number;
  max_reminders: number;
}

interface RemindersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: Reminder['category'];
  relatedId?: string;
  relatedType?: string;
}

export function RemindersPanel({
  isOpen,
  onClose,
  initialCategory = 'general',
  relatedId,
  relatedType,
}: RemindersPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewReminderModal, setShowNewReminderModal] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    category: initialCategory,
    related_id: relatedId,
    related_type: relatedType,
    reminder_frequency: 'once',
    max_reminders: 3,
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (isOpen) {
      fetchReminders();
    }
  }, [isOpen]);

  const fetchReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (initialCategory !== 'general') {
        query = query.eq('category', initialCategory);
      }

      if (relatedId) {
        query = query.eq('related_id', relatedId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reminders')
        .insert({
          ...newReminder,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setReminders(prev => [...prev, data]);
      setShowNewReminderModal(false);
      setNewReminder({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        category: initialCategory,
        related_id: relatedId,
        related_type: relatedType,
        reminder_frequency: 'once',
        max_reminders: 3,
      });
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const handleUpdateStatus = async (reminderId: string, newStatus: Reminder['status']) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ status: newStatus })
        .eq('id', reminderId);

      if (error) throw error;

      setReminders(prev =>
        prev.map(reminder =>
          reminder.id === reminderId
            ? { ...reminder, status: newStatus }
            : reminder
        )
      );
    } catch (error) {
      console.error('Error updating reminder status:', error);
    }
  };

  const getPriorityColor = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: Reminder['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Reminders</h2>
          <Button
            onClick={() => setShowNewReminderModal(true)}
            className="text-sm"
          >
            New Reminder
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {reminders.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No reminders found
          </div>
        ) : (
          reminders.map((reminder) => (
            <div key={reminder.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(reminder.status)}
                    <h3 className="text-sm font-medium text-gray-900">
                      {reminder.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {reminder.description}
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Due: {new Date(reminder.due_date).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-full ${getPriorityColor(reminder.priority)}`}>
                      {reminder.priority}
                    </span>
                    {reminder.notification_sent && (
                      <span className="flex items-center text-blue-500">
                        <BellIcon className="h-4 w-4 mr-1" />
                        Notified
                      </span>
                    )}
                  </div>
                </div>
                {reminder.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(reminder.id, 'completed')}
                    >
                      Complete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(reminder.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={showNewReminderModal}
        onClose={() => setShowNewReminderModal(false)}
        title="Create New Reminder"
      >
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newReminder.description}
              onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={newReminder.due_date}
              onChange={(e) => setNewReminder({ ...newReminder, due_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={newReminder.priority}
              onValueChange={(value) => setNewReminder({ ...newReminder, priority: value as Reminder['priority'] })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder_frequency">Reminder Frequency</Label>
            <Select
              value={newReminder.reminder_frequency}
              onValueChange={(value) => setNewReminder({ ...newReminder, reminder_frequency: value as Reminder['reminder_frequency'] })}
            >
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewReminderModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 