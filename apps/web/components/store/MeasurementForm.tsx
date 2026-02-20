'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

interface MeasurementFormProps {
  onSubmit: (data: MeasurementData) => void;
  isLoading?: boolean;
}

interface MeasurementData {
  neck?: string;
  chest?: string;
  waist?: string;
  hips?: string;
  shoulder?: string;
  sleeveLength?: string;
  shirtLength?: string;
  trouserLength?: string;
  notes?: string;
  attachments?: File[];
}

export default function MeasurementForm({ onSubmit, isLoading }: MeasurementFormProps) {
  const [formData, setFormData] = useState<MeasurementData>({});
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, attachments: files });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Auna jiki / Measurements</h3>
          <p className="text-sm text-gray-500 mt-1">All measurements in inches or centimeters</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Neck"
              type="number"
              step="0.1"
              value={formData.neck || ''}
              onChange={(e) => setFormData({ ...formData, neck: e.target.value })}
            />
            <Input
              label="Chest"
              type="number"
              step="0.1"
              value={formData.chest || ''}
              onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
            />
            <Input
              label="Waist"
              type="number"
              step="0.1"
              value={formData.waist || ''}
              onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
            />
            <Input
              label="Hips"
              type="number"
              step="0.1"
              value={formData.hips || ''}
              onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
            />
            <Input
              label="Shoulder"
              type="number"
              step="0.1"
              value={formData.shoulder || ''}
              onChange={(e) => setFormData({ ...formData, shoulder: e.target.value })}
            />
            <Input
              label="Sleeve Length"
              type="number"
              step="0.1"
              value={formData.sleeveLength || ''}
              onChange={(e) => setFormData({ ...formData, sleeveLength: e.target.value })}
            />
            <Input
              label="Shirt Length"
              type="number"
              step="0.1"
              value={formData.shirtLength || ''}
              onChange={(e) => setFormData({ ...formData, shirtLength: e.target.value })}
            />
            <Input
              label="Trouser Length"
              type="number"
              step="0.1"
              value={formData.trouserLength || ''}
              onChange={(e) => setFormData({ ...formData, trouserLength: e.target.value })}
            />
          </div>

          <Textarea
            label="Notes (event date, fit preference, etc.)"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="E.g., Wedding on Dec 25, prefer loose fit"
          />

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">
              Upload Measurement Sheet (optional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1E2A78] file:text-white hover:file:bg-[#162056]"
            />
            {files.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">{files.length} file(s) selected</p>
            )}
          </div>

          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Measurements'}
          </Button>
        </CardBody>
      </Card>
    </form>
  );
}
