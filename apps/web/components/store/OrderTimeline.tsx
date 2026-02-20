import { cn } from '@/lib/utils';

interface TimelineStep {
  label: string;
  date?: string;
  completed: boolean;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
}

export default function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start">
          <div className="flex flex-col items-center mr-4">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                step.completed ? 'bg-[#10B981] text-white' : 'bg-[#E5E7EB] text-gray-400'
              )}
            >
              {step.completed ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-0.5 h-12 mt-2',
                  step.completed ? 'bg-[#10B981]' : 'bg-[#E5E7EB]'
                )}
              />
            )}
          </div>
          <div className="flex-1 pt-1">
            <p className={cn('font-medium', step.completed ? 'text-[#111827]' : 'text-gray-500')}>
              {step.label}
            </p>
            {step.date && <p className="text-sm text-gray-500 mt-1">{step.date}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
