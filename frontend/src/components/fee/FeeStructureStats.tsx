import React from 'react';
import { DollarSign, Building2, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface FeeStructureStatsProps {
  totalClasses: number;
  totalAnnualRevenue: number;
  avgPerClass: number;
}

const FeeStructureStats: React.FC<FeeStructureStatsProps> = ({
  totalClasses,
  totalAnnualRevenue,
  avgPerClass,
}) => {
  const stats = [
    {
      label: 'Total Classes',
      value: totalClasses.toString(),
      icon: Building2,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Annual Revenue',
      value: formatCurrency(totalAnnualRevenue),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Average Per Class',
      value: formatCurrency(avgPerClass),
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-slate-200 p-5"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { FeeStructureStats };
