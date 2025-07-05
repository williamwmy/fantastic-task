import React from "react";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("no-NO", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

export default function Stats({ log = {}, tasks = [], onEditLog }) {
  // Finn alle datoer (sortert nyeste først)
  const dates = Object.keys(log).sort((a, b) => b.localeCompare(a));
  if (!dates.length) {
    return (
      <div style={{ color: "#999", textAlign: "center", margin: "2rem 0" }}>
        Ingen historikk ennå.
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.98rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.2rem 0.4rem" }}>Dato</th>
            {tasks.map((t, i) => (
              <th key={i} style={{ textAlign: "center", padding: "0.2rem 0.4rem" }}>
                {t.name.length > 7 ? t.name.slice(0, 7) + "…" : t.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map(date => (
            <tr key={date} style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "0.2rem 0.4rem", fontWeight: 500 }}>{formatDate(date)}</td>
              {(log[date] || []).map((done, idx) => (
                <td key={idx} style={{ textAlign: "center", padding: "0.2rem 0.4rem" }}>
                  <input
                    type="checkbox"
                    checked={!!done}
                    onChange={e => onEditLog(date, idx, e.target.checked)}
                    style={{ margin: 0 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
