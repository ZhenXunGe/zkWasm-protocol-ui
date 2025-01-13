import React from "react";
import { Modal, Button } from "react-bootstrap";
import { ErrorModalProps } from "../main/props";

export const ErrorModal: React.FC<ErrorModalProps> = ({ show, onClose, title = "Error", message }) => {
  return (
    <Modal show={show} onHide={onClose} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};