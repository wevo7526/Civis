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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Total Volunteers</p>
            <p className="text-2xl font-bold">{totalVolunteers}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Total Volunteer Hours</p>
            <p className="text-2xl font-bold">{Math.round(totalHours)}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Average Capacity</p>
            <p className="text-2xl font-bold">{Math.round(averageCapacity)}%</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Active Events</p>
            <p className="text-2xl font-bold">
              {events.filter(e => e.status === 'active').length}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Total Budget</p>
            <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Total Raised</p>
            <p className="text-2xl font-bold">${totalRaised.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Overall ROI</p>
            <p className="text-2xl font-bold">{Math.round(overallROI)}%</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Goal Progress</p>
            <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
          </div>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Event Performance</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Volunteer Count" fill="#8884d8" name="Volunteers" />
                <Bar dataKey="Total Hours" fill="#82ca9d" name="Hours" />
                <Bar dataKey="Capacity %" fill="#ffc658" name="Capacity %" />
                <Bar dataKey="ROI %" fill="#ff7300" name="ROI %" />
                <Bar dataKey="Goal Progress %" fill="#387908" name="Goal Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Event Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Event</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Volunteers</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Hours</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Capacity</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Budget</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Raised</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">ROI</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Progress</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {eventsWithMetrics.map(event => (
                <tr key={event.id}>
                  <td className="px-4 py-2">{event.name || 'Untitled Event'}</td>
                  <td className="px-4 py-2">{event.volunteerCount}</td>
                  <td className="px-4 py-2">{Math.round(event.totalHours)}</td>
                  <td className="px-4 py-2">{Math.round(event.capacityUtilization)}%</td>
                  <td className="px-4 py-2">${event.budget.toLocaleString()}</td>
                  <td className="px-4 py-2">${event.amountRaised.toLocaleString()}</td>
                  <td className="px-4 py-2">{Math.round(event.roi)}%</td>
                  <td className="px-4 py-2">{Math.round(event.goalProgress)}%</td>
                  <td className="px-4 py-2">{event.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 