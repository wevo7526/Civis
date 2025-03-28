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
  CheckCircleIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

interface ImportPreviewRow {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  skills?: string;
  interests?: string;
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Volunteer['status']>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([]);
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

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedVolunteer(null);
    setSuccessMessage(null);
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
          total_hours: 0,
        }])
        .select()
        .single();

      if (error) throw error;

      setVolunteers(prev => [newVolunteer, ...prev]);
      handleDialogClose();
      setSuccessMessage('Volunteer added successfully');
    } catch (err) {
      console.error('Error adding volunteer:', err);
      setError('Failed to add volunteer. Please try again.');
    }
  };

  const handleUpdateVolunteer = async (data: Omit<Volunteer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!selectedVolunteer) return;

    try {
      const { error } = await supabase
        .from('volunteers')
        .update({
          ...data,
          total_hours: selectedVolunteer.total_hours,
        })
        .eq('id', selectedVolunteer.id);

      if (error) throw error;

      setVolunteers(prev => prev.map(v => 
        v.id === selectedVolunteer.id ? { ...v, ...data } : v
      ));
      handleDialogClose();
      setSuccessMessage('Volunteer updated successfully');
    } catch (err) {
      console.error('Error updating volunteer:', err);
      setError('Failed to update volunteer. Please try again.');
    }
  };

  const handleDeleteVolunteer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('volunteers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVolunteers(prev => prev.filter(v => v.id !== id));
      setSuccessMessage('Volunteer deleted successfully');
    } catch (err) {
      console.error('Error deleting volunteer:', err);
      setError('Failed to delete volunteer. Please try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const preview = results.data.slice(0, 5) as ImportPreviewRow[];
        setImportPreview(preview);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setError('Failed to parse CSV file. Please check the format.');
      }
    });
  };

  const handleImport = async () => {
    if (!importPreview.length) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const volunteersToImport = importPreview.map(row => ({
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone || '',
        status: 'pending' as const,
        skills: row.skills ? row.skills.split(',').map(s => s.trim()) : [],
        interests: row.interests ? row.interests.split(',').map(i => i.trim()) : [],
        availability: {
          weekdays: false,
          weekends: false,
          hours: ''
        },
        total_hours: 0,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('volunteers')
        .insert(volunteersToImport);

      if (error) throw error;

      await fetchVolunteers();
      setIsImportOpen(false);
      setImportPreview([]);
      setSuccessMessage('Volunteers imported successfully');
    } catch (err) {
      console.error('Error importing volunteers:', err);
      setError('Failed to import volunteers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        skills: 'teaching, event planning',
        interests: 'education, community service'
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'volunteer_template.csv';
    link.click();
  };

  const getStatusColor = (status: Volunteer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = 
      volunteer.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || volunteer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsImportOpen(true)} 
            variant="outline" 
            className="border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Import
          </Button>
          <Button 
            onClick={() => {
              setSelectedVolunteer(null);
              setIsDialogOpen(true);
            }} 
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Volunteer
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search volunteers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as 'all' | Volunteer['status'])}
              >
                <SelectTrigger className="border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg font-medium">No volunteers found</p>
            <p className="text-sm mt-1">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Add your first volunteer to get started!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVolunteers.map((volunteer) => (
                  <tr key={volunteer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {volunteer.first_name} {volunteer.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{volunteer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{volunteer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(volunteer.status)}`}>
                        {volunteer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {volunteer.skills.slice(0, 2).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                            {skill}
                          </Badge>
                        ))}
                        {volunteer.skills.length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                            +{volunteer.skills.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{volunteer.total_hours}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedVolunteer(volunteer);
                          setIsDialogOpen(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVolunteer(volunteer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VolunteerDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={selectedVolunteer ? handleUpdateVolunteer : handleAddVolunteer}
        volunteer={selectedVolunteer}
      />

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-xl rounded-lg">
          <DialogHeader className="border-b pb-4 sticky top-0 bg-white z-10">
            <DialogTitle className="text-2xl font-semibold text-gray-900">Import Volunteers</DialogTitle>
            <DialogDescription className="text-gray-500">
              Upload a CSV file with volunteer information. The file should include first_name, last_name, and email columns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csvFile" className="text-gray-700 font-medium">CSV File</Label>
                <div className="relative">
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-purple-50 file:text-purple-700
                      hover:file:bg-purple-100
                      bg-white border-gray-200
                      focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={downloadTemplate} 
                className="border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Download Template
              </Button>
            </div>

            {importPreview.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Preview ({importPreview.length} volunteers)</Label>
                <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importPreview.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{row.first_name} {row.last_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{row.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{row.phone || '-'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-4 sticky bottom-0 bg-white z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportOpen(false)}
              className="min-w-[100px] border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={loading || importPreview.length === 0}
              className="min-w-[100px] bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 