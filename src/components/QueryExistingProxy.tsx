import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { QueryExistingProxyProps } from '../main/props';
import {
  EventType,
  TopUpEvent,
  WithDrawEvent,
  SettledEvent
 } from "../main/types";
import { useLogger } from '../main/logger/LoggerContext';

export function QueryExistingProxy({signer, handleError}: QueryExistingProxyProps) {
  const [queryAddress, setQueryAddress] = useState('');
  const { addLog, clearLogs } = useLogger();

  const handleChange = (event: any) => {
    setQueryAddress(event.target.value);
  };

  const queryProxyInfo = async () => {
    if (!signer || !queryAddress) {
      handleError("Signer or query address is missing");
      return;
    }

    clearLogs(); // Clear existing logs

    try {
      // Get proxy info
      const correctAddress = ethers.getAddress(queryAddress);
      const proxyContract = new ethers.Contract(correctAddress, proxyArtifact.abi, signer);
      const proxyInfo = await proxyContract.getProxyInfo().catch(() => {
        // proxyContract.getProxyInfo is a view function
        // if throw error, maybe the address is not belong to Proxy
        handleError("Error querying existing Proxy: The address may not belong to a Proxy contract");
        return;
      });

      // Get all events
      const eventFilters = [
        proxyContract.filters.TopUp(),
        proxyContract.filters.WithDraw(),
        proxyContract.filters.Settled(),
      ];
      const logs = [];
      for (let filter of eventFilters) {
          const eventLogs = await proxyContract.queryFilter(filter);
          logs.push(...eventLogs);
      }
      const parsedEvents = logs.map((log) => {
        const eventLog = log as ethers.EventLog;
        const { args } = eventLog;
        const eventName = eventLog.eventName;
        switch (eventName) {
          case "TopUp":
            return {
              name: "TopUp",
              token: args[0].toString(),
              account: args[1].toString(),
              pid1: args[2].toString(),
              pid2: args[3].toString(),
              amount: ethers.formatUnits(args[4], "wei"),
            } as TopUpEvent;
          case "WithDraw":
            return {
              name: "WithDraw",
              l1token: args[0].toString(),
              l1account: args[1].toString(),
              amount: ethers.formatUnits(args[2], "wei"),
            } as WithDrawEvent;
          case "Settled":
            return {
              name: "Settled",
              sender: args[0].toString(),
              merkle_root: args[1].toString(),
              new_merkle_root: args[2].toString(),
              rid: args[3].toString(),
              sideEffectCalled: args[4].toString()
            } as SettledEvent;
          default:
            return null; // skip other events
        }
      }).filter((event): event is EventType => event !== null); // remove null

      if (proxyInfo) {
        addLog(`Chain ID: ${proxyInfo.chain_id.toString()}`);
        addLog(`Amount Token: ${proxyInfo.amount_token.toString()}`);
        addLog(`Amount Pool: ${proxyInfo.amount_pool.toString()}`);
        addLog(`Owner: ${proxyInfo.owner}`);
        addLog(`Merkle Root: ${proxyInfo.merkle_root.toString()}`);
        addLog(`RID: ${proxyInfo.rid.toString()}`);
        addLog(`Verifier: ${proxyInfo.verifier.toString()}`);
        
        if (parsedEvents && parsedEvents.length > 0) {
          addLog('Historical Events:');
          parsedEvents.forEach((event, index) => {
            addLog(`${JSON.stringify(event)}`);
          });
        } else {
          addLog('No Historical Events available.');
        }
      } else {
        addLog('No Proxy Info available.');
      }
    } catch (error) {
      handleError("Error querying existing Proxy: " + error);
    }
  }

  return (
    <div>
      <h4>Query Existing Proxy</h4>
      <InputGroup className="mb-3">
        <Button variant="primary" onClick={queryProxyInfo}>
          QUERY
        </Button>
        <Form.Control
          placeholder="Enter Proxy address as hex string"
          aria-label="QueryAddress"
          aria-describedby="basic-addon1"
          value={queryAddress}
          onChange={handleChange}
          className="queryAddress"
        />
      </InputGroup>
    </div>
  )
}