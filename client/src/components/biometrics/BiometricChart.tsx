import { useState } from "react";
import { BiometricData } from "@/types";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

interface BiometricChartProps {
  data: BiometricData;
}

export function BiometricChart({ data }: BiometricChartProps) {
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([]);

  // In real application, this would be populated with actual data
  // Simulated for POC purposes
  useState(() => {
    const mockData = [];
    const now = new Date();
    
    for (let i = 10; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      mockData.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Math.random() * 30 + 50 // Random value between 50-80
      });
    }
    
    setChartData(mockData);
  }, []);

  return (
    <div className="h-32 sm:h-40 bg-neutral-light rounded-lg flex items-center justify-center overflow-hidden">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10 }} 
              tickFormatter={(value) => value}
            />
            <YAxis 
              domain={[50, 100]} 
              tick={{ fontSize: 10 }} 
              tickCount={3} 
              width={30}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} bpm`, 'Heart Rate']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <span className="text-neutral-mid text-sm">Heart Rate Variability Chart</span>
      )}
    </div>
  );
}
