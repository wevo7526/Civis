'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Target, 
  Mail, 
  Heart, 
  Globe, 
  Phone, 
  MapPin, 
  Users2, 
  Calendar,
  DollarSign,
  FileText,
  Shield
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface Profile {
  id: string;
  organization_name: string | null;
  organization_type: string | null;
  mission_statement: string | null;
  tax_id: string | null;
  founding_year: number | null;
  organization_size: string | null;
  annual_budget: string | null;
  primary_cause: string | null;
  impact_areas: string[];
  target_beneficiaries: string[];
  programs: string[];
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  contact_name: string | null;
  contact_title: string | null;
  volunteer_needs: string[];
  funding_sources: string[];
  partnerships_desired: boolean | null;
  partnership_interests: string[];
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({
    organization_name: '',
    organization_type: '',
    mission_statement: '',
    tax_id: '',
    founding_year: null,
    organization_size: '',
    annual_budget: '',
    primary_cause: '',
    impact_areas: [],
    target_beneficiaries: [],
    programs: [],
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: '',
    email: '',
    website_url: '',
    contact_name: '',
    contact_title: '',
    volunteer_needs: [],
    funding_sources: [],
    partnerships_desired: null,
    partnership_interests: []
  });

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/login');
          return;
        }

        const { data } = await supabase
          .from('organization_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setFormData({
            ...data,
            impact_areas: data.impact_areas || [],
            target_beneficiaries: data.target_beneficiaries || [],
            programs: data.programs || [],
            volunteer_needs: data.volunteer_needs || [],
            funding_sources: data.funding_sources || [],
            partnership_interests: data.partnership_interests || []
          });
        }
      } catch (error) {
        console.log('No existing profile found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated session');

      const updates = {
        ...formData,
        id: session.user.id,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('organization_profiles')
        .upsert(updates)
        .select()
        .single();

      if (updateError) throw updateError;
      router.refresh();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: keyof Profile, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (name: keyof Profile, value: string) => {
    if (typeof value !== 'string') return;
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [name]: arrayValue }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Organization Profile</h1>
          <p className="text-gray-500">Manage your organization's information and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Details Card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b-0">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="organization_name">Organization Name</Label>
                <Input
                  id="organization_name"
                  value={formData.organization_name || ''}
                  onChange={(e) => handleInputChange('organization_name', e.target.value)}
                  placeholder="Organization name"
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization_type">Organization Type</Label>
                <Select
                  value={formData.organization_type || ''}
                  onValueChange={(value) => handleInputChange('organization_type', value)}
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="501c3">501(c)(3)</SelectItem>
                    <SelectItem value="501c4">501(c)(4)</SelectItem>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="charity">Charity</SelectItem>
                    <SelectItem value="ngo">NGO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mission_statement">Mission Statement</Label>
              <Textarea
                id="mission_statement"
                value={formData.mission_statement || ''}
                onChange={(e) => handleInputChange('mission_statement', e.target.value)}
                placeholder="Describe your organization's mission"
                className="bg-white min-h-[100px] border-gray-200 focus:border-gray-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID / EIN</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id || ''}
                  onChange={(e) => handleInputChange('tax_id', e.target.value)}
                  placeholder="XX-XXXXXXX"
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="founding_year">Founding Year</Label>
                <Input
                  id="founding_year"
                  type="number"
                  value={formData.founding_year || ''}
                  onChange={(e) => handleInputChange('founding_year', parseInt(e.target.value))}
                  placeholder="YYYY"
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization_size">Organization Size</Label>
                <Select
                  value={formData.organization_size || ''}
                  onValueChange={(value) => handleInputChange('organization_size', value)}
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501+">501+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact & Programs Card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b-0">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-500" />
              Impact & Programs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primary_cause">Primary Cause</Label>
                <Select
                  value={formData.primary_cause || ''}
                  onValueChange={(value) => handleInputChange('primary_cause', value)}
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select primary cause" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="poverty">Poverty Alleviation</SelectItem>
                    <SelectItem value="human_rights">Human Rights</SelectItem>
                    <SelectItem value="arts">Arts & Culture</SelectItem>
                    <SelectItem value="community">Community Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual_budget">Annual Budget</Label>
                <Select
                  value={formData.annual_budget || ''}
                  onValueChange={(value) => handleInputChange('annual_budget', value)}
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="0-100k">$0 - $100,000</SelectItem>
                    <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                    <SelectItem value="500k-1m">$500,000 - $1 million</SelectItem>
                    <SelectItem value="1m-5m">$1 million - $5 million</SelectItem>
                    <SelectItem value="5m+">$5 million+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact_areas">Impact Areas</Label>
              <Input
                id="impact_areas"
                value={formData.impact_areas?.join(', ') || ''}
                onChange={(e) => handleArrayInputChange('impact_areas', e.target.value)}
                placeholder="Education, Healthcare, Environmental Conservation"
                className="bg-white border-gray-200 focus:border-gray-300"
              />
              <p className="text-sm text-gray-500">Separate areas with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_beneficiaries">Target Beneficiaries</Label>
              <Input
                id="target_beneficiaries"
                value={formData.target_beneficiaries?.join(', ') || ''}
                onChange={(e) => handleArrayInputChange('target_beneficiaries', e.target.value)}
                placeholder="Youth, Elderly, Veterans"
                className="bg-white border-gray-200 focus:border-gray-300"
              />
              <p className="text-sm text-gray-500">Separate beneficiary groups with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="programs">Key Programs</Label>
              <Textarea
                id="programs"
                value={formData.programs?.join('\n') || ''}
                onChange={(e) => handleArrayInputChange('programs', e.target.value.replace(/\n/g, ','))}
                placeholder="List your key programs or initiatives"
                className="bg-white min-h-[100px] border-gray-200 focus:border-gray-300"
              />
              <p className="text-sm text-gray-500">Enter each program on a new line</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b-0">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-500" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Primary Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name || ''}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  placeholder="Full name"
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_title">Contact Title</Label>
                <Input
                  id="contact_title"
                  value={formData.contact_title || ''}
                  onChange={(e) => handleInputChange('contact_title', e.target.value)}
                  placeholder="Job title"
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contact@organization.org"
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(XXX) XXX-XXXX"
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address"
                className="bg-white border-gray-200 focus:border-gray-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code || ''}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url || ''}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://www.organization.org"
                className="bg-white border-gray-200 focus:border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Engagement & Partnerships Card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b-0">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-gray-500" />
              Engagement & Partnerships
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="volunteer_needs">Volunteer Opportunities</Label>
              <Textarea
                id="volunteer_needs"
                value={formData.volunteer_needs?.join('\n') || ''}
                onChange={(e) => handleArrayInputChange('volunteer_needs', e.target.value.replace(/\n/g, ','))}
                placeholder="List current volunteer needs"
                className="bg-white min-h-[100px] border-gray-200 focus:border-gray-300"
              />
              <p className="text-sm text-gray-500">Enter each opportunity on a new line</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funding_sources">Current Funding Sources</Label>
              <Input
                id="funding_sources"
                value={formData.funding_sources?.join(', ') || ''}
                onChange={(e) => handleArrayInputChange('funding_sources', e.target.value)}
                placeholder="Grants, Individual Donors, Corporate Sponsors"
                className="bg-white border-gray-200 focus:border-gray-300"
              />
              <p className="text-sm text-gray-500">Separate sources with commas</p>
            </div>

            <div className="space-y-2">
              <Label>Open to Partnerships</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={formData.partnerships_desired === true}
                    onChange={() => handleInputChange('partnerships_desired', true)}
                    className="form-radio text-primary"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={formData.partnerships_desired === false}
                    onChange={() => handleInputChange('partnerships_desired', false)}
                    className="form-radio text-primary"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formData.partnerships_desired && (
              <div className="space-y-2">
                <Label htmlFor="partnership_interests">Partnership Interests</Label>
                <Input
                  id="partnership_interests"
                  value={formData.partnership_interests?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('partnership_interests', e.target.value)}
                  placeholder="Program Collaboration, Resource Sharing, Joint Fundraising"
                  className="bg-white border-gray-200 focus:border-gray-300"
                />
                <p className="text-sm text-gray-500">Separate interests with commas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
} 