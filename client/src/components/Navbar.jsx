import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaShippingFast } from 'react-icons/fa';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const AppNavbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar expand="lg" className="glass sticky-top" variant="light">
            <Container>
                <Navbar.Brand as={Link} to={user ? "/dashboard" : "/"} className="d-flex align-items-center gap-2 fw-bold text-primary">
                    <FaShippingFast size={28} /> TurboLogistics
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-center">
                        {!user && <Nav.Link as={Link} to="/home">About</Nav.Link>}
                        {/* Track Shipment Link Removed */}
                        {user ? (
                            <>
                                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                                <Button variant="outline-primary" className="ms-2" onClick={handleLogout}>Logout</Button>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Button as={Link} to="/register" variant="primary" className="ms-2 text-white">Register</Button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavbar;
