import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
}

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center shadow-lg">
      <div className="p-3 bg-gray-800 rounded-lg mr-4">
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  );
}
