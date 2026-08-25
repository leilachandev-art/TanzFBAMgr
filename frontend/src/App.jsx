import React, { createContext, useContext, useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, Typography, theme, ConfigProvider, Badge } from 'antd'
import {
  DashboardOutlined, InboxOutlined, ExportOutlined, BarChartOutlined,
  CarOutlined, ApartmentOutlined, TeamOutlined, UserOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, TruckOutlined,
} from '@ant-design/icons'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inbound from './pages/Inbound'
import Outbound from './pages/Outbound'
import Inventory from './pages/Inventory'
import Carriers from './pages/Carriers'
import Docking from './pages/Docking'
import Clients from './pages/Clients'
import Users from './pages/Users'

const { Header, Sider, Content } = Layout

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { token } = theme.useToken()

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
    { key: '/inbound', icon: <InboxOutlined />, label: <Link to="/inbound">Inbound</Link> },
    { key: '/inventory', icon: <BarChartOutlined />, label: <Link to="/inventory">Inventory</Link> },
    { key: '/outbound', icon: <ExportOutlined />, label: <Link to="/outbound">Outbound</Link> },
    { key: '/carriers', icon: <TruckOutlined />, label: <Link to="/carriers">FBA Appointments</Link> },
    { key: '/docking', icon: <ApartmentOutlined />, label: <Link to="/docking">Docking</Link> },
    { type: 'divider' },
    { key: '/clients', icon: <TeamOutlined />, label: <Link to="/clients">Clients</Link> },
    ...(user?.role === 'admin' ? [{ key: '/users', icon: <UserOutlined />, label: <Link to="/users">Users</Link> }] : []),
  ]

  const userMenu = [
    { key: 'profile', label: `${user?.full_name || user?.username} (${user?.role})`, disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: logout },
  ]

  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        style={{ background: '#001529', overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          {!collapsed ? (
            <Typography.Title level={4} style={{ color: '#fff', margin: 0, fontSize: 16 }}>
              🚢 FBA Manager
            </Typography.Title>
          ) : (
            <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>🚢</Typography.Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        <Header style={{
          padding: '0 24px', background: token.colorBgContainer,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${token.colorBorderSecondary}`, position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)} />
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Avatar style={{ cursor: 'pointer', background: token.colorPrimary }}>
              {(user?.username || 'U')[0].toUpperCase()}
            </Avatar>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px', overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const navigate = useNavigate()

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    navigate('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          {user ? (
            <Route path="/*" element={
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="inbound" element={<Inbound />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="outbound" element={<Outbound />} />
                  <Route path="carriers" element={<Carriers />} />
                  <Route path="docking" element={<Docking />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="users" element={<Users />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </AppLayout>
            } />
          ) : (
            <Route path="/*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </AuthContext.Provider>
    </ConfigProvider>
  )
}
