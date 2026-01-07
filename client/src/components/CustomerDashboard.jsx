import { useState, useEffect, useContext } from 'react';
import { Table, Button, Badge, Form, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const CustomerDashboard = () => {
    const [shipments, setShipments] = useState([]);
    const [formData, setFormData] = useState({
        packageName: '',
        from: '',
        to: '',
        senderName: '',
        receiverName: '',
        weight: '',
        distance: '',
        cost: 0
    });

    const { user } = useContext(AuthContext);

    const fetchShipments = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.get('http://localhost:5000/api/shipments', config);
            setShipments(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchShipments();
    }, [user.token]);

    useEffect(() => {
        const { weight, distance } = formData;
        if (weight && distance) {
            const baseRate = 10;
            const weightRate = 2;
            const distanceRate = 0.5;
            const calculatedCost = baseRate + (parseFloat(weight) * weightRate) + (parseFloat(distance) * distanceRate);
            setFormData(prev => ({ ...prev, cost: calculatedCost.toFixed(2) }));
        } else {
            setFormData(prev => ({ ...prev, cost: 0 }));
        }
    }, [formData.weight, formData.distance]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const trackingId = 'TRK-' + Math.floor(Math.random() * 1000000);

            await axios.post('http://localhost:5000/api/shipments', {
                ...formData,
                trackingId,
                sender: { name: formData.senderName },
                receiver: { name: formData.receiverName }
            }, config);


            setFormData({ packageName: '', from: '', to: '', senderName: '', receiverName: '', weight: '', distance: '', cost: 0 });
            fetchShipments();
            alert(`Shipment Created! Tracking ID: ${trackingId}`);

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h2 className="mb-4">My Dashboard - <Badge bg="success">Customer</Badge></h2>

            <Row className="mb-5">
                <Col md={12}>
                    <Card>
                        <Card.Header as="h5">Book New Shipment</Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Package Name</Form.Label>
                                            <Form.Control type="text" required onChange={(e) => setFormData({ ...formData, packageName: e.target.value })} value={formData.packageName} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Weight (kg)</Form.Label>
                                                    <Form.Control type="number" required onChange={(e) => setFormData({ ...formData, weight: e.target.value })} value={formData.weight} />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Distance (km)</Form.Label>
                                                    <Form.Control type="number" required onChange={(e) => setFormData({ ...formData, distance: e.target.value })} value={formData.distance} />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col md={12}>
                                        <h5 className="text-end text-success fw-bold">Total Cost: ${formData.cost}</h5>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>From (Location)</Form.Label>
                                            <Form.Control type="text" required onChange={(e) => setFormData({ ...formData, from: e.target.value })} value={formData.from} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>To (Location)</Form.Label>
                                            <Form.Control type="text" required onChange={(e) => setFormData({ ...formData, to: e.target.value })} value={formData.to} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Sender Name</Form.Label>
                                            <Form.Control type="text" required onChange={(e) => setFormData({ ...formData, senderName: e.target.value })} value={formData.senderName} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Receiver Name</Form.Label>
                                            <Form.Control type="text" required onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })} value={formData.receiverName} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Button variant="primary" type="submit">Create Shipment</Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <h4 className="mb-3">My Shipments</h4>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Tracking ID</th>
                        <th>Package</th>
                        <th>Route</th>
                        <th>Status</th>
                        <th>Cost</th>
                    </tr>
                </thead>
                <tbody>
                    {shipments.map((s) => (
                        <tr key={s._id}>
                            <td>{s.trackingId}</td>
                            <td>{s.packageName}</td>
                            <td>{s.from} -&gt; {s.to}</td>
                            <td><Badge bg="info">{s.currentStatus}</Badge></td>
                            <td>${s.cost}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default CustomerDashboard;
