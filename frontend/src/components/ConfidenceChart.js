import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ConfidenceChart({ probs }) {

  // ✅ Safety check
  if (!probs || Object.keys(probs).length === 0) {
    return <p className="text-gray-400">No probability data</p>;
  }

  // Convert object → array for Recharts
  const data = Object.entries(probs).map(([key, value]) => ({
    name: key,
    value: (value * 100).toFixed(2),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip />
          <Bar dataKey="value" fill="#00D4FF" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
