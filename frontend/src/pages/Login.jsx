import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../App'
import { authApi } from '../api'

export default function Login() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onFinish = async (values) => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login({ username: values.username, password: values.password })
      login(res.data.user, res.data.access_token)
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #001529 0%, #1677ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Card style={{ width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Typography.Title level={2} style={{ margin: 0 }}>🚢 FBA Manager</Typography.Title>
            <Typography.Text type="secondary">Logistics Management System</Typography.Text>
          </div>
          {error && <Alert message={error} type="error" showIcon />}
          <Form onFinish={onFinish} layout="vertical" size="large">
            <Form.Item name="username" rules={[{ required: true, message: 'Please enter username' }]}>
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Please enter password' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Sign In</Button>
          </Form>
          <Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: 12 }}>
            Default: admin / admin123
          </Typography.Text>
        </Space>
      </Card>
    </div>
  )
}
