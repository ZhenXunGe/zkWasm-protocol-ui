import React, { useState } from "react";
import { Form, Button, Table } from "react-bootstrap";
import { ethers } from "ethers";
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";

interface TopUpProps {
  signer: ethers.JsonRpcSigner | null;
  proxyAddress: string | null,
  actionEnabled: boolean;
  setShowErrorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setModalMessage: React.Dispatch<React.SetStateAction<string>>
}

interface EventType {
  token: string,
  account: string,
  amount: string
}

export function TopUp ({signer, proxyAddress, actionEnabled, setShowErrorModal, setModalMessage}: TopUpProps) {
  const [tidx, setTidx] = useState("");
  const [amount, setAmount] = useState("");
  const [events, setEvents] = useState<EventType[]>([]);

  function isValidUint128(input: string): boolean {
    try {
      const value = BigInt(input);
  
      // Define uint128's scope
      const min = BigInt(0);
      const max = BigInt("340282366920938463463374607431768211455");

      return value >= min && value <= max;
    } catch (e) {
      throw new Error("Invalid uint128 string: out of range or malformed.");
    }
  }

  const handleTopUp = async () => {
    if (!signer || !proxyAddress || !tidx || !amount) {
      setShowErrorModal(true);
      setModalMessage("Signer, Proxy address, tidx or amount is missing");
      return;
    }
    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);
  
      // Make sue tidx and amount is in the scope of uint128
      isValidUint128(tidx);
      isValidUint128(amount);

      const amountWei = ethers.parseUnits(amount, "wei");
      const tx = await proxyContract.topUp(BigInt(tidx), amountWei);
      console.log("Transaction sent:", tx.hash);
  
      // Wait the transaction confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Status:", receipt.status === 1 ? "Success" : "Failure");
  
      alert("TopUp successful! Check events of TopUp below for details.");

      // Query Events
      const filter = proxyContract.filters.TopUp();
      const logs = await proxyContract.queryFilter(filter);
      const parsedEvents = logs.map((log) => {
        const eventLog = log as ethers.EventLog;
        const { args } = eventLog;
        return {
          token: args[0].toString(),
          account: args[1].toString(),
          pid_1: args[2],
          pid_2: args[3],
          amount: ethers.formatUnits(args[4], "wei"),
        };
      });
      setEvents(parsedEvents);
    } catch (error) {
      setShowErrorModal(true);
      setModalMessage("Error TopUp:" + error);
    }  
  };

  return (
    <div>
      <h3>TOP-UP YOUR ETHEREUM WALLET</h3>
      <Form.Group controlId="formTidx">
        <Form.Label>Token Index (Tidx)</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter token index"
          value={tidx}
          onChange={(e) => setTidx(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group controlId="formAmount">
        <Form.Label>Amount (Wei)</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter amount in Wei"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </Form.Group>
      <Button className="topUp" variant="primary" onClick={handleTopUp} disabled={actionEnabled}>
        TOP-UP
      </Button>
      <h5 className="mt-4">Historical TopUp Events</h5>
      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Token</th>
              <th>Account</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event: EventType, index: number) => (
              <tr key={index}>
                <td>{event.token}</td>
                <td>{event.account}</td>
                <td>{event.amount}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};