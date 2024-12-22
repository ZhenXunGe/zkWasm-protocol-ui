import React from 'react';
import { useLogger } from './LoggerContext';

export const LogViewer: React.FC = () => {
  const { logs } = useLogger();

  return (
    <div className="logs">
      {logs.map((log, index) => (
        <div key={index}>{log}</div>
      ))}
    </div>
  );
}