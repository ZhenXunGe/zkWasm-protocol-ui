import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LoggerContextProps } from "../props";
import { Log, LogType } from "../types";

const LoggerContext = createContext<LoggerContextProps>({
  logs: [],
  addLog: () => {},
  clearLogs: () => {},
});

export const LoggerProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<Log[]>([]);

  const addLog = (type: LogType, message: string, chainId?: string) => {
    const newLog: Log = {
      time: new Date().toLocaleString(),
      type,
      message,
      chainId
    };
    setLogs((prevLogs) => [...prevLogs, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <LoggerContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LoggerContext.Provider>
  );
};

export const useLogger = () => useContext(LoggerContext);