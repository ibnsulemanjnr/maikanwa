'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  title: string;
  options: FilterOption[];
}

interface FilterSidebarProps {
  filters: FilterGroup[];
  onApplyFilters: (selected: Record<string, string[]>) => void;
}

export default function FilterSidebar({ filters, onApplyFilters }: FilterSidebarProps) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  const handleToggle = (groupTitle: string, optionId: string) => {
    setSelected((prev) => {
      const current = prev[groupTitle] || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [groupTitle]: updated };
    });
  };

  const handleClear = () => {
    setSelected({});
    onApplyFilters({});
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filters</h3>
        <button onClick={handleClear} className="text-sm text-[#1E2A78] hover:underline">
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        {filters.map((group) => (
          <div key={group.title}>
            <h4 className="font-medium text-sm text-[#111827] mb-3">{group.title}</h4>
            <div className="space-y-2">
              {group.options.map((option) => (
                <label key={option.id} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected[group.title]?.includes(option.id) || false}
                    onChange={() => handleToggle(group.title, option.id)}
                    className="w-4 h-4 text-[#1E2A78] border-[#E5E7EB] rounded focus:ring-[#1E2A78]"
                  />
                  <span className="ml-2 text-sm text-[#111827]">
                    {option.label}
                    {option.count !== undefined && (
                      <span className="text-gray-500 ml-1">({option.count})</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={() => onApplyFilters(selected)}
        fullWidth
        className="mt-6"
      >
        Apply Filters
      </Button>
    </div>
  );
}
