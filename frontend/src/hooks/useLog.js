import { useState } from 'react';

export const useLog = () => {
  const [logs, setLogs] = useState([]);
  const addLog = (msg) =>
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  return { logs, addLog };
};
