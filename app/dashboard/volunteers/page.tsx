'use client';

import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Volunteer } from '@/lib/types';

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // TODO: Implement volunteer fetching
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Volunteers</h1>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Volunteer
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {volunteers.map((volunteer) => (
          <div
            key={volunteer.id}
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{volunteer.name}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  volunteer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">{volunteer.email}</p>
                <p className="text-sm text-gray-600">{volunteer.phone}</p>
                <div className="flex flex-wrap gap-2">
                  {volunteer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Availability</h3>
                <p className="text-sm text-gray-600">{volunteer.availability}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 