interface DashboardCardProps {
  title: string;
  value: number | string;
}

export default function DashboardCard({
  title,
  value,
}: DashboardCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md border">
      <p className="text-gray-500 text-sm">{title}</p>

      <h2 className="mt-2 text-3xl font-bold text-violet-700">
        {value}
      </h2>
    </div>
  );
}