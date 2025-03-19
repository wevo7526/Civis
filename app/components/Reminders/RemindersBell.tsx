import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useReminders } from './RemindersProvider';
import { RemindersPanel } from './RemindersPanel';

export function RemindersBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { reminders, loading } = useReminders();

  const pendingReminders = reminders.filter(
    reminder => reminder.status === 'pending'
  );

  const highPriorityReminders = pendingReminders.filter(
    reminder => reminder.priority === 'high'
  );

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.reminders-bell')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative reminders-bell">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {pendingReminders.length > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {pendingReminders.length}
          </span>
        )}
        {highPriorityReminders.length > 0 && (
          <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-red-500 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <RemindersPanel
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
} 