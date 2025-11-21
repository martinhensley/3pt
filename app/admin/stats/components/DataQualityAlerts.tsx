'use client';

import type { QualityAlert } from '@/lib/stats/types';

interface DataQualityAlertsProps {
  alerts: QualityAlert[];
}

export default function DataQualityAlerts({ alerts }: DataQualityAlertsProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  const getAlertColorClass = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getBadgeColorClass = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-amber-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Data Quality Alerts</h3>
          <p className="text-sm text-gray-600 mt-1">System health and data integrity</p>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg font-semibold text-green-600 mb-1">All Clear!</p>
          <p className="text-sm text-gray-600">No data quality issues detected</p>
        </div>
      </div>
    );
  }

  // Group alerts by type
  const errorAlerts = alerts.filter((a) => a.type === 'error');
  const warningAlerts = alerts.filter((a) => a.type === 'warning');
  const infoAlerts = alerts.filter((a) => a.type === 'info');

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Quality Alerts</h3>
            <p className="text-sm text-gray-600 mt-1">System health and data integrity</p>
          </div>
          <div className="flex items-center gap-2">
            {errorAlerts.length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                {errorAlerts.length} Error{errorAlerts.length !== 1 ? 's' : ''}
              </span>
            )}
            {warningAlerts.length > 0 && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                {warningAlerts.length} Warning{warningAlerts.length !== 1 ? 's' : ''}
              </span>
            )}
            {infoAlerts.length > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {infoAlerts.length} Info
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getAlertColorClass(alert.type)} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{getAlertIcon(alert.type)}</span>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-75">
                    {alert.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeColorClass(alert.type)}`}>
                    {alert.count.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium">{alert.message}</p>
                {alert.link && (
                  <a
                    href={alert.link}
                    className="text-xs underline mt-2 inline-block opacity-75 hover:opacity-100"
                  >
                    View Details →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          {errorAlerts.length > 0
            ? 'Critical issues require immediate attention. Address errors first.'
            : warningAlerts.length > 0
            ? 'Some warnings detected. Address when convenient to improve data quality.'
            : 'Informational items for review. No critical issues detected.'}
        </p>
      </div>
    </div>
  );
}
