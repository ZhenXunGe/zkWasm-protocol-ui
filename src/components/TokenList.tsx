import React, { useState } from "react";
import { Button, Tooltip, OverlayTrigger, Table, Pagination } from "react-bootstrap";
import { TopUpModal } from "../modals/TopUpModal";
import { ModifyTokenModal } from "../modals/ModifyTokenModal";
import { TokenListProps } from "../main/props";
import { FaInfoCircle } from 'react-icons/fa';

export const TokenList: React.FC<TokenListProps> = ({
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
      <div>
        {currentTokens.length > 0 ? (
          <Table bordered hover>
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
                    <div className="mb-2">
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleModifyTokenClick(currentTokens.length - 1 - index)}
                      >
                        Modify Token
                      </Button>
                    </div>
                    <div>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleTopUpClick(currentTokens.length - 1 - index)}
                      >
                        Top Up
                      </Button>
                    </div>
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
      </div>

      <TopUpModal
        show={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentProxy={currentProxy!}
        proxyAddress={proxyAddress}
        signer={signer}
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
    </>
  );
};