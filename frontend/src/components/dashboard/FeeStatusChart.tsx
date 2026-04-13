import React from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface FeeStatusChartProps {
  paid: number;
  pending: number;
  partial: number;
}

const FeeStatusChart: React.FC<FeeStatusChartProps> = ({
  paid,
  pending,
  partial,
}) => {
  const navigate = useNavigate();
  const total = paid + pending + partial;
  const data = [
    { name: "Paid", value: paid, color: "#10B981" },
    { name: "Pending", value: pending, color: "#EF4444" },
    { name: "Waived", value: partial, color: "#F59E0B" },
  ];

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-display font-bold text-slate-800 tracking-tight">
          Fee Status Overview
        </h3>
        <button
          onClick={() => navigate("/admin/fees")}
          className=" text-blue-600 text-sm font-bold hover:underline"
        >
          Full Report
        </button>
      </div>

      <div className="flex items-center gap-8">
        <div className="w-40 h-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={1}
                dataKey="value"
                stroke="none"
                cornerRadius={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              Total
            </span>
            <span className="text-xs font-bold text-slate-600">
              ₹
              {total > 999
                ? `${(total / 1000).toFixed(1)}K`
                : total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-slate-500 text-xs font-medium">
                  {item.name}
                </span>
              </div>
              <span className="text-slate-900 font-bold text-xs">
                ₹{item.value.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeeStatusChart;
