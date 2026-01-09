import { useState, useEffect, useContext, useRef } from 'react';
import { Table, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import io from 'socket.io-client';
import SignatureCanvas from 'react-signature-canvas';

const DriverDashboard = () => {
    const [shipments, setShipments] = useState([]);
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [activeTrackingId, setActiveTrackingId] = useState(null);
    const [gpsError, setGpsError] = useState(null);

    // POD State
    const [showPodModal, setShowPodModal] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [podPhoto, setPodPhoto] = useState(null);
    const sigCanvas = useRef({});

    // Use ref to store watchId so we can clear it easily
    const watchIdRef = useRef(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

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

    const handlePodClick = (shipment) => {
        setSelectedShipment(shipment);
        setShowPodModal(true);
    };

    const handlePodSubmit = async () => {
        if (!selectedShipment) return;

        const signature = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        const formData = new FormData();
        formData.append('signature', signature);
        if (podPhoto) {
            formData.append('photo', podPhoto);
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                },
            };
            await axios.post(`http://localhost:5000/api/shipments/${selectedShipment._id}/deliver`, formData, config);

            // Clean up
            setShowPodModal(false);
            setPodPhoto(null);

            // Refetch to ensure status is correct
            const { data } = await axios.get('http://localhost:5000/api/shipments/driver', { headers: { Authorization: `Bearer ${user.token}` } });
            setShipments(data);

            // Stop tracking if active
            if (activeTrackingId === selectedShipment.trackingId) {
                stopTracking();
            }

            alert('Delivery Completed Successfully!');

        } catch (error) {
            console.error(error);
            alert('Failed to submit proof of delivery');
        }
    };

    const startTracking = (trackingId) => {
        if (!navigator.geolocation) {
            setGpsError("Geolocation is not supported by your browser");
            return;
        }

        setActiveTrackingId(trackingId);
        setGpsError(null);

        // Helper to emit location
        const emitLocation = (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`Tracking ${trackingId}:`, latitude, longitude);
            if (socket) {
                socket.emit('update_location', {
                    trackingId,
                    location: { lat: latitude, lng: longitude }
                });
            }
        };

        // Options for high accuracy
        const highAccuracyOptions = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 10000
        };

        // Fallback options
        const lowAccuracyOptions = {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 30000
        };

        const handleError = (err) => {
            console.error("GPS Error:", err);
            // If timeout (code 3), try again with low accuracy if we haven't already
            if (err.code === 3 && watchIdRef.current) {
                console.warn("High accuracy timed out, switching to low accuracy...");
                setGpsError("High accuracy GPS timed out. Switching to network/low accuracy...");

                // Clear existing watch
                navigator.geolocation.clearWatch(watchIdRef.current);

                // Restart with low accuracy
                watchIdRef.current = navigator.geolocation.watchPosition(
                    (pos) => {
                        setGpsError(null); // Clear error on success
                        emitLocation(pos);
                    },
                    (finalErr) => setGpsError(`GPS Failed: ${finalErr.message}`),
                    lowAccuracyOptions
                );
            } else {
                setGpsError(err.message);
            }
        };

        // Start with high accuracy
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                setGpsError(null);
                emitLocation(position);
            },
            handleError,
            highAccuracyOptions
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setActiveTrackingId(null);
    };

    return (
        <div>
            <h2 className="mb-4">Driver Portal - <Badge bg="warning" text="dark">Driver</Badge></h2>
            {gpsError && <Alert variant="danger">GPS Error: {gpsError}</Alert>}

            {activeTrackingId && (
                <Alert variant="success" className="d-flex justify-content-between align-items-center">
                    <span>Active Tracking: <strong>{activeTrackingId}</strong> (Location is being shared)</span>
                    <Button variant="danger" size="sm" onClick={stopTracking}>Stop Sharing Location</Button>
                </Alert>
            )}

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
                                        <div className="d-flex flex-column gap-2">
                                            <Button variant="outline-primary" size="sm" onClick={() => updateStatus(s._id, 'In Transit')}>Shipped</Button>
                                            <Button variant="outline-warning" size="sm" onClick={() => updateStatus(s._id, 'Out for Delivery')}>Delivering</Button>
                                            <Button variant="success" size="sm" onClick={() => handlePodClick(s)}>Complete Delivery</Button>

                                            {/* Tracking Controls */}
                                            {s.currentStatus !== 'Delivered' && s.currentStatus !== 'Cancelled' && (
                                                <div className="mt-1">
                                                    {activeTrackingId === s.trackingId ? (
                                                        <Badge bg="success">Tracking Active</Badge>
                                                    ) : (
                                                        <Button
                                                            variant="dark"
                                                            size="sm"
                                                            onClick={() => startTracking(s.trackingId)}
                                                            disabled={!!activeTrackingId} // Disable if another tracking is active
                                                        >
                                                            Start Live GPS
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <Badge bg="secondary">Assigned to Other</Badge>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
            {shipments.length === 0 && <Alert variant="info">No shipments available at the moment.</Alert>}

            {/* POD Modal */}
            <Modal show={showPodModal} onHide={() => setShowPodModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Complete Delivery (POD)</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Customer Signature</Form.Label>
                        <div style={{ border: '1px solid #ccc', borderRadius: '5px' }}>
                            <SignatureCanvas
                                ref={sigCanvas}
                                canvasProps={{ width: 450, height: 200, className: 'sigCanvas' }}
                            />
                        </div>
                        <Button variant="secondary" size="sm" className="mt-2" onClick={() => sigCanvas.current.clear()}>Clear Signature</Button>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Upload Delivery Photo</Form.Label>
                        <Form.Control type="file" onChange={(e) => setPodPhoto(e.target.files[0])} accept="image/*" />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPodModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={handlePodSubmit}>Submit & Mark Delivered</Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
};

export default DriverDashboard;
