"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DataPoint = { date: string; ventas: number; gastos: number };

type Props = {
  dailyData: DataPoint[];
  weeklyData: DataPoint[];
  monthlyData: DataPoint[];
};

type View = "week" | "day" | "month";

function formatDate(date: string, view: View) {
  if (view === "month") {
    const [year, month] = date.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
      "es-ES", { month: "short", year: "2-digit" }
    );
  }
  return new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: view === "week" ? "short" : undefined,
    day: "2-digit",
    month: "short",
  });
}

const periodLabel: Record<View, string> = {
  week: "Semana actual",
  day: "Mes actual",
  month: "Este año",
};

export default function SalesChart({ dailyData, weeklyData, monthlyData }: Props) {
  const [view, setView] = useState<View>("week");

  const tabs: { key: View; label: string }[] = [
    { key: "week", label: "Esta semana" },
    { key: "day", label: "Este mes" },
    { key: "month", label: "Este año" },
  ];

  const rawData = view === "week" ? weeklyData : view === "day" ? dailyData : monthlyData;

  const chartData = rawData.map((d) => ({
    ...d,
    label: formatDate(d.date, view),
  }));

  const totalVentas = rawData.reduce((sum, d) => sum + d.ventas, 0);
  const totalGastos = rawData.reduce((sum, d) => sum + d.gastos, 0);
  const balance = totalVentas - totalGastos;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === tab.key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resumen */}
      <p className="text-xs text-slate-400">{periodLabel[view]}</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Ventas</p>
          <p className="text-2xl font-bold text-green-700">${totalVentas.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">Gastos</p>
          <p className="text-2xl font-bold text-red-700">${totalGastos.toFixed(2)}</p>
        </div>
        <div className={`border rounded-lg p-4 ${balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <p className={`text-sm ${balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>Balance</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráfica */}
      <div className="bg-white p-4 rounded-lg border">
        {!chartData.length ? (
          <p className="text-slate-500 text-center py-8">Sin datos para mostrar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [
                  `$${Number(value).toFixed(2)}`,
                  name === "ventas" ? "Ventas" : "Gastos",
                ]}
              />
              <Legend formatter={(value) => value === "ventas" ? "Ventas" : "Gastos"} />
              <Bar dataKey="ventas" fill="#22c55e" radius={[4, 4, 0, 0]} name="ventas" />
              <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="gastos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
