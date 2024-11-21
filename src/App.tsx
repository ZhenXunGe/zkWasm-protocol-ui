import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Buttons } from './controller';

function App() {
  return (
    <Container>
      <Row>
        <Col className="text-center">
          <h1 className="header">
            ZKWASM Protocol UI
          </h1>
        </Col>
      </Row>
      <Row>
        <Buttons />
      </Row>
    </Container>
  );
}

export default App;