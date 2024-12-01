import { Table } from 'react-bootstrap';
import {
  EventType,
  TopUpEvent,
  WithDrawEvent,
  SettledEvent
 } from "../../main/types";

function EventTable({ events }: { events: EventType[] }) {
  return (
    <>
      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        events.map((event: EventType, index: number) => {
          if (event.name === "TopUp") {
            const topUpEvent = event as TopUpEvent;
            return (
              <Table striped bordered hover key={index}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Token</th>
                    <th>Account</th>
                    <th>PID 1</th>
                    <th>PID 2</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{topUpEvent.name}</td>
                    <td>{topUpEvent.token}</td>
                    <td>{topUpEvent.account}</td>
                    <td>{topUpEvent.pid1}</td>
                    <td>{topUpEvent.pid2}</td>
                    <td>{topUpEvent.amount}</td>
                  </tr>
                </tbody>
              </Table>
            );
          } else if (event.name === "WithDraw") {
            const withDrawEvent = event as WithDrawEvent;
            return (
              <Table striped bordered hover key={index}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>L1 Token</th>
                    <th>L1 Account</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{withDrawEvent.name}</td>
                    <td>{withDrawEvent.l1token}</td>
                    <td>{withDrawEvent.l1account}</td>
                    <td>{withDrawEvent.amount}</td>
                  </tr>
                </tbody>
              </Table>
            );
          } else if (event.name === "Settled") {
            const settledEvent = event as SettledEvent;
            return (
              <Table striped bordered hover key={index}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Sender</th>
                    <th>Merkle Root</th>
                    <th>New Merkle Root</th>
                    <th>RID</th>
                    <th>Side Effect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{settledEvent.name}</td>
                    <td>{settledEvent.sender}</td>
                    <td>{settledEvent.merkle_root}</td>
                    <td>{settledEvent.new_merkle_root}</td>
                    <td>{settledEvent.rid}</td>
                    <td>{settledEvent.sideEffectCalled}</td>
                  </tr>
                </tbody>
              </Table>
            );
          }
        })
      )}
    </>
  );
}

export default EventTable;