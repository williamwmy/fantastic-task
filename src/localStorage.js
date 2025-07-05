const KEY = 'fantastic-task-data';

export function loadData() {
  const raw = localStorage.getItem(KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
