'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { X, Building2, Mail, Phone, MapPin, Globe, Loader2, CheckCircle, User } from 'lucide-react';

interface CreateClientModalProps {
  open: boolean;
  onClose: () => void;
  editingClient?: any | null;
  onSaved?: (client: any) => void;
}

export function CreateClientModal({ open, onClose, editingClient, onSaved }: CreateClientModalProps) {
  const isEditing = !!editingClient?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      if (isEditing) {
        setName(editingClient?.name || '');
        setIndustry(editingClient?.industry || '');
        setContactPerson(editingClient?.contactPerson || '');
        setEmail(editingClient?.email || '');
        setPhone(editingClient?.phone || '');
        setAddress(editingClient?.address || '');
        setLogoUrl(editingClient?.logoUrl || '');
        setIsActive(typeof editingClient?.isActive === 'boolean' ? editingClient.isActive : true);
      } else {
        setName('');
        setIndustry('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setAddress('');
        setLogoUrl('');
        setIsActive(true);
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, isEditing, editingClient]);

  if (!open) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!name.trim()) {
        setError('Client name is required');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: name.trim(),
        industry: industry.trim() || null,
        contactPerson: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        logoUrl: logoUrl.trim() || null,
        isActive,
      };

      const url = isEditing ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let details = '';
        try { const j = await response.json(); details = j?.error || j?.message || ''; } catch {}
        throw new Error(details || `Failed to ${isEditing ? 'update' : 'create'} client`);
      }

      const result = await response.json();
      const saved = result?.data || result;
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Client' : 'New Client'}</h2>
              <p className="text-gray-600">{isEditing ? 'Update client details' : 'Add a new client to your CRM'}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-160px)]">
          {error && (
            <Card className="mb-4">
              <CardContent className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., TechCorp Industries" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Technology" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g., Sarah Johnson" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@company.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+41 79 123 45 67" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, Country" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-gray-400 mr-2" />
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center space-x-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700 text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {isEditing ? 'Save Changes' : 'Create Client'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


