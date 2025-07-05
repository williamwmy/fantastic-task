import React, { useState, useEffect } from "react";
import { loadData, saveData } from "./localStorage";
import ProfileSelector from "./ProfileSelector";
import TaskList, { filterTasksForDay } from "./TaskList";
import StatsBarChart from "./StatsBarChart";
import Modal from "./Modal";
import AllTasksEditor from "./AllTasksEditor";
import { FaUser, FaChartBar, FaList, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";

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
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const todayTasks = filterTasksForDay(profile.tasks, selectedDate);
  let todayLog = profile.log[selectedDate] || todayTasks.map(() => ({ done: false, comment: "" }));

  // Migrer gamle boolean-verdier til objekt
  todayLog = todayLog.map(entry =>
    typeof entry === "object"
      ? entry
      : { done: !!entry, comment: "" }
  );

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
      const log = copy.profiles[profileIdx].log;
      if (!log[selectedDate]) {
        log[selectedDate] = todayTasks.map(() => ({ done: false, comment: "" }));
      }
      // Migrer gamle booleans til objekt
      log[selectedDate] = log[selectedDate].map(entry =>
        typeof entry === "object"
          ? entry
          : { done: !!entry, comment: "" }
      );
      log[selectedDate][idx].done = !log[selectedDate][idx].done;
      return copy;
    });
  };

  const handleComment = (idx, txt) => {
    setData(d => {
      const copy = JSON.parse(JSON.stringify(d));
      const log = copy.profiles[profileIdx].log;
      if (!log[selectedDate]) {
        log[selectedDate] = todayTasks.map(() => ({ done: false, comment: "" }));
      }
      log[selectedDate][idx].comment = txt;
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
        {/* Farget sirkel med forbokstav */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#82bcf4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: 22,
          marginRight: 8
        }}>
          {profile.name[0].toUpperCase()}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setShowProfileModal(true)}
            title="Bytt profil"
            style={{ width: 44, height: 44, borderRadius: "50%", padding: 0, fontSize: 22, background: "#eaf1fb", color: "#297", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <FaUser />
          </button>
          <button
            onClick={() => setShowStats(true)}
            title="Statistikk"
            style={{ width: 44, height: 44, borderRadius: "50%", padding: 0, fontSize: 22, background: "#eaf1fb", color: "#297", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <FaChartBar />
          </button>
          <button
            onClick={() => setShowAllTasks(true)}
            title="Alle oppgaver"
            style={{ width: 44, height: 44, borderRadius: "50%", padding: 0, fontSize: 22, background: "#eaf1fb", color: "#297", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <FaList />
          </button>
        </div>
      </div>

      {/* Date navigation */}
      {/* Task List */}
      <TaskList
        tasks={todayTasks}
        todayLog={todayLog}
        onComplete={handleTaskToggle}
        onComment={handleComment}
        onAdd={handleTaskAdd}
      />

      {/* Flyttet datovelgeren hit */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "32px 0" }}>
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(d.toISOString().slice(0, 10));
          }}
          style={{
            background: "#82bcf4",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer"
          }}
          aria-label="Forrige dag"
        >
          <FaChevronLeft />
        </button>
        <span style={{ minWidth: 140, textAlign: "center", fontSize: 22, fontWeight: 700 }}>
          {new Date(selectedDate).toLocaleDateString("no-NO", { weekday: "long", day: "2-digit", month: "2-digit" })}
        </span>
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 1);
            setSelectedDate(d.toISOString().slice(0, 10));
          }}
          style={{
            background: "#82bcf4",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer"
          }}
          aria-label="Neste dag"
        >
          <FaChevronRight />
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          aria-label="Legg til oppgave"
          style={{
            background: "#82bcf4",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer"
          }}
        >
          <FaPlus />
        </button>
      </div>

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
        <h3>Statistikk</h3>
        <StatsBarChart log={profile.log || {}} tasks={profile.tasks} />
        <button onClick={() => setShowStats(false)} style={{ marginTop: 10 }}>Lukk</button>
      </Modal>

      {/* All Tasks Modal */}
      <Modal open={showAllTasks} onClose={() => setShowAllTasks(false)}>
        <h3>Alle oppgaver</h3>
        <AllTasksEditor
          tasks={profile.tasks}
          onChange={tasks => {
            setData(d => {
              const copy = JSON.parse(JSON.stringify(d));
              copy.profiles[profileIdx].tasks = tasks;
              return copy;
            });
          }}
        />
        <button onClick={() => setShowAllTasks(false)} style={{ marginTop: 10 }}>Lukk</button>
      </Modal>
    </div>
  );
}
