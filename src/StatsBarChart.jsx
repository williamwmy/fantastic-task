import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const WEEKDAYS = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

function getStatsData(log, tasks) {
  // Samle prosent for hver ukedag
  const days = [0,1,2,3,4,5,6];
  const stats = days.map(dayIdx => {
    // Finn alle datoer for denne ukedagen
    const dates = Object.keys(log).filter(date => {
      const d = new Date(date);
      return (d.getDay() === 0 ? 6 : d.getDay() - 1) === dayIdx;
    });
    // Tell antall fullført og totalt
    let done = 0, total = 0;
    dates.forEach(date => {
      const arr = log[date] || [];
      done += arr.filter(Boolean).length;
      total += arr.length;
    });
    return {
      name: WEEKDAYS[dayIdx],
      prosent: total ? Math.round((done / total) * 100) : 0
    };
  });
  return stats;
}

export default function StatsBarChart({ log, tasks }) {
  const data = getStatsData(log, tasks);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
        <Tooltip formatter={v => `${v}%`} />
        <Bar dataKey="prosent" fill="#82bcf4" />
      </BarChart>
    </ResponsiveContainer>
  );
}