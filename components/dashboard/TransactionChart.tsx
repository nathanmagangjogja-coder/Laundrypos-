'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
const data = Array.from({ length: 7 }).map((_, i) => ({
  day: ['Sen','Sel','Rab','Kam','Jum','Sab','Min'][i],
  transaksi: Math.round(5 + Math.random() * 25),
}));
export function TransactionChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="day" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Bar dataKey="transaksi" fill="hsl(152 76% 44%)" radius={[6,6,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
