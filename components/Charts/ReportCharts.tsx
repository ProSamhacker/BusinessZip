'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts';

interface ChartData {
  name: string;
  'Your Location': number;
  'US Average': number;
}

interface ReportChartsProps {
  incomeData: ChartData[];
  populationData: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-bold mb-1">{label}</p>
        <p style={{ color: payload[0].color }}>
          {payload[0].name}: ${payload[0].value.toLocaleString()}
        </p>
        <p style={{ color: payload[1].color }}>
          {payload[1].name}: ${payload[1].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function ReportCharts({ incomeData, populationData }: ReportChartsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Income Chart */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Median Household Income
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeData} margin={{ left: 20 }}>
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toLocaleString()}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Your Location" fill="#4f46e5" />
            <Bar dataKey="US Average" fill="#a5b4fc" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Population Chart */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Population
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={populationData} margin={{ left: 20 }}>
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
            />
            <Tooltip
              formatter={(value: number) => value.toLocaleString()}
            />
            <Legend />
            <Bar dataKey="Your Location" fill="#16a34a" />
            <Bar dataKey="US Average" fill="#86efac" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
