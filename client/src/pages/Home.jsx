import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup } from 'react-bootstrap';
import { FaCalculator, FaTruckMoving } from 'react-icons/fa';

const Home = () => {
    // Cost Estimator State
    const [weight, setWeight] = useState('');
    const [distance, setDistance] = useState('');
    const [cost, setCost] = useState(null);

    const calculateCost = () => {
        if (!weight || !distance) return;
        const baseRate = 10;
        const weightRate = 2;
        const distanceRate = 0.5;
        const total = baseRate + (parseFloat(weight) * weightRate) + (parseFloat(distance) * distanceRate);
        setCost(total.toFixed(2));
    };

    return (
        <div className="home-page">
            {/* Hero Section */}
            <div className="hero-section text-center">
                <Container>
                    <Row className="justify-content-center align-items-center">
                        <Col lg={8}>
                            <h1 className="display-4 fw-bold mb-3">Next-Gen Logistics Solution</h1>
                            <p className="lead mb-4">Experience the future of delivery. Fast, secure, and transparent shipping management for everyone.</p>

                            {/* Tracking Input Removed */}
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Features Section */}
            <Container className="py-5">
                <Row className="g-4">
                    <Col md={4}>
                        <Card className="h-100 border-0 shadow-sm card-hover">
                            <Card.Body className="text-center p-4">
                                <FaCalculator size={50} className="text-secondary mb-3" />
                                <Card.Title as="h3">Cost Estimator</Card.Title>
                                <Card.Text className="text-muted">
                                    Get instant quotes for your shipments.
                                </Card.Text>
                                <Form className="text-start mt-3">
                                    <Form.Group className="mb-2">
                                        <Form.Label>Weight (kg)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Ex: 5"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Distance (km)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Ex: 120"
                                            value={distance}
                                            onChange={(e) => setDistance(e.target.value)}
                                        />
                                    </Form.Group>
                                    <Button variant="primary" className="w-100" onClick={calculateCost}>Calculate Cost</Button>
                                </Form>
                                {cost && (
                                    <div className="mt-3 p-2 bg-light rounded">
                                        <h4 className="m-0 text-success fw-bold">${cost}</h4>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100 border-0 shadow-sm card-hover">
                            <Card.Body className="text-center p-4">
                                <FaTruckMoving size={50} className="text-primary mb-3" />
                                <Card.Title as="h3">Fast Delivery</Card.Title>
                                <Card.Text className="text-muted">
                                    Optimized routes ensuring your package arrives on time, every time.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    {/* Placeholder for 3rd feature or removal */}
                    <Col md={4}>
                        <Card className="h-100 border-0 shadow-sm card-hover">
                            <Card.Body className="text-center p-4">
                                <div className="text-success mb-3" style={{ fontSize: '50px' }}>🌍</div>
                                <Card.Title as="h3">Global Reach</Card.Title>
                                <Card.Text className="text-muted">
                                    Shipping to over 200 countries with real-time customs clearance.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Home;
