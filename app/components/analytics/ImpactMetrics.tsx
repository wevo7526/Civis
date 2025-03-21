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
import { Event } from '@/lib/types';
import { UserGroupIcon, ClockIcon, ChartBarIcon, CalendarIcon, BanknotesIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';

interface ImpactMetricsProps {
  events: Event[];
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
  const eventsWithMetrics = events.map(event => {
    const totalHours = event.volunteer_hours 
      ? Object.values(event.volunteer_hours).reduce((sum, hours) => sum + hours, 0)
      : 0;
    
    const volunteerCount = event.volunteer_ids?.length || 0;
    const capacityUtilization = event.max_volunteers 
      ? (volunteerCount / event.max_volunteers) * 100 
      : 0;

    // Calculate financial metrics
    const budget = event.budget || 0;
    const amountRaised = event.amount_raised || 0;
    const fundraisingGoal = event.fundraising_goal || 0;
    const roi = budget > 0 ? ((amountRaised - budget) / budget) * 100 : 0;
    const goalProgress = fundraisingGoal > 0 ? (amountRaised / fundraisingGoal) * 100 : 0;

    return {
      ...event,
      totalHours,
      volunteerCount,
      capacityUtilization,
      hoursPerVolunteer: volunteerCount > 0 ? totalHours / volunteerCount : 0,
      budget,
      amountRaised,
      fundraisingGoal,
      roi,
      goalProgress
    };
  });

  // Calculate overall metrics
  const totalVolunteers = events.reduce((sum, event) => sum + (event.volunteer_ids?.length || 0), 0);
  const totalHours = events.reduce((sum, event) => {
    if (!event.volunteer_hours) return sum;
    return sum + Object.values(event.volunteer_hours).reduce((hoursSum, hours) => hoursSum + hours, 0);
  }, 0);
  const averageCapacity = events.reduce((sum, event) => {
    if (!event.max_volunteers || !event.volunteer_ids) return sum;
    return sum + ((event.volunteer_ids.length / event.max_volunteers) * 100);
  }, 0) / events.length;

  // Calculate financial metrics
  const totalBudget = events.reduce((sum, event) => sum + (event.budget || 0), 0);
  const totalRaised = events.reduce((sum, event) => sum + (event.amount_raised || 0), 0);
  const totalGoal = events.reduce((sum, event) => sum + (event.fundraising_goal || 0), 0);
  const overallROI = totalBudget > 0 ? ((totalRaised - totalBudget) / totalBudget) * 100 : 0;
  const overallProgress = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;

  // Prepare chart data
  const chartData = eventsWithMetrics.map(event => ({
    name: event.name || 'Untitled Event',
    'Volunteer Count': event.volunteerCount,
    'Total Hours': event.totalHours,
    'Capacity %': Math.round(event.capacityUtilization),
    'Budget': event.budget,
    'Amount Raised': event.amountRaised,
    'ROI %': Math.round(event.roi),
    'Goal Progress %': Math.round(event.goalProgress)
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-50 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
              <p className="text-2xl font-bold text-gray-900">{totalVolunteers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalHours)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-50 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Capacity</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(averageCapacity)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-50 rounded-full">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 rounded-full">
              <BanknotesIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Raised</p>
              <p className="text-2xl font-bold text-gray-900">${totalRaised.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-rose-50 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Overall ROI</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(overallROI)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-50 rounded-full">
              <ArrowTrendingUpIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Goal Progress</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(overallProgress)}%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Performance</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: '#374151' }}
                itemStyle={{ color: '#6b7280' }}
              />
              <Legend />
              <Bar dataKey="Volunteer Count" fill="#8b5cf6" name="Volunteers" />
              <Bar dataKey="Total Hours" fill="#10b981" name="Hours" />
              <Bar dataKey="Capacity %" fill="#f59e0b" name="Capacity %" />
              <Bar dataKey="ROI %" fill="#f97316" name="ROI %" />
              <Bar dataKey="Goal Progress %" fill="#059669" name="Goal Progress %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Event</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Volunteers</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Hours</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Capacity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Budget</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Raised</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ROI</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Progress</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {eventsWithMetrics.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm text-gray-900">{event.name || 'Untitled Event'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{event.volunteerCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{Math.round(event.totalHours)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{Math.round(event.capacityUtilization)}%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">${event.budget.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">${event.amountRaised.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{Math.round(event.roi)}%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{Math.round(event.goalProgress)}%</td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`${
                        event.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        event.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      } border-0`}
                    >
                      {event.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 