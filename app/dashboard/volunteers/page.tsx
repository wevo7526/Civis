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

interface VolunteerActivity {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  status: 'open' | 'filled' | 'completed' | 'cancelled';
}

interface Volunteer {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: 'active' | 'inactive' | 'pending';
  skills: string[];
  activities: VolunteerActivity[];
  lastActivity: string | null;
  totalActivities: number;
  total_hours: number;
  created_at: string;
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Volunteer['status'] | 'all'>('all');
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

      // Fetch volunteers directly
      const { data: volunteers, error: volunteersError } = await supabase
        .from('volunteers')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          status,
          skills,
          total_hours,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (volunteersError) {
        console.error('Error fetching volunteers:', volunteersError.message);
        setError('Failed to fetch volunteers');
        setVolunteers([]);
        return;
      }

      // Transform the data
      const volunteerData: Volunteer[] = (volunteers || []).map(volunteer => ({
        id: volunteer.id,
        name: `${volunteer.first_name} ${volunteer.last_name}`,
        first_name: volunteer.first_name,
        last_name: volunteer.last_name,
        email: volunteer.email,
        phone: volunteer.phone,
        status: volunteer.status,
        skills: volunteer.skills || [],
        activities: [], // We'll fetch activities separately if needed
        lastActivity: null,
        totalActivities: 0,
        total_hours: volunteer.total_hours || 0,
        created_at: volunteer.created_at
      }));

      setVolunteers(volunteerData);
      setError(null);
    } catch (err) {
      console.error('Error in fetchVolunteers:', err);
      setError('An unexpected error occurred. Please try again.');
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

  const handleAddVolunteer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a new volunteer record
      const { data: volunteer, error: volunteerError } = await supabase
        .from('volunteers')
        .insert({
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          status: 'pending',
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          interests: [],
          availability: {
            weekdays: false,
            weekends: false,
            hours: '9-5'
          },
          total_hours: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (volunteerError) throw volunteerError;

      // Create a new volunteer activity
      const { data: activity, error: activityError } = await supabase
        .from('volunteer_activities')
        .insert({
          organizer_id: user.id,
          title: 'New Volunteer Registration',
          description: 'Initial volunteer registration',
          location: 'Online',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          max_participants: 1,
          participant_ids: [volunteer.id],
          status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (activityError) throw activityError;

      handleDialogClose();
      await fetchVolunteers();
    } catch (err) {
      console.error('Error adding volunteer:', err);
      setError(err instanceof Error ? err.message : 'Failed to add volunteer');
    } finally {
      setLoading(false);
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

  if (loading && !volunteers.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Management</h1>
          <p className="mt-2 text-gray-600">
            Track and manage volunteer activities and engagement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-50 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
              <p className="text-2xl font-bold text-gray-900">{volunteers.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Volunteers</p>
              <p className="text-2xl font-bold text-gray-900">
                {volunteers.filter(v => v.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-50 rounded-full">
              <UserPlusIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {volunteers.reduce((sum, v) => sum + v.total_hours, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px] border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
                <FunnelIcon className="h-5 w-5 mr-2" />
                {statusFilter === 'all' ? 'All Statuses' : statusFilter}
                <ChevronUpDownIcon className="h-5 w-5 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border border-gray-100">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-3">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border border-gray-100 shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-gray-900">Import Volunteers</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Import multiple volunteers at once using a CSV file.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">1. Download Template</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start by downloading our CSV template with the correct format.
                  </p>
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="mt-2 border-gray-200 hover:bg-gray-50"
                  >
                    <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                    Download Template
                  </Button>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900">2. Upload File</h3>
                  <label className="mt-2 block">
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors cursor-pointer">
                      <div className="space-y-1 text-center">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              accept=".csv"
                              className="sr-only"
                              onChange={handleFileUpload}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">CSV file up to 10MB</p>
                      </div>
                    </div>
                  </label>
                </div>

                {importPreview.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">3. Review</h3>
                    <div className="mt-2 max-h-60 overflow-auto border border-gray-100 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Skills</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {importPreview.map((row, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.first_name} {row.last_name}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.email}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.skills}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsImportOpen(false)}
                    className="w-full border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={loading || !importPreview.length}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? 'Importing...' : 'Import Volunteers'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsAddOpen(true)}
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Add Volunteer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-gray-100 shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-gray-900">Add New Volunteer</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Enter the volunteer's information below.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddVolunteer} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required 
                      className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required 
                      className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email" 
                    required 
                    className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    type="tel" 
                    className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-sm font-medium text-gray-700">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    placeholder="e.g., teaching, first aid, cooking"
                    className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    className="w-full border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? 'Adding...' : 'Add Volunteer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-sm font-medium text-gray-500">Name</TableHead>
              <TableHead className="text-sm font-medium text-gray-500">Email</TableHead>
              <TableHead className="text-sm font-medium text-gray-500">Phone</TableHead>
              <TableHead className="text-sm font-medium text-gray-500">Status</TableHead>
              <TableHead className="text-sm font-medium text-gray-500">Skills</TableHead>
              <TableHead className="text-sm font-medium text-gray-500">Hours</TableHead>
              <TableHead className="text-sm font-medium text-gray-500">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVolunteers.map((volunteer) => (
              <TableRow
                key={volunteer.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                onClick={() => router.push(`/dashboard/volunteers/${volunteer.id}`)}
              >
                <TableCell className="font-medium text-gray-900">
                  {volunteer.first_name} {volunteer.last_name}
                </TableCell>
                <TableCell className="text-gray-600">{volunteer.email}</TableCell>
                <TableCell className="text-gray-600">{volunteer.phone}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(volunteer.status)} border-0`}
                  >
                    {volunteer.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {volunteer.skills.slice(0, 3).map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="secondary" 
                        className="text-xs bg-gray-100 text-gray-700 border-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {volunteer.skills.length > 3 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-gray-100 text-gray-700 border-0"
                      >
                        +{volunteer.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{volunteer.total_hours}</TableCell>
                <TableCell className="text-gray-600">
                  {new Date(volunteer.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {filteredVolunteers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    'No volunteers found'
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 