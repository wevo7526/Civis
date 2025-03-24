import { Card } from '../ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Event } from '@/app/lib/types';
import { UserGroupIcon, ClockIcon, ChartBarIcon, CalendarIcon, BanknotesIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';

interface ImpactMetricsProps {
  events: Event[];
}

interface EventMetrics {
  title: string;
  totalHours: number;
  volunteerCount: number;
  capacityUtilization: number;
  hoursPerVolunteer: number;
  budget: number;
  amountRaised: number;
  fundraisingGoal: number;
  roi: number;
  goalProgress: number;
  status: Event['status'];
}

export function ImpactMetrics({ events }: ImpactMetricsProps) {
  if (!events || events.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-4">
          <p className="text-gray-500 text-center">No event data available</p>
        </Card>
      </div>
    );
  }

  // Calculate metrics for each event
  const eventsWithMetrics: EventMetrics[] = events.map(event => {
    const totalHours = event.volunteer_hours 
      ? Object.values(event.volunteer_hours).reduce((sum, hours) => sum + hours, 0)
      : 0;
    
    const volunteerCount = event.volunteer_ids?.length || 0;
    const capacityUtilization = event.max_volunteers 
      ? (volunteerCount / event.max_volunteers) * 100 
      : 0;
    const hoursPerVolunteer = volunteerCount > 0 ? totalHours / volunteerCount : 0;

    // Calculate financial metrics
    const budget = event.budget || 0;
    const amountRaised = event.amount_raised || 0;
    const fundraisingGoal = event.fundraising_goal || 0;
    const roi = budget > 0 ? ((amountRaised - budget) / budget) * 100 : 0;
    const goalProgress = fundraisingGoal > 0 ? (amountRaised / fundraisingGoal) * 100 : 0;

    return {
      title: event.name,
      totalHours,
      volunteerCount,
      capacityUtilization,
      hoursPerVolunteer,
      budget,
      amountRaised,
      fundraisingGoal,
      roi,
      goalProgress,
      status: event.status
    };
  });

  // Calculate aggregate metrics
  const totalVolunteers = eventsWithMetrics.reduce((sum, event) => sum + event.volunteerCount, 0);
  const totalHours = eventsWithMetrics.reduce((sum, event) => sum + event.totalHours, 0);
  const totalBudget = eventsWithMetrics.reduce((sum, event) => sum + event.budget, 0);
  const totalRaised = eventsWithMetrics.reduce((sum, event) => sum + event.amountRaised, 0);
  const averageROI = eventsWithMetrics.reduce((sum, event) => sum + event.roi, 0) / eventsWithMetrics.length;

  // Prepare chart data
  const chartData = eventsWithMetrics.map(event => ({
    name: event.title || 'Untitled Event',
    'Volunteer Count': event.volunteerCount,
    'Total Hours': event.totalHours,
    'Capacity %': Math.round(event.capacityUtilization),
    'Hours/Volunteer': event.hoursPerVolunteer,
    'Budget': event.budget,
    'Amount Raised': event.amountRaised,
    'ROI %': Math.round(event.roi),
    'Goal Progress %': Math.round(event.goalProgress)
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total Volunteers</p>
              <p className="text-2xl font-semibold">{totalVolunteers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="text-2xl font-semibold">{Math.round(totalHours)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <BanknotesIcon className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Total Raised</p>
              <p className="text-2xl font-semibold">${totalRaised.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Average ROI</p>
              <p className="text-2xl font-semibold">{Math.round(averageROI)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Status Distribution */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Event Status Distribution</h3>
        <div className="flex flex-wrap gap-2">
          {['planned', 'active', 'completed', 'cancelled'].map(status => {
            const count = eventsWithMetrics.filter(event => event.status === status).length;
            const percentage = (count / eventsWithMetrics.length) * 100;
            
            return (
              <div key={status} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'active' ? 'bg-blue-500' :
                  status === 'planned' ? 'bg-green-500' :
                  status === 'completed' ? 'bg-gray-500' :
                  'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600 capitalize">{status}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Impact Chart */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Event Impact Overview</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Volunteer Count" fill="#3B82F6" />
              <Bar dataKey="Total Hours" fill="#10B981" />
              <Bar dataKey="Capacity %" fill="#F59E0B" />
              <Bar dataKey="Hours/Volunteer" fill="#8B5CF6" />
              <Bar dataKey="Budget" fill="#EF4444" />
              <Bar dataKey="Amount Raised" fill="#22C55E" />
              <Bar dataKey="ROI %" fill="#EC4899" />
              <Bar dataKey="Goal Progress %" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 