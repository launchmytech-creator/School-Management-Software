import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FeeLineChartProps {
  data: Array<{
    month?: string;
    amount?: number;
    [key: string]: unknown;
  }>;
}

const FeeLineChart: React.FC<FeeLineChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
        No data available
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    month: item.month || '',
    amount: item.amount || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="month" 
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Collection']}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#4A9FD4"
          strokeWidth={2}
          dot={{ fill: '#4A9FD4', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#1E3A5F' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default FeeLineChart;
