import { useReminders } from './RemindersProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Repeat, AlertCircle } from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  category: 'task' | 'workflow' | 'notification';
  notification_sent: boolean;
  reminder_frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  reminder_count?: number;
  max_reminders?: number;
  workflow_id?: string;
}

export function RemindersPanel() {
  const { reminders, loading, error, markAsCompleted } = useReminders();

  const getPriorityColor = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Reminder['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return 'Overdue';
    } else if (days === 0) {
      return 'Due today';
    } else if (days === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${days} days`;
    }
  };

  const getReminderIcon = (reminder: Reminder) => {
    if (reminder.category === 'workflow') {
      return <Repeat className="h-4 w-4" />;
    } else if (reminder.status === 'overdue') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading reminders: {error.toString()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reminders.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          No reminders found
        </div>
      ) : (
        reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-start justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {getReminderIcon(reminder)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{reminder.title}</h3>
                  {reminder.category === 'workflow' && (
                    <Badge variant="outline" className="text-xs">
                      Workflow
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{reminder.description}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{formatDueDate(reminder.due_date)}</span>
                  {reminder.reminder_frequency && reminder.reminder_count && reminder.max_reminders && (
                    <span>
                      ({reminder.reminder_count}/{reminder.max_reminders} reminders)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getPriorityColor(reminder.priority)}>
                {reminder.priority}
              </Badge>
              <Badge className={getStatusColor(reminder.status)}>
                {reminder.status}
              </Badge>
              {reminder.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsCompleted(reminder.id)}
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
} 