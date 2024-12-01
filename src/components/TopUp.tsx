import { useState } from "react";
import { Form, Button, Table } from "react-bootstrap";
import { ethers } from "ethers";
import proxyArtifact from "zkWasm-protocol/artifacts/contracts/Proxy.sol/Proxy.json";
import { TopUpProps } from '../main/props';
import { TopUpEvent } from "../main/types";
import { removeHexPrefix, validateHexString } from "../main/helps";

// The token we use is ERC20 token
const erc20ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];

function getLower160Bits(uid: string) {
  // Check if the uid starts with "0x" (hexadecimal format) and strip it if present
  const uidNoPrefix =  removeHexPrefix(uid);

  const bigUid = BigInt("0x" + uidNoPrefix);

  // Define the mask for the lower 160 bits (160 bits set to 1)
  const mask = BigInt("0xffffffffffffffffffffffffffffffffffffffff"); // 160-bit mask

  // Apply the mask to get the lower 160 bits
  const lower160Bits = bigUid & mask;

  // Convert the result to an address format (optional)
  const lower160Address = "0x" + lower160Bits.toString(16).padStart(40, '0');  // Ensure it's 40 hex characters long

  return lower160Address;
}

export function TopUp ({signer, proxyAddress, actionEnabled, handleError}: TopUpProps) {
  const [tidx, setTidx] = useState("");
  const [pid1, setPid1] = useState("");
  const [pid2, setPid2] = useState("");
  const [amount, setAmount] = useState("");
  const [events, setEvents] = useState<TopUpEvent[]>([]);

  const handleTopUp = async () => {
    if (!signer || !proxyAddress || !tidx || !amount || !pid1 || !pid2) {
      handleError("Signer, Proxy address, tidx, amount, pid1 or pid2 is missing");
      return;
    }
    try {
      const proxyContract = new ethers.Contract(proxyAddress, proxyArtifact.abi, signer);

      // Make sue tidx and amount is in the scope of uint128
      validateHexString(tidx, 32);
      validateHexString(amount, 32);

      // Make sue pid1 and pid2 is in the scope of uint64
      validateHexString(pid1, 16);
      validateHexString(pid2, 16);

      // If parameters start with "0x", remove "0x"
      const tidxNoPrefix = removeHexPrefix(tidx);
      const pid1NoPrefix = removeHexPrefix(pid1);
      const pid2NoPrefix = removeHexPrefix(pid2);

      const amountWei = ethers.parseUnits(amount, "wei");

      const tokens = await proxyContract.allTokens();

      // Ensure the token address is a valid Ethereum address
      const tokenAddress = getLower160Bits(tokens[tidx].token_uid.toString(16))
      const formatTokenAddress = ethers.getAddress(tokenAddress);

      const tokenContract = new ethers.Contract(formatTokenAddress, erc20ABI, signer);
      var tx = await tokenContract.approve(proxyAddress, amountWei);
      console.log("Approve Transaction sent:", tx.hash);

      // Wait the transaction confirmed
      const approveReceipt = await tx.wait();
      console.log("Approve Transaction confirmed:", approveReceipt.hash);
      console.log("Approve Gas used:", approveReceipt.gasUsed.toString());
      console.log("Approve Status:", approveReceipt.status === 1 ? "Success" : "Failure");

      const result = await proxyContract.topup(
        BigInt("0x" + tidxNoPrefix),
        BigInt("0x" + pid1NoPrefix),
        BigInt("0x" + pid2NoPrefix),
        amountWei
      );
      console.log("Topup Transaction sent:", result.hash);

      // Wait the transaction confirmed
      const receipt = await result.wait();
      console.log("Topup Transaction confirmed:", receipt.hash);
      console.log("Topup Gas used:", receipt.gasUsed.toString());
      console.log("Topup Status:", receipt.status === 1 ? "Success" : "Failure");

      alert("TopUp successful! Check events of TopUp below for details.");

      // Query Events
      const filter = proxyContract.filters.TopUp();
      const logs = await proxyContract.queryFilter(filter);
      const parsedEvents = logs.map((log) => {
        const eventLog = log as ethers.EventLog;
        const { args, eventName } = eventLog;
        return {
          name: eventName,
          token: args[0].toString(),
          account: args[1].toString(),
          pid1: args[2].toString(),
          pid2: args[3].toString(),
          amount: ethers.formatUnits(args[4], "wei"),
        };
      });
      setEvents(parsedEvents);
    } catch (error) {
      handleError("Error TopUp:" + error);
    }
  };

  return (
    <div>
      <h4>TOP-UP YOUR ETHEREUM WALLET</h4>
      <Form.Group controlId="formTidx">
        <Form.Label>Token Index</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter token index as hex string(uint128)"
          value={tidx}
          onChange={(e) => setTidx(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group controlId="formPid1" className="mt-3">
        <Form.Label>Pid1</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter pid1 as hex string(uint64)"
          value={pid1}
          onChange={(e) => setPid1(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group controlId="formPid2" className="mt-3">
        <Form.Label>Pid2</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter pid2 as hex string(uint64)"
          value={pid2}
          onChange={(e) => setPid2(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group controlId="formAmount" className="mt-3">
        <Form.Label>Amount (Wei)</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter amount in Wei as hex string(uint128)"
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
              <th>Name</th>
              <th>Token</th>
              <th>Account</th>
              <th>Pid1</th>
              <th>Pid2</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event: TopUpEvent, index: number) => (
              <tr key={index}>
                <td>{event.name}</td>
                <td>{event.token}</td>
                <td>{event.account}</td>
                <td>{event.pid1}</td>
                <td>{event.pid2}</td>
                <td>{event.amount}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};