import { ethers } from 'ethers';
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import { QueryExistingProxyProps } from '../../main/props';
import {
  EventType,
  TopUpEvent,
  WithDrawEvent,
  SettledEvent,
  ProxyInfo
 } from "../../main/types";
import EventTable from "./EventTable";

export function QueryExistingProxy({signer, handleError}: QueryExistingProxyProps) {
  const [queryAddress, setQueryAddress] = useState('');
  const [proxyInfo, setProxyInfo] = useState<ProxyInfo>();
  const [events, setEvents] = useState<EventType[]>([]);

  const handleChange = (event: any) => {
    setQueryAddress(event.target.value);
  };

  const queryProxyInfo = async () => {
    setProxyInfo(undefined);

    if (!signer || !queryAddress) {
      handleError("Signer or query address is missing");
      return;
    }

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
      setProxyInfo(proxyInfo);

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
      setEvents(parsedEvents);
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
          placeholder="Proxy Address"
          aria-label="QueryAddress"
          aria-describedby="basic-addon1"
          value={queryAddress}
          onChange={handleChange}
          className="queryAddress"
        />
      </InputGroup>
      {proxyInfo ? (
        <div className="proxyInfo">
          <p><strong>Chain ID:</strong> {proxyInfo.chain_id.toString()}</p>
          <p><strong>Amount Token:</strong> {proxyInfo.amount_token.toString()}</p>
          <p><strong>Amount Pool:</strong> {proxyInfo.amount_pool.toString()}</p>
          <p><strong>Owner:</strong> {proxyInfo.owner}</p>
          <p><strong>Merkle Root:</strong> {proxyInfo.merkle_root.toString()}</p>
          <p><strong>RID:</strong> {proxyInfo.rid.toString()}</p>
          <p><strong>Verifier:</strong> {proxyInfo.verifier.toString()}</p>
          <div>
            <h4>Historical Events</h4>
            <EventTable events={events} />
          </div>
        </div>
      ) : (
        <div className="proxyInfo">
        </div>
      )}
    </div>
  )
}