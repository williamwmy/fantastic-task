import React, { useState, useEffect } from "react";
import { useReward } from "react-rewards";

// Ukenavn
const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];
const WEEKDAYS_FULL = [
  "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"
];
// Animasjoner og emojis
const ANIMATION_TYPES = ["confetti", "balloons", "emoji"];
const EMOJI_VARIANTS = [
  ["💪", "🏆", "⭐️", "🎉"],
  ["🦵", "🦾", "🦶", "💯"],
  ["👏", "🙌", "😃", "✨"],
  ["🦁", "🐾", "🌟", "🔥"],
  ["🧠", "⚡️", "🥇", "🥳"],
  ["🌈", "🍀", "🦋", "🍎"],
  ["🦄", "🤩", "💥", "🚀"]
];

export function filterTasksForDay(tasks, dateStr) {
  const d = new Date(dateStr);
  const weekday = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return tasks
    .map((t, idx) => ({ ...t, idx }))
    .filter(t => !t.repeat || t.repeat[weekday]);
}

export default function TaskList({
  tasks = [],
  todayLog = [],
  onComplete,
  onComment,
  onAdd,
  compactOnly = false
}) {
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [repeat, setRepeat] = useState([1, 1, 1, 1, 1, 0, 0]);

  // Legg til oppgave (kun når onAdd finnes)
  if (compactOnly) {
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          if (
            taskName.trim() &&
            repeat.some(Boolean)
          ) {
            onAdd({
              name: taskName.trim(),
              desc: taskDesc.trim(),
              repeat,
            });
            setTaskName("");
            setTaskDesc("");
            setRepeat([1, 1, 1, 1, 1, 0, 0]);
          }
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          boxSizing: "border-box" // REMOVE width: "100%"
        }}
      >
        <input
          placeholder="Oppgavenavn"
          value={taskName}
          maxLength={32}
          style={{
            width: "100%",
            marginBottom: 0
          }}
          onChange={e => setTaskName(e.target.value)}
        />
        <input
          placeholder="Beskrivelse (valgfritt)"
          value={taskDesc}
          maxLength={40}
          style={{
            width: "100%",
            marginBottom: 0
          }}
          onChange={e => setTaskDesc(e.target.value)}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 8,
            marginTop: 0
          }}
        >
          {WEEKDAYS.map((d, idx) => (
            <label key={idx} style={{
              fontSize: 13,
              color: "#333",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <input
                type="checkbox"
                checked={!!repeat[idx]}
                onChange={() =>
                  setRepeat(r =>
                    r.map((v, i) => (i === idx ? (v ? 0 : 1) : v))
                  )
                }
                style={{
                  marginBottom: 2,
                  marginRight: 0,
                  width: 28,
                  height: 28,
                  accentColor: "#82bcf4"
                }}
              />
              {d}
            </label>
          ))}
        </div>
        <button
          type="submit"
          style={{
            width: "100%"
          }}
          disabled={
            !taskName.trim() ||
            !repeat.some(Boolean)
          }
        >
          Legg til
        </button>
      </form>
    );
  }

  return (
    <div>
      {tasks.length === 0 ? (
        <div style={{ color: "#aaa", textAlign: "center", margin: 20 }}>
          Ingen oppgaver for i dag.
        </div>
      ) : (
        tasks.map((t, idx) => (
          <TaskRow
            key={t.name + idx}
            task={t}
            idx={idx}
            utført={!!todayLog[idx]?.done}
            kommentar={todayLog[idx]?.comment || ""}
            onComplete={() => onComplete(idx)}
            onComment={txt => onComment(idx, txt)}
          />
        ))
      )}
    </div>
  );
}

function TaskRow({ task, idx, utført, kommentar, onComplete, onComment }) {
  const [animation, setAnimation] = useState("confetti");
  const [emojiList, setEmojiList] = useState(EMOJI_VARIANTS[0]);
  const { reward } = useReward(`reward${idx}`, animation, { emoji: emojiList });
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState(kommentar);

  useEffect(() => {
    setComment(kommentar);
  }, [kommentar]);

  const handleFullfør = () => {
    onComplete();
    if (!utført) {
      const anim = ANIMATION_TYPES[Math.floor(Math.random() * ANIMATION_TYPES.length)];
      setAnimation(anim);
      if (anim === "emoji") {
        setEmojiList(EMOJI_VARIANTS[Math.floor(Math.random() * EMOJI_VARIANTS.length)]);
      }
      setTimeout(() => reward(), 120); // Liten delay for visuell respons
    }
  };

  return (
    <div
      style={{
        position: "relative",
        background: utført ? "#d2ffd2" : "#fff",
        marginBottom: 12,
        padding: "1rem",
        borderRadius: 15,
        boxShadow: "0 2px 8px #0001",
        cursor: "pointer",
        opacity: utført ? 0.7 : 1,
        fontSize: 17,
        display: "flex",
        flexDirection: "column",
        minHeight: 80,
        justifyContent: "center",
        overflow: "hidden" // viktig for at streken ikke skal gå utenfor boksen
      }}
      onClick={handleFullfør}
    >
      {/* Strek gjennom boksen hvis utført */}
      {utført && (
        <>
          {/* /-strek */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "140%",
              height: 0,
              borderTop: "8px solid #53af67",
              transform: "translate(-50%, -50%) rotate(45deg)",
              zIndex: 2,
              pointerEvents: "none",
              opacity: 0.5,
            }}
          />
          {/* \-strek */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "140%",
              height: 0,
              borderTop: "8px solid #53af67",
              transform: "translate(-50%, -50%) rotate(-45deg)",
              zIndex: 2,
              pointerEvents: "none",
              opacity: 0.5,
            }}
          />
        </>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontWeight: 600 }}>{task.name}</span>
        {utført && (
          <span style={{ color: "#53af67", fontSize: 18, marginLeft: 4 }}>✅</span>
        )}
      </div>
      {task.desc && (
        <span style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
          {task.desc}
        </span>
      )}
      {task.repeat && (
        <span style={{ fontSize: 12, color: "#297", marginTop: 2 }}>
          {WEEKDAYS_FULL.map(
            (d, i) => task.repeat[i] ? d.slice(0, 2) + " " : ""
          )}
        </span>
      )}
      <span id={`reward${idx}`} style={{ position: "absolute", right: 22, top: 5 }}></span>
      <button
        style={{
          marginTop: 10,
          fontSize: 13,
          padding: "0.2rem 0.7rem",
          borderRadius: 9,
          background: "#e2e9f9",
          border: "none",
          cursor: "pointer",
          alignSelf: "flex-end"
        }}
        onClick={e => {
          e.stopPropagation();
          setShowComment(s => !s);
        }}
      >
        {showComment ? "Lukk kommentar" : "Kommentar"}
      </button>
      {showComment && (
        <div style={{ marginTop: 8 }}>
          <textarea
            maxLength={80}
            placeholder="Legg til kommentar ..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            onBlur={() => onComment(comment)}
            style={{
              width: "100%",
              minHeight: 32,
              maxHeight: 80,
              resize: "none",
              overflow: "auto",
              boxSizing: "border-box"
            }}
          />
        </div>
      )}
    </div>
  );
}
