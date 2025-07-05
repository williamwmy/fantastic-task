import React, { useState, useEffect } from "react";
import { filterTasksForDay } from "./TaskList";

function listRecentDates(n = 7) {
  const arr = [];
  for (let i = 0; i < n; ++i) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr.reverse();
}

export default function Stats({ log, tasks, onEditLog }) {
  const [editDay, setEditDay] = useState("");
  const recentDates = listRecentDates(7);

  // Nullstill valgt dag hvis tasks eller log endres (bytte profil)
  useEffect(() => {
    setEditDay("");
  }, [tasks, log]);

  const showTasks = editDay
    ? filterTasksForDay(tasks, editDay)
    : tasks;

  const getLogForDay = d =>
    log[d] ||
    filterTasksForDay(tasks, d).map(() => false);

  // For bar chart
  const counts = recentDates.map(
    d => getLogForDay(d).filter(Boolean).length
  );
  const max = Math.max(...counts, 1);

  return (
    <div style={{
      padding: "1.3rem",
      background: "#f9f6f2",
      borderRadius: "2rem",
      marginTop: 18
    }}>
      <h3 style={{ textAlign: "center", marginBottom: 14 }}>
        Statistikk for valgt profil
      </h3>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "end", height: 100 }}>
        {recentDates.map((d, i) => (
          <div key={d} style={{ width: 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                height: 70 * (counts[i] / max),
                width: 20,
                background: "#82bcf4",
                borderRadius: 7,
                marginBottom: 4
              }}
            />
            <div style={{ fontSize: 11, color: "#888" }}>
              {d.slice(5)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ margin: "0.8rem 0" }}>
        <label>
          <span style={{ fontSize: 13 }}>Velg dato for å redigere: </span>
          <select
            value={editDay || ""}
            onChange={e => setEditDay(e.target.value)}
            style={{ marginLeft: 10, fontSize: 14, borderRadius: 7, padding: 2 }}
          >
            <option value="">Dagens status</option>
            {recentDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      <table style={{ width: "100%", marginTop: 8, fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Oppgave</th>
            <th style={{ textAlign: "center" }}>Utført</th>
          </tr>
        </thead>
        <tbody>
          {showTasks.map((t, idx) => (
            <tr key={t.idx ?? idx}>
              <td>{t.name}</td>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={!!getLogForDay(editDay || recentDates[recentDates.length - 1])[t.idx ?? idx]}
                  onChange={e =>
                    onEditLog(
                      editDay || recentDates[recentDates.length - 1],
                      t.idx ?? idx,
                      e.target.checked
                    )
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
