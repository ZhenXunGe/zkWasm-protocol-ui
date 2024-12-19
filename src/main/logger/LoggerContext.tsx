import React, { createContext, useContext, useState } from 'react';

// Logger Context
const LoggerContext = createContext({
  logs: [] as string[],
  addLog: (message: string) => { console.log(message) },
  clearLogs: () => {},
});

export const LoggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const clearLogs = () => {
    setLogs([]); // Clear all logs
  };

  return (
    <LoggerContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LoggerContext.Provider>
  );
};

export const useLogger = () => useContext(LoggerContext);