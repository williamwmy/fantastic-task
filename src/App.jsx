import React, { useState, useEffect } from "react";
import { loadData, saveData } from "./localStorage";
import ProfileSelector from "./ProfileSelector";
import TaskList, { filterTasksForDay } from "./TaskList";
import Stats from "./Stats";
import Modal from "./Modal";

const todayStr = () => new Date().toISOString().slice(0, 10);

function defaultProfile(name) {
  return {
    name,
    tasks: [],
    log: {}
  };
}

export default function App() {
  const [data, setData] = useState(() =>
    loadData() || {
      profiles: [defaultProfile("Min profil")]
    }
  );
  const [profileIdx, setProfileIdx] = useState(0);
  const profile = data.profiles[profileIdx];

  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const todayTasks = filterTasksForDay(profile.tasks, todayStr());
  const todayLog = profile.log[todayStr()] || todayTasks.map(() => false);

  const addProfile = name => {
    setData(d => ({
      ...d,
      profiles: [...d.profiles, defaultProfile(name)]
    }));
    setProfileIdx(data.profiles.length);
  };

  const handleRenameProfile = (idx, newName) => {
    setData(d => {
      const copy = JSON.parse(JSON.stringify(d));
      copy.profiles[idx].name = newName;
      return copy;
    });
  };

  const handleDeleteProfile = idx => {
    setData(d => {
      const copy = JSON.parse(JSON.stringify(d));
      copy.profiles.splice(idx, 1);
      return {
        ...copy,
        profiles: copy.profiles,
      };
    });
    setProfileIdx(prev =>
      prev === idx ? 0 : prev > idx ? prev - 1 : prev
    );
  };

  const handleTaskAdd = t => {
    setData(d => {
      const copy = JSON.parse(JSON.stringify(d));
      copy.profiles[profileIdx].tasks.push(t);
      return copy;
    });
  };

  const handleTaskToggle = idx => {
    setData(d => {
      const copy = JSON.parse(JSON.stringify(d));
      const key = todayStr();
      const tasksToday = filterTasksForDay(copy.profiles[profileIdx].tasks, key);
      if (!copy.profiles[profileIdx].log[key]) {
        copy.profiles[profileIdx].log[key] = tasksToday.map(() => false);
      }
      copy.profiles[profileIdx].log[key][idx] = !copy.profiles[profileIdx].log[key][idx];
      return copy;
    });
  };

  const handleComment = (idx, txt) => {
    setData(d => {
      const copy = JSON.parse(JSON.stringify(d));
      const tasksToday = filterTasksForDay(copy.profiles[profileIdx].tasks, todayStr());
      const fullTaskIdx = tasksToday[idx].idx;
      copy.profiles[profileIdx].tasks[fullTaskIdx].comment = txt;
      return copy;
    });
  };

  const handleEditLog = (date, idx, value) => {
    setData(d => {
      const copy = JSON.parse(JSON.stringify(d));
      const allTasks = copy.profiles[profileIdx].tasks;
      const tasksThatDay = filterTasksForDay(allTasks, date);
      if (!copy.profiles[profileIdx].log[date]) {
        copy.profiles[profileIdx].log[date] = tasksThatDay.map(() => false);
      }
      copy.profiles[profileIdx].log[date][idx] = value;
      return copy;
    });
  };

  useEffect(() => {
    setData(d => {
      const copy = JSON.parse(JSON.stringify(d));
      const log = copy.profiles[profileIdx].log;
      const key = todayStr();
      const tasksToday = filterTasksForDay(copy.profiles[profileIdx].tasks, key);
      if (!log[key] || log[key].length !== tasksToday.length) {
        log[key] = tasksToday.map(() => false);
      }
      return copy;
    });
    // eslint-disable-next-line
  }, [profileIdx, profile.tasks.length]);

  return (
    <div style={{ minHeight: "100vh", padding: "1rem" }}>
      {/* Top bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem"
      }}>
        <div style={{ fontWeight: 600 }}>{profile.name}</div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setShowProfileModal(true)}>Bytt profil</button>
          <button onClick={() => setShowStats(true)}>Statistikk</button>
        </div>
      </div>

      {/* Task List */}
      <TaskList
        tasks={todayTasks}
        todayLog={todayLog}
        onComplete={handleTaskToggle}
        onComment={handleComment}
        onAdd={handleTaskAdd}
      />

      <button
        onClick={() => setShowAddModal(true)}
        aria-label="Legg til oppgave"
        style={{ margin: "1rem 0" }} // Optional: adds spacing
      >
        +
      </button>

      {/* Add Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
        <h3>Ny oppgave</h3>
        <TaskList
          tasks={[]}
          todayLog={[]}
          onAdd={t => {
            handleTaskAdd(t);
            setShowAddModal(false);
          }}
          onComplete={() => {}}
          onComment={() => {}}
          compactOnly={true}
        />
        <button onClick={() => setShowAddModal(false)} style={{ marginTop: 10 }}>Lukk</button>
      </Modal>

      {/* Profile Modal */}
      <Modal open={showProfileModal} onClose={() => setShowProfileModal(false)}>
        <h3>Velg profil</h3>
        <ProfileSelector
          profiles={data.profiles}
          current={profileIdx}
          onSelect={i => {
            setProfileIdx(i);
            setShowProfileModal(false);
          }}
          onAdd={addProfile}
          onRename={handleRenameProfile}
          onDelete={handleDeleteProfile}
        />
        <button onClick={() => setShowProfileModal(false)} style={{ marginTop: 10 }}>Lukk</button>
      </Modal>

      {/* Stats Modal */}
      <Modal open={showStats} onClose={() => setShowStats(false)}>
        <Stats
          log={profile.log || {}}
          tasks={profile.tasks}
          onEditLog={handleEditLog}
        />
        <button onClick={() => setShowStats(false)} style={{ marginTop: 10 }}>Lukk</button>
      </Modal>
    </div>
  );
}
