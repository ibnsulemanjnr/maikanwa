'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';

interface AddressFormProps {
  onSubmit: (data: AddressData) => void;
  initialData?: Partial<AddressData>;
  isLoading?: boolean;
}

interface AddressData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  isDefault?: boolean;
}

const nigerianStates = [
  { value: '', label: 'Select State' },
  { value: 'Kano', label: 'Kano' },
  { value: 'Lagos', label: 'Lagos' },
  { value: 'Abuja', label: 'Abuja (FCT)' },
  { value: 'Kaduna', label: 'Kaduna' },
  { value: 'Rivers', label: 'Rivers' },
  { value: 'Oyo', label: 'Oyo' },
];

export default function AddressForm({ onSubmit, initialData, isLoading }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressData>({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postalCode: initialData?.postalCode || '',
    isDefault: initialData?.isDefault || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        required
      />
      
      <Input
        label="Phone Number"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
      />
      
      <Textarea
        label="Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        rows={3}
        required
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="City"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          required
        />
        
        <Select
          label="State"
          options={nigerianStates}
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          required
        />
      </div>
      
      <Input
        label="Postal Code (Optional)"
        value={formData.postalCode}
        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
      />
      
      <Checkbox
        label="Set as default address"
        checked={formData.isDefault}
        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
      />
      
      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Address'}
      </Button>
    </form>
  );
}
