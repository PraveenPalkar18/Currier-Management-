import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get('http://localhost:5000/api/analytics/dashboard', config);
                setAnalytics(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        if (user && user.role === 'admin') {
            fetchAnalytics();
        }
    }, [user]);

    if (loading) return <div>Loading Analytics...</div>;
    if (!analytics) return <div>Error loading data</div>;

    // Data Transformation for Recharts
    const statusData = analytics.statusDistribution.map(item => ({
        name: item._id,
        value: item.count
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    // Format Monthly data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendData = analytics.monthlyTrend.map(item => ({
        month: monthNames[item._id - 1],
        shipments: item.count,
        revenue: item.cost
    }));

    const formatDuration = (ms) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        return `${hours}h ${(Math.floor(ms / (1000 * 60)) % 60)}m`;
    };

    return (
        <Container fluid>
            <h2 className="mb-4">Admin Analytics Dashboard</h2>

            {/* KPI Cards */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <Card.Title>Total Revenue</Card.Title>
                            <Card.Text className="display-6 text-success">
                                ${analytics.totalRevenue.toLocaleString()}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <Card.Title>Avg Delivery Time</Card.Title>
                            <Card.Text className="display-6 text-primary">
                                {analytics.avgDeliveryTime ? formatDuration(analytics.avgDeliveryTime) : 'N/A'}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <Card.Title>Total Shipments</Card.Title>
                            <Card.Text className="display-6 text-warning">
                                {statusData.reduce((acc, curr) => acc + curr.value, 0)}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 1 */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <Card.Title>Shipment Status Distribution</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <Card.Title>Driver Performance (Deliveries)</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.driverPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="driverName" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="deliveries" fill="#82ca9d" name="Delivered Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 2 */}
            <Row>
                <Col md={12}>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <Card.Title>Monthly Trends (Shipments & Revenue)</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="shipments" stroke="#8884d8" activeDot={{ r: 8 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminDashboard;
