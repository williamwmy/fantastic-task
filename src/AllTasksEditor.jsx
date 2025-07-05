import React, { useState } from "react";

const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];

export default function AllTasksEditor({ tasks, onChange }) {
  const [editTasks, setEditTasks] = useState(() =>
    tasks.map(t => ({ ...t }))
  );

  const handleChange = (idx, field, value) => {
    const updated = editTasks.map((t, i) =>
      i === idx ? { ...t, [field]: value } : t
    );
    setEditTasks(updated);
    onChange(updated);
  };

  const handleRepeatChange = (idx, dayIdx) => {
    const updated = editTasks.map((t, i) => {
      if (i !== idx) return t;
      const repeat = t.repeat ? [...t.repeat] : [1,1,1,1,1,0,0];
      repeat[dayIdx] = repeat[dayIdx] ? 0 : 1;
      return { ...t, repeat };
    });
    setEditTasks(updated);
    onChange(updated);
  };

  const handleDelete = idx => {
    const updated = editTasks.filter((_, i) => i !== idx);
    setEditTasks(updated);
    onChange(updated);
  };

  return (
    <div style={{ maxHeight: 350, overflowY: "auto" }}>
      {editTasks.length === 0 && <div style={{ color: "#aaa" }}>Ingen oppgaver.</div>}
      {editTasks.map((t, idx) => (
        <div key={idx} style={{
          background: "#f7faff",
          borderRadius: 10,
          padding: 10,
          marginBottom: 10,
          boxShadow: "0 1px 4px #0001"
        }}>
          <input
            value={t.name}
            onChange={e => handleChange(idx, "name", e.target.value)}
            style={{ width: "100%", marginBottom: 4 }}
            maxLength={32}
          />
          <input
            value={t.desc || ""}
            onChange={e => handleChange(idx, "desc", e.target.value)}
            style={{ width: "100%", marginBottom: 4 }}
            maxLength={40}
            placeholder="Beskrivelse"
          />
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {WEEKDAYS.map((d, dayIdx) => (
              <label key={dayIdx} style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={t.repeat ? !!t.repeat[dayIdx] : false}
                  onChange={() => handleRepeatChange(idx, dayIdx)}
                  style={{ marginRight: 2 }}
                />
                {d}
              </label>
            ))}
          </div>
          <button
            style={{ background: "#fbb", color: "#900", fontSize: 13, borderRadius: 7 }}
            onClick={() => handleDelete(idx)}
          >
            Slett
          </button>
        </div>
      ))}
    </div>
  );
}