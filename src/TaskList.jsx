import React, { useState } from "react";
import { useReward } from "react-rewards";

// ANIMATION_TYPES og EMOJI_VARIANTS for emoji-randomisering
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

// Bruk gjerne denne filterTasksForDay hvis du bruker repeat/dager
export function filterTasksForDay(tasks, dateStr) {
  // Hvis du har repeat: [1,1,1,1,1,0,0] for ukedager (mandag-søndag)
  const d = new Date(dateStr);
  const weekday = d.getDay() === 0 ? 6 : d.getDay() - 1; // mandag=0 ... søndag=6
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
        style={{ marginBottom: 18 }}
      >
        <input
          placeholder="Oppgavenavn"
          value={taskName}
          maxLength={32}
          style={{
            width: "100%",
            marginBottom: 6
          }}
          onChange={e => setTaskName(e.target.value)}
        />
        <input
          placeholder="Beskrivelse (valgfritt)"
          value={taskDesc}
          maxLength={40}
          style={{
            width: "100%",
            marginBottom: 8
          }}
          onChange={e => setTaskDesc(e.target.value)}
        />
        <div style={{
          display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap"
        }}>
          {["M", "T", "O", "T", "F", "L", "S"].map((d, idx) => (
            <label key={idx} style={{ fontSize: 13, color: "#333" }}>
              <input
                type="checkbox"
                checked={!!repeat[idx]}
                onChange={() =>
                  setRepeat(r =>
                    r.map((v, i) => (i === idx ? (v ? 0 : 1) : v))
                  )
                }
                style={{ marginRight: 2 }}
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
            utført={!!todayLog[idx]}
            onComplete={() => onComplete(idx)}
            onComment={txt => onComment(idx, txt)}
          />
        ))
      )}
    </div>
  );
}

function TaskRow({ task, idx, utført, onComplete, onComment }) {
  const [animation, setAnimation] = useState("confetti");
  const [emojiList, setEmojiList] = useState(EMOJI_VARIANTS[0]);
  const { reward } = useReward(`reward${idx}`, animation, { emoji: emojiList });
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState(task.comment || "");

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
        textDecoration: utført ? "line-through" : "none",
        opacity: utført ? 0.7 : 1,
        fontSize: 17,
        display: "flex",
        flexDirection: "column"
      }}
      onClick={handleFullfør}
    >
      <span style={{ fontWeight: 600 }}>{task.name}</span>
      {task.desc && (
        <span style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
          {task.desc}
        </span>
      )}
      {task.repeat && (
        <span style={{ fontSize: 12, color: "#297", marginTop: 2 }}>
          {["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"].map(
            (d, i) => task.repeat[i] ? d + " " : ""
          )}
        </span>
      )}
      <span id={`reward${idx}`} style={{ position: "absolute", right: 22, top: 5 }}></span>
      {utført && (
        <span style={{ color: "#53af67", marginTop: 5 }}>✅ Utført!</span>
      )}
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
            style={{
              width: "100%",
              minHeight: 40,
              borderRadius: 7,
              border: "1px solid #bbb",
              fontSize: 15,
              padding: "0.3rem"
            }}
            maxLength={80}
            placeholder="Legg til kommentar ..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            onBlur={() => onComment(comment)}
          />
        </div>
      )}
    </div>
  );
}
