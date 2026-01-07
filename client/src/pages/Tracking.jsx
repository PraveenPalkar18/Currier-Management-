import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Alert, Spinner } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import axios from 'axios';
import L from 'leaflet';

// Fix for Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const socket = io('http://localhost:5000'); // Clean cleanup handling needed?

// Component to recenter map when position changes
function ChangeView({ center }) {
    const map = useMap();
    map.setView(center);
    return null;
}

const Tracking = () => {
    const { id } = useParams(); // trackingId or shipmentId? Route uses :id, let's assume it matches trackingId
    const [shipment, setShipment] = useState(null);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShipment = async () => {
            try {
                const { data } = await axios.get(`http://localhost:5000/api/shipments/${id}`);
                setShipment(data);
                if (data.currentLocation && data.currentLocation.lat) {
                    setLocation({ lat: data.currentLocation.lat, lng: data.currentLocation.lng });
                }
                setLoading(false);
            } catch (err) {
                setError('Shipment not found');
                setLoading(false);
            }
        };

        fetchShipment();

        // Socket.io connection
        socket.emit('join_tracking', id);

        socket.on('receive_location', (data) => {
            console.log("Received location update:", data);
            setLocation(data);
        });

        return () => {
            socket.off('receive_location');
            // socket.emit('leave_tracking', id); // Optionally implement leave room
        };
    }, [id]);

    if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header as="h4">Track Shipment: {shipment?.trackingId}</Card.Header>
                <Card.Body>
                    <Card.Title>Status: {shipment?.currentStatus}</Card.Title>
                    <Card.Text>
                        <strong>From:</strong> {shipment?.from} <br />
                        <strong>To:</strong> {shipment?.to}
                    </Card.Text>

                    {location ? (
                        <div style={{ height: '400px', width: '100%' }}>
                            <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Marker position={[location.lat, location.lng]}>
                                    <Popup>
                                        Driver is here! <br />
                                        Last Updated: {new Date().toLocaleTimeString()}
                                    </Popup>
                                </Marker>
                                <ChangeView center={[location.lat, location.lng]} />
                            </MapContainer>
                        </div>
                    ) : (
                        <Alert variant="info">Waiting for location updates... (Driver has not started or no location data yet)</Alert>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Tracking;
