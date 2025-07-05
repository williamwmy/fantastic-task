import React, { useState, useEffect } from "react";
import { loadData, saveData } from "./localStorage";
import ProfileSelector from "./ProfileSelector";
import TaskList, { filterTasksForDay } from "./TaskList";
import Stats from "./Stats";

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

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Filtrer for dagens oppgaver (ut fra frekvens)
  const todayTasks = filterTasksForDay(profile.tasks, todayStr());

  // Dagens utført-status fra loggen
  const todayLog = profile.log[todayStr()] || todayTasks.map(() => false);

  const addProfile = name => {
    setData(d => ({
      ...d,
      profiles: [...d.profiles, defaultProfile(name)]
    }));
    setProfileIdx(data.profiles.length);
  };

  // Nytt: Endre navn på profil
  const handleRenameProfile = (idx, newName) => {
    setData(d => {
      const copy = JSON.parse(JSON.stringify(d));
      copy.profiles[idx].name = newName;
      return copy;
    });
  };

  // Nytt: Slett profil
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

  // Toggle utført-status for valgt oppgave i dagens logg
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
      // Finner hvilken oppgave i hele lista idx peker til
      const tasksToday = filterTasksForDay(copy.profiles[profileIdx].tasks, todayStr());
      const fullTaskIdx = tasksToday[idx].idx;
      copy.profiles[profileIdx].tasks[fullTaskIdx].comment = txt;
      return copy;
    });
  };

  // Rediger status for hvilken som helst dag via statistikk
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

  // Sørg for at loggen har oppføring for dagens dato hvis oppgaver endres
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
    <div style={{
      maxWidth: 480,
      margin: "2rem auto",
      padding: "1.5rem",
      background: "linear-gradient(135deg, #d0e6fa 0%, #f8e8ee 100%)",
      borderRadius: "2rem",
      minHeight: "97vh"
    }}>
      <h1 style={{
        textAlign: "center",
        fontWeight: 700,
        marginBottom: 12
      }}>
        Fantastic Task ⭐️
      </h1>
      <ProfileSelector
        profiles={data.profiles}
        current={profileIdx}
        onSelect={setProfileIdx}
        onAdd={addProfile}
        onRename={handleRenameProfile}
        onDelete={handleDeleteProfile}
      />
      <div style={{ marginBottom: 16, fontWeight: 500 }}>
        Dagens oppgaver:
      </div>
      <TaskList
        tasks={todayTasks}
        todayLog={todayLog}
        onComplete={handleTaskToggle}
        onComment={handleComment}
        onAdd={handleTaskAdd}
      />
      <Stats
        log={profile.log || {}}
        tasks={profile.tasks}
        onEditLog={handleEditLog}
      />
    </div>
  );
}
