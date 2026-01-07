import { useContext } from 'react';
import { Container } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import CustomerDashboard from '../components/CustomerDashboard';
import DriverDashboard from '../components/DriverDashboard';
import AdminDashboard from '../components/AdminDashboard';

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <div className="text-center mt-5">Please log in to view the dashboard.</div>;
    }

    return (
        <Container className="py-5">
            {user.role === 'admin' && <AdminDashboard />}
            {user.role === 'driver' && <DriverDashboard />}
            {(user.role === 'user' || !user.role) && <CustomerDashboard />}
        </Container>
    );
};

export default Dashboard;
