import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import L from 'leaflet';
import { Spinner, Alert } from 'react-bootstrap';

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

// Component to recenter map when position changes
function ChangeView({ center }) {
    const map = useMap();
    map.setView(center);
    return null;
}

const MiniTrackingMap = ({ trackingId, initialLocation }) => {
    const [location, setLocation] = useState(initialLocation);
    const [connected, setConnected] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log("MiniMap Socket Connected");
            setConnected(true);
            newSocket.emit('join_tracking', trackingId);
        });

        newSocket.on('receive_location', (data) => {
            console.log("MiniMap Update:", data);
            setLocation(data);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [trackingId]);

    // If we have no location yet (neither initial nor socket), show waiting
    // However, if we possess an initial location, we render immediately.

    // We should allow rendering if we have a location.

    if (!location) {
        return (
            <div className="text-center p-4">
                <Spinner animation="grow" variant="primary" />
                <p className="mt-2 text-muted">Waiting for driver location...</p>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', width: '100%', minHeight: '300px' }}>
            <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%', minHeight: '300px' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[location.lat, location.lng]}>
                    <Popup>
                        Driver Position <br />
                        {new Date().toLocaleTimeString()}
                    </Popup>
                </Marker>
                <ChangeView center={[location.lat, location.lng]} />
            </MapContainer>
        </div>
    );
};

export default MiniTrackingMap;
