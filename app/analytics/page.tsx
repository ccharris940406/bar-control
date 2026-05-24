import SalesChart from "@/components/sales-chart";
import { supabase } from "@/lib/supabase";
import { getTodayMexico } from "@/lib/date";

function groupByDay(items: any[], field: string) {
  const map: Record<string, number> = {};
  items?.forEach((item) => {
    const day = item.created_at.split("T")[0];
    map[day] = (map[day] || 0) + parseFloat(item[field]);
  });
  return map;
}

function groupByMonth(items: any[], field: string) {
  const map: Record<string, number> = {};
  items?.forEach((item) => {
    const month = item.created_at.substring(0, 7);
    map[month] = (map[month] || 0) + parseFloat(item[field]);
  });
  return map;
}

function mergeKeys(...maps: Record<string, number>[]) {
  const keys = new Set(maps.flatMap((m) => Object.keys(m)));
  return Array.from(keys).sort();
}

export default async function AnalyticsPage() {
  // Usar fecha de México como base para todos los rangos
  const lastDay = getTodayMexico();
  const today = new Date(lastDay + "T12:00:00"); // mediodía para evitar problemas de DST

  // Mes actual
  const firstDayOfMonth = `${lastDay.substring(0, 7)}-01`;

  // Semana actual (lunes a hoy)
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const firstDayOfWeek = monday.toISOString().split("T")[0];

  // Este año
  const firstDayOfYear = `${lastDay.substring(0, 4)}-01-01`;

  // IDs de cajas del año para filtrar gastos
  const { data: registers } = await supabase
    .from("cash_registers")
    .select("id")
    .gte("date", firstDayOfYear)
    .lte("date", lastDay);

  const registerIds = registers?.map((r) => r.id) || [];

  const [
    { data: salesDay }, { data: expDay },
    { data: salesWeek }, { data: expWeek },
    { data: salesMonth }, { data: expMonth },
  ] = await Promise.all([
    // Mes actual
    supabase.from("sales").select("total, created_at")
      .gte("created_at", `${firstDayOfMonth}T00:00:00`)
      .lte("created_at", `${lastDay}T23:59:59`),
    supabase.from("expenses").select("amount, created_at")
      .in("cash_register_id", registerIds.length > 0 ? registerIds : [""])
      .gte("created_at", `${firstDayOfMonth}T00:00:00`)
      .lte("created_at", `${lastDay}T23:59:59`),
    // Semana actual (lunes a hoy)
    supabase.from("sales").select("total, created_at")
      .gte("created_at", `${firstDayOfWeek}T00:00:00`)
      .lte("created_at", `${lastDay}T23:59:59`),
    supabase.from("expenses").select("amount, created_at")
      .in("cash_register_id", registerIds.length > 0 ? registerIds : [""])
      .gte("created_at", `${firstDayOfWeek}T00:00:00`)
      .lte("created_at", `${lastDay}T23:59:59`),
    // Este año
    supabase.from("sales").select("total, created_at")
      .gte("created_at", `${firstDayOfYear}T00:00:00`)
      .lte("created_at", `${lastDay}T23:59:59`),
    supabase.from("expenses").select("amount, created_at")
      .in("cash_register_id", registerIds.length > 0 ? registerIds : [""])
      .gte("created_at", `${firstDayOfYear}T00:00:00`)
      .lte("created_at", `${lastDay}T23:59:59`),
  ]);

  // Agrupar por día (mes actual)
  const salesDayMap = groupByDay(salesDay || [], "total");
  const expDayMap = groupByDay(expDay || [], "amount");
  const dailyData = mergeKeys(salesDayMap, expDayMap).map((date) => ({
    date,
    ventas: parseFloat((salesDayMap[date] || 0).toFixed(2)),
    gastos: parseFloat((expDayMap[date] || 0).toFixed(2)),
  }));

  // Agrupar por día (semana actual, sin reagrupar)
  const salesWeekMap = groupByDay(salesWeek || [], "total");
  const expWeekMap = groupByDay(expWeek || [], "amount");
  const weeklyData = mergeKeys(salesWeekMap, expWeekMap).map((date) => ({
    date,
    ventas: parseFloat((salesWeekMap[date] || 0).toFixed(2)),
    gastos: parseFloat((expWeekMap[date] || 0).toFixed(2)),
  }));

  // Agrupar por mes (este año)
  const salesMonthMap = groupByMonth(salesMonth || [], "total");
  const expMonthMap = groupByMonth(expMonth || [], "amount");
  const monthlyData = mergeKeys(salesMonthMap, expMonthMap).map((date) => ({
    date,
    ventas: parseFloat((salesMonthMap[date] || 0).toFixed(2)),
    gastos: parseFloat((expMonthMap[date] || 0).toFixed(2)),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <SalesChart
        dailyData={dailyData}
        weeklyData={weeklyData}
        monthlyData={monthlyData}
      />
    </div>
  );
}
