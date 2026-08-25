import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Typography, Row, Col, Card, Popconfirm, message, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { userApi } from '../api'

const { Title } = Typography
const { Option } = Select

const roleColor = { admin: 'red', manager: 'blue', staff: 'green' }

export default function Users() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try { const res = await userApi.list(); setData(res.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (r) => {
    setEditing(r)
    form.setFieldsValue({ ...r, password: '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (!editing && !values.password) {
        message.error('Password is required for new users')
        return
      }
      if (!values.password) delete values.password
      if (editing) {
        await userApi.update(editing.id, values)
        message.success('Updated')
      } else {
        await userApi.create(values)
        message.success('Created')
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      if (err.errorFields) return
      message.error(err.response?.data?.detail || 'Save failed')
    }
  }

  const handleDelete = async (id) => {
    await userApi.delete(id)
    message.success('Deleted')
    fetchData()
  }

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username', width: 120 },
    { title: 'Full Name', dataIndex: 'full_name', key: 'full_name', width: 160 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Role', dataIndex: 'role', key: 'role', width: 100,
      render: r => <Tag color={roleColor[r]}>{r?.toUpperCase()}</Tag> },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', width: 90,
      render: v => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: d => d ? new Date(d).toLocaleDateString() : '-' },
    { title: 'Actions', key: 'actions', width: 90, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        <Popconfirm title="Delete this user?" onConfirm={() => handleDelete(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>User Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add User</Button>
      </Row>
      <Card><Typography.Text type="secondary">Manage team accounts. Admins can create/edit/delete users. Up to 10 users supported.</Typography.Text></Card>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} style={{ marginTop: 16 }} size="small" />

      <Modal title={editing ? 'Edit User' : 'Add User'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="full_name" label="Full Name"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Form.Item name="role" label="Role" initialValue="staff">
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="manager">Manager</Option>
              <Option value="staff">Staff</Option>
            </Select>
          </Form.Item>
          <Form.Item name="password" label={editing ? 'New Password (leave blank to keep)' : 'Password'}
            rules={editing ? [] : [{ required: true }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
