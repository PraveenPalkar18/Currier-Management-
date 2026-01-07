import { useState, useEffect, useContext } from 'react';
import { Table, Button, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const DriverDashboard = () => {
    const [shipments, setShipments] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchShipments = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                // Use the new driver-specific endpoint
                const { data } = await axios.get('http://localhost:5000/api/shipments/driver', config);
                setShipments(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchShipments();
    }, [user.token]);

    const acceptShipment = async (id) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.put(`http://localhost:5000/api/shipments/${id}/accept`, {}, config);

            // Update local state: The shipment is now assigned to me
            setShipments(shipments.map(s => s._id === id ? { ...s, driver: user._id } : s));
        } catch (error) {
            console.error(error);
            alert('Failed to accept shipment. It might be taken.');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.put(`http://localhost:5000/api/shipments/${id}/status`, { status, location: 'Current Location' }, config);

            // Update local state
            setShipments(shipments.map(s => s._id === id ? { ...s, ...data } : s));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h2 className="mb-4">Driver Portal - <Badge bg="warning" text="dark">Driver</Badge></h2>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Tracking ID</th>
                        <th>Package</th>
                        <th>From {'->'} To</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {shipments.map((s) => {
                        const isAssignedToMe = s.driver === user._id;

                        return (
                            <tr key={s._id}>
                                <td>{s.trackingId}</td>
                                <td>{s.packageName}</td>
                                <td>{s.from} -&gt; {s.to}</td>
                                <td><Badge bg="info">{s.currentStatus}</Badge></td>
                                <td>
                                    {!s.driver ? (
                                        <Button variant="primary" size="sm" onClick={() => acceptShipment(s._id)}>Accept Job</Button>
                                    ) : isAssignedToMe ? (
                                        <div className="d-flex gap-2">
                                            <Button variant="outline-primary" size="sm" onClick={() => updateStatus(s._id, 'In Transit')}>Shipped</Button>
                                            <Button variant="outline-warning" size="sm" onClick={() => updateStatus(s._id, 'Out for Delivery')}>Delivering</Button>
                                            <Button variant="success" size="sm" onClick={() => updateStatus(s._id, 'Delivered')}>Delivered</Button>
                                        </div>
                                    ) : (
                                        <Badge bg="secondary">Assigned to Other</Badge>
                                        // Should not happen if backend filters correctly, but good for robustness
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
            {shipments.length === 0 && <Alert variant="info">No shipments available at the moment.</Alert>}
        </div>
    );
};

export default DriverDashboard;
