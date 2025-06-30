import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import { MoodTrend } from '../../types';

interface MoodChartProps {
  data: MoodTrend[];
}

export function MoodChart({ data }: MoodChartProps) {
  const chartData = data.map(trend => ({
    date: format(trend.date, 'MMM dd'),
    intensity: trend.intensity,
    mood: trend.mood
  }));

  return (
    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Mood Trends</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            fontSize={12}
            fontWeight={500}
          />
          <YAxis 
            domain={[0, 1]}
            stroke="#64748b"
            fontSize={12}
            fontWeight={500}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              backdropFilter: 'blur(16px)',
              fontWeight: 500
            }}
            formatter={(value: number, name: string) => [
              `${Math.round(value * 100)}%`,
              'Intensity'
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="intensity" 
            stroke="url(#gradient)" 
            strokeWidth={4}
            dot={{ fill: '#6366f1', strokeWidth: 3, r: 6 }}
            activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 3, fill: '#ffffff' }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}