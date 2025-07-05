import React, { useState } from "react";

export default function ProfileSelector({ profiles, current, onSelect, onAdd, onRename, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editName, setEditName] = useState("");

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
      {profiles.map((p, idx) =>
        editingIdx === idx ? (
          <form key={idx} onSubmit={e => {
            e.preventDefault();
            if (editName.trim()) {
              onRename(idx, editName.trim());
              setEditingIdx(null);
            }
          }}>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              style={{ borderRadius: 7, padding: 3 }}
              autoFocus
            />
            <button type="submit" style={{ marginLeft: 4 }}>Lagre</button>
            <button type="button" style={{ marginLeft: 2 }} onClick={() => setEditingIdx(null)}>Avbryt</button>
          </form>
        ) : (
          <div key={idx}
            style={{
              background: current === idx ? "#82bcf4" : "#e6ecf7",
              padding: "0.3rem 0.9rem",
              borderRadius: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
            onClick={() => onSelect(idx)}
          >
            {p.name}
            <button
              title="Rediger"
              style={{ marginLeft: 2, fontSize: 12 }}
              onClick={e => {
                e.stopPropagation();
                setEditingIdx(idx);
                setEditName(p.name);
              }}
            >✏️</button>
            {profiles.length > 1 && (
              <button
                title="Slett"
                style={{ marginLeft: 2, fontSize: 12, color: "#c23" }}
                onClick={e => {
                  e.stopPropagation();
                  if (window.confirm("Slett profil og alle oppgaver?")) {
                    onDelete(idx);
                  }
                }}
              >🗑️</button>
            )}
          </div>
        )
      )}
      {adding ? (
        <form onSubmit={e => {
          e.preventDefault();
          if (newName.trim()) {
            onAdd(newName.trim());
            setNewName("");
            setAdding(false);
          }
        }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            style={{ borderRadius: 7, padding: 3 }}
          />
          <button type="submit" style={{ marginLeft: 4 }}>Legg til</button>
          <button type="button" style={{ marginLeft: 2 }} onClick={() => setAdding(false)}>Avbryt</button>
        </form>
      ) : (
        <button style={{ fontSize: 15, borderRadius: 8, padding: "0.1rem 0.8rem" }}
          onClick={() => setAdding(true)}
        >+ Ny profil</button>
      )}
    </div>
  );
}
