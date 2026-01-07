import { useState, useEffect, useContext } from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get('http://localhost:5000/api/users', config);
                setUsers(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchUsers();
    }, [user.token]);

    const deleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                await axios.delete(`http://localhost:5000/api/users/${id}`, config);
                setUsers(users.filter((u) => u._id !== id));
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div>
            <h2 className="mb-4">System Overview - <Badge bg="danger">Admin</Badge></h2>
            <h4 className="mb-3">User Management</h4>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u._id}>
                            <td>{u._id}</td>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                                <Badge bg={u.role === 'admin' ? 'danger' : u.role === 'driver' ? 'warning' : 'primary'}>
                                    {u.role.toUpperCase()}
                                </Badge>
                            </td>
                            <td>
                                <Button variant="danger" size="sm" onClick={() => deleteUser(u._id)}>
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default AdminDashboard;
