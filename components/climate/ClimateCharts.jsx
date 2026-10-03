'use client';

// City climate page ke teen charts (recharts browser mein chalta hai).
// Data server page (page.js) se props mein aata hai — yahan koi API call
// nahi. Section ka dabba aur heading server par hi bante hain.
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useUnits } from '@/context/UnitsContext';

export function TemperatureChart({ chartData }) {
  // °C/°F (audit 3.2) — high/low user ki unit mein
  const units = useUnits();
  const data = chartData.map((d) => ({ ...d, high: units.temp1(d.high), low: units.temp1(d.low) }));
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
          <YAxis tick={{ fontSize: 12, fill: '#64748B' }} unit={units.tempSymbol} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="high" name="Avg High" stroke="#0077b6" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="low" name="Avg Low" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RainfallChart({ chartData }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
          <YAxis tick={{ fontSize: 12, fill: '#64748B' }} unit="mm" />
          <Tooltip />
          <Bar dataKey="rain" name="Rainfall" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SunshineChart({ chartData }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="sunshineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
          <YAxis tick={{ fontSize: 12, fill: '#64748B' }} unit="h" />
          <Tooltip />
          <Area type="monotone" dataKey="sunshine" name="Sunshine" stroke="#f59e0b" strokeWidth={2.5} fill="url(#sunshineGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
