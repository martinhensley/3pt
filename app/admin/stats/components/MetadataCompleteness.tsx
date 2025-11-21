'use client';

import type { MetadataCompletenessField } from '@/lib/stats/types';

interface MetadataCompletenessProps {
  data: MetadataCompletenessField[];
}

export default function MetadataCompleteness({ data }: MetadataCompletenessProps) {
  const getColorClass = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const avgCompleteness = data.length > 0
    ? Math.round(data.reduce((sum, field) => sum + field.percentage, 0) / data.length)
    : 0;

  const getOverallColorClass = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-blue-600 bg-blue-50';
    if (percentage >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Metadata Completeness</h3>
            <p className="text-sm text-gray-600 mt-1">Card data quality tracking</p>
          </div>
          <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${getOverallColorClass(avgCompleteness)}`}>
            {avgCompleteness}%
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((field) => (
          <div key={field.field}>
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-sm font-medium text-gray-900">{field.fieldLabel}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({field.cardsWithData.toLocaleString()} of {field.totalCards.toLocaleString()})
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{field.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getColorClass(field.percentage)}`}
                style={{ width: `${field.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">Excellent (≥90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600">Good (75-89%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-gray-600">Fair (50-74%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-600">Poor (&lt;50%)</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-lg">💡</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">Insight</p>
            <p className="text-xs text-blue-700 mt-1">
              {avgCompleteness >= 90
                ? 'Outstanding metadata quality! Your cards have comprehensive information.'
                : avgCompleteness >= 75
                ? 'Good metadata coverage. Consider focusing on fields below 75% for improvement.'
                : 'Metadata completeness could be improved. Focus on enriching card data for better user experience.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
