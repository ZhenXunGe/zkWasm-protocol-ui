import React, { useEffect, useRef } from "react";
import { useLogger } from "./LoggerContext";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Button } from "react-bootstrap";
import { getTXUrl } from "../utils";
import { useAppSelector } from "../../app/hooks";
import { selectChains } from '../../data/contractSlice';

const extractAddress = (message: string): string => {
  const addressRegex = /(0x[a-fA-F0-9]{40})/;
  const match = message.match(addressRegex);
  return match ? match[1] : "";
};

export const LogViewer = () => {
  const { logs, clearLogs } = useLogger();
  const { chains } = useAppSelector(selectChains);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current!.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="log-viewer">
      <div className="clearLogs">
        <button onClick={clearLogs} className="btn btn-outline-secondary">
          Clear Logs
        </button>
      </div>
      <div className="logContent">
        {logs.map((log, index) => {
          if(log.type === "txhash") {
            const txhashUrl = getTXUrl(chains, BigInt(log.chainId!), log.message);
            return (
              <div key={index} style={{color: "#1E90FF", fontWeight: "normal"}}>
                <strong>[{log.time}]</strong> Transaction hash is: <a href={txhashUrl || '#'} target="_blank" rel="noopener noreferrer">{log.message}</a>
              </div>
            )
          } else if(log.type === "contractAddr") {
            return (
              <div key={index} style={{color: "#1E90FF", fontWeight: "bold"}}>
                <strong>[{log.time}]</strong> {log.message}
                <CopyToClipboard text={extractAddress(log.message)}>
                  <Button variant="outline-secondary" className="copyButton">Copy</Button>
                </CopyToClipboard>
              </div>
            )
          } else {
            return (
              <div key={index}
                style={{
                  color: log.type === "success" ? "#4CAF50" : log.type === "error" ? "#FF4D4D" : "#1E90FF",
                  fontWeight: log.type === "success" ? "bold" : "normal" }}>
                <strong>[{log.time}]</strong> {log.message}
                {log.type === "success" && <span style={{ color: "#4CAF50", marginLeft: "8px" }}>✓</span>}
              </div>
            )
          }
        })}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};