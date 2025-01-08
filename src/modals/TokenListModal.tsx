import React, { useState } from "react";
import { Modal, Button, Tooltip, OverlayTrigger, Table, Pagination } from "react-bootstrap";
import { TopUpModal } from "./TopUpModal";
import { ModifyTokenModal } from "./ModifyTokenModal";
import { AddTokenModal } from "./AddTokenModal";
import { TokenListModalProps } from "../main/props";
import { FaInfoCircle } from 'react-icons/fa';

export const TokenListModal: React.FC<TokenListModalProps> = ({
  show,
  onClose,
  currentProxy,
  tokenList,
  proxyAddress,
  signer,
  queryProxyInfo,
  chainId
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [tokensPerPage] = useState(5);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showModifyTokenModal, setShowModifyTokenModal] = useState(false);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);

  const indexOfLastToken = currentPage * tokensPerPage;
  const indexOfFirstToken = indexOfLastToken - tokensPerPage;
  const currentTokens = tokenList.slice(indexOfFirstToken, indexOfLastToken);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(tokenList.length / tokensPerPage); i++) {
    pageNumbers.push(i);
  }

   const handleTopUpClick = (index: number) => {
    setSelectedTokenIndex(index); // Set the selected token index
    setShowTopUpModal(true);
  };

  const handleModifyTokenClick = (index: number) => {
    setSelectedTokenIndex(index); // Set the selected token index
    setShowModifyTokenModal(true);
  };

  return (
    <>
      <Modal show={show} onHide={onClose} size="lg" backdrop={"static"} style={{ zIndex: 1050 }}>
        <Modal.Header closeButton>
          <Modal.Title>Token List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="operateToken">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddTokenModal(true)}>
              Add Token
            </Button>
          </div>
          {currentTokens.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>
                    Token Uid
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip id="tooltip-token-uid">Token Uid  = Token Address + (Chain ID &lt;&lt; 160)</Tooltip>}
                    >
                      <span style={{ marginLeft: "8px", cursor: "pointer" }}>
                        <FaInfoCircle />
                      </span>
                    </OverlayTrigger>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTokens.reverse().map((token, index) => (
                  <tr key={index}>
                    <td>{token}</td>
                    <td>
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleModifyTokenClick(currentTokens.length - 1 - index)}
                      >
                        Modify Token
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleTopUpClick(currentTokens.length - 1 - index)}
                      >
                        Top Up
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>No Tokens Available</p>
          )}
          <Pagination className="justify-content-center mt-3">
            {pageNumbers.map((number) => (
              <Pagination.Item
                key={number}
                active={number === currentPage}
                onClick={() => setCurrentPage(number)}
              >
                {number}
              </Pagination.Item>
            ))}
          </Pagination>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <TopUpModal
        show={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentProxy={currentProxy!}
        proxyAddress={proxyAddress}
        signer={signer}
        queryProxyInfo={queryProxyInfo}
        chainId={chainId}
        tokenIndex={selectedTokenIndex}
      />

      <ModifyTokenModal
        show={showModifyTokenModal}
        onClose={() => setShowModifyTokenModal(false)}
        currentProxy={currentProxy!}
        queryProxyInfo={queryProxyInfo}
        chainId={chainId}
        tokenIndex={selectedTokenIndex}
      />

      <AddTokenModal
        show={showAddTokenModal}
        onClose={() => setShowAddTokenModal(false)}
        currentProxy={currentProxy!}
        queryProxyInfo = {queryProxyInfo}
        chainId={chainId}
      />
    </>
    
  );
};