import React, { useState } from "react";
import { Alert, Modal, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { validateHexString, removeHexPrefix, formatErrorMessage } from "../main/utils";
import { useLogger } from '../main/logger/LoggerContext';
import { ethers } from 'ethers';
import { TopUpProps } from "../main/props";

// The token we use is ERC20 token
const erc20ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
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

export const TopUpModal: React.FC<TopUpProps> = ({
  show,
  onClose,
  currentProxy,
  proxyAddress,
  signer,
  queryProxyInfo,
  chainId,
  tokenIndex
}) => {
  const { addLog } = useLogger();
  const [pid1, setPid1] = useState("");
  const [pid2, setPid2] = useState("");
  const [amount, setAmount] = useState("");
  const [isTopUp, setIsTopUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onConfirm = async () => {
    try {
      setErrorMessage("");
      if (!signer) {
        throw new Error("Please connect your wallet before submitting any requests!");
      }

      if (!amount || !pid1 || !pid2) {
        throw new Error("Token amount, pid1 or pid2 is missing");
      }

      // Make suer token amount is in the scope of uint128
      validateHexString(amount.trim(), 32);

      // Make sue pid1 and pid2 is in the scope of uint64
      validateHexString(pid1.trim(), 16);
      validateHexString(pid2.trim(), 16);
      
      setIsTopUp(true);

      // If parameters start with "0x", remove "0x"
      const pid1NoPrefix = removeHexPrefix(pid1);
      const pid2NoPrefix = removeHexPrefix(pid2);

      const amountWei = ethers.parseUnits(amount, "wei");

      const tokens = await currentProxy.allTokens();

      // Ensure the token address is a valid Ethereum address
      const tokenAddress = getLower160Bits(tokens[tokenIndex!].token_uid.toString(16))
      const formatTokenAddress = ethers.getAddress(tokenAddress);

      const tokenContract = new ethers.Contract(formatTokenAddress, erc20ABI, signer);

      // Query the balance of the contract
      const balanceBeforeTopup = await tokenContract.balanceOf(proxyAddress);
      addLog("info", "The balance of the Proxy contract before topup is: " + balanceBeforeTopup);

      const tx = await tokenContract.approve(proxyAddress, amountWei);
      addLog("info", "Approve Transaction sent");
      addLog("txhash", tx.hash, chainId);

      // Wait the transaction confirmed
      const approveReceipt = await tx.wait();
      addLog("info", "Approve Transaction confirmed. Approve Gas used: " + approveReceipt.gasUsed.toString());
      const approveRes = approveReceipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Approve Status: " + approveRes);

      const result = await currentProxy.topup(
        BigInt("0x" + tokenIndex),
        BigInt("0x" + pid1NoPrefix),
        BigInt("0x" + pid2NoPrefix),
        amountWei
      );
      addLog("info", "Topup Transaction sent");
      addLog("txhash", result.hash, chainId);

      // Wait the transaction confirmed
      const receipt = await result.wait();
      addLog("info", "Topup Transaction confirmed. Topup Gas used: " + receipt.gasUsed.toString());
      const topupRes = receipt.status === 1 ? "Success" : "Failure";
      addLog("info", "Topup Status: " + topupRes);

      // Query Events
      const filter = currentProxy.filters.TopUp();
      const logs = await currentProxy.queryFilter(filter);
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

      if (parsedEvents && parsedEvents.length > 0) {
        addLog("info", 'Historical TopUp Events:');
        parsedEvents.forEach((event) => {
          addLog("info", `${JSON.stringify(event)}`);
        });
      } else {
        addLog("info", 'No Historical TopUp Events available.');
      }

      // Query the balance of the contract
      const balanceAfterTopup = await tokenContract.balanceOf(proxyAddress);
      addLog("info", "The balance of the Proxy contract after topup is: " + balanceAfterTopup);

      addLog("success", "Topup executed successfully!");
      await queryProxyInfo();
      setIsTopUp(false);
      onClose();
    } catch (error) {
      const err = formatErrorMessage(error);
      addLog("error", `Error TopUp: ${err}`);
      setErrorMessage(`Error TopUp: ${err}`);
    } finally {
      setIsTopUp(false);
    }
  }

  const closeModal = () => {
    setPid1("");
    setPid2("");
    setAmount("");
    setErrorMessage("");
    onClose();
  }

  return (
    <Modal show={show} onHide={closeModal} backdrop={"static"} style={{ zIndex: 1051 }}>
      <Modal.Header closeButton>
        <Modal.Title>Topup Your Ethereum Wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter pid1 as uint64 hexadecimal(e.g., 0x12...)"
            value={pid1}
            onChange={(e) => setPid1(e.target.value)}
            required
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter pid2 as uint64 hexadecimal (e.g., 0x12...)"
            value={pid2}
            onChange={(e) => setPid2(e.target.value)}
            required
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Enter amount in Wei as uint128 hexadecimal (e.g., 0x12...)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          Close
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isTopUp}>
          {isTopUp ? <Spinner animation="border" size="sm" /> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};