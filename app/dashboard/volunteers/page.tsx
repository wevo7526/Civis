'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlusIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import { Card } from '@/components/ui/card';
import { VolunteerDialog } from '@/components/volunteer-dialog';
import type { Volunteer } from '@/app/lib/types';

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Volunteer['status']>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    skills: ''
  });
  const [deleteVolunteerId, setDeleteVolunteerId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error:', authError.message);
        setError('Authentication failed. Please sign in again.');
        setVolunteers([]);
        return;
      }

      if (!user) {
        setError('Please sign in to view volunteers');
        setVolunteers([]);
        return;
      }

      const { data: volunteers, error: volunteersError } = await supabase
        .from('volunteers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (volunteersError) {
        console.error('Error fetching volunteers:', volunteersError.message);
        setError('Failed to fetch volunteers');
        setVolunteers([]);
        return;
      }

      setVolunteers(volunteers || []);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDialogClose = () => {
    setIsAddOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      skills: ''
    });
  };

  const handleAddVolunteer = async (data: Omit<Volunteer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: newVolunteer, error } = await supabase
        .from('volunteers')
        .insert([{
          ...data,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setVolunteers(prev => [newVolunteer, ...prev]);
      setIsDialogOpen(false);
      setSelectedVolunteer(null);
    } catch (err) {
      console.error('Error adding volunteer:', err);
      setError('Failed to add volunteer');
    }
  };

  const handleUpdateVolunteer = async (data: Omit<Volunteer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!selectedVolunteer) return;

    try {
      const { error } = await supabase
        .from('volunteers')
        .update(data)
        .eq('id', selectedVolunteer.id);

      if (error) throw error;

      setVolunteers(prev => prev.map(v => 
        v.id === selectedVolunteer.id ? { ...v, ...data } : v
      ));
      setIsDialogOpen(false);
      setSelectedVolunteer(null);
    } catch (err) {
      console.error('Error updating volunteer:', err);
      setError('Failed to update volunteer');
    }
  };

  const handleDeleteVolunteer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this volunteer?')) return;

    try {
      const { error } = await supabase
        .from('volunteers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVolunteers(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Error deleting volunteer:', err);
      setError('Failed to delete volunteer');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImportPreview(results.data);
        setError(null);
      },
      error: (error) => {
        setError('Failed to parse CSV file: ' + error.message);
        setImportPreview([]);
      }
    });
  };

  const handleImport = async () => {
    if (!importPreview.length) {
      setError('No volunteers to import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const volunteers = importPreview.map(row => ({
        user_id: user.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone || '',
        status: 'pending' as const,
        skills: (row.skills || '').split(',').map((s: string) => s.trim()),
        interests: (row.interests || '').split(',').map((s: string) => s.trim()),
        availability: {
          weekdays: false,
          weekends: false,
          hours: '9-5'
        },
        total_hours: 0,
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('volunteers')
        .insert(volunteers);

      if (insertError) throw insertError;

      setIsImportOpen(false);
      setImportPreview([]);
      fetchVolunteers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import volunteers');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'skills',
      'interests'
    ];

    const example = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      skills: 'teaching, first aid, cooking',
      interests: 'education, healthcare'
    };

    const csv = Papa.unparse({
      fields: headers,
      data: [example]
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'volunteers_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = searchQuery === '' || 
      `${volunteer.first_name} ${volunteer.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || volunteer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Volunteer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
        <button
          onClick={() => {
            setSelectedVolunteer(null);
            setIsDialogOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Volunteer
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6 flex space-x-4">
        <input
          type="text"
          placeholder="Search volunteers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVolunteers.map(volunteer => (
          <div
            key={volunteer.id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {volunteer.first_name} {volunteer.last_name}
                </h3>
                <p className="text-sm text-gray-500">{volunteer.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(volunteer.status)}`}>
                {volunteer.status}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {volunteer.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Availability</h4>
              <div className="text-sm text-gray-600">
                <p>Weekdays: {volunteer.availability.weekdays ? 'Yes' : 'No'}</p>
                <p>Weekends: {volunteer.availability.weekends ? 'Yes' : 'No'}</p>
                <p>Hours: {volunteer.availability.hours}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedVolunteer(volunteer);
                  setIsDialogOpen(true);
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteVolunteer(volunteer.id)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <VolunteerDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedVolunteer(null);
        }}
        onSubmit={selectedVolunteer ? handleUpdateVolunteer : handleAddVolunteer}
        volunteer={selectedVolunteer}
      />
    </div>
  );
} 