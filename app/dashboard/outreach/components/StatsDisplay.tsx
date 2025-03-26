import { Card } from "@/components/ui/card";
import { UserGroupIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

interface StatsDisplayProps {
  stats: {
    totalDonors: number;
    totalVolunteers: number;
    activeDonors: number;
    activeVolunteers: number;
    recentDonors: number;
    recentVolunteers: number;
  };
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-50 rounded-full">
            <UserGroupIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Donors</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalDonors}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.activeDonors} active
            </p>
          </div>
        </div>
      </Card>
      <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-full">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalVolunteers}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.activeVolunteers} active
            </p>
          </div>
        </div>
      </Card>
      <Card className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-full">
            <EnvelopeIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Recent Activity</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recentDonors + stats.recentVolunteers}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Last 30 days
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 