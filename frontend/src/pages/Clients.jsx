import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Space, Modal, Form, Input, Typography, Row, Col, Card, Popconfirm, message, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { clientApi } from '../api'
import { useAuth } from '../App'

const { Title } = Typography

export default function Clients() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientApi.list({ search })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (r) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true) }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await clientApi.update(editing.id, values)
        message.success('Updated')
      } else {
        await clientApi.create(values)
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
    await clientApi.delete(id)
    message.success('Deleted')
    fetchData()
  }

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 100, sorter: (a, b) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', width: 200 },
    { title: 'Contact', dataIndex: 'contact', key: 'contact', width: 150 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', width: 90,
      render: v => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Note', dataIndex: 'note', key: 'note', ellipsis: true },
    { title: 'Actions', key: 'actions', fixed: 'right', width: 90, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        {user?.role === 'admin' && (
          <Popconfirm title="Delete this client?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Clients</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Client</Button>
      </Row>
      <Card style={{ marginBottom: 16 }}>
        <Input placeholder="Search by code or name..." prefix={<SearchOutlined />}
          value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ maxWidth: 400 }} />
      </Card>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 900 }} size="small" />

      <Modal title={editing ? 'Edit Client' : 'Add Client'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="code" label="Client Code" rules={[{ required: true }]}>
            <Input placeholder="e.g. 3003" disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label="Name"><Input /></Form.Item>
          <Form.Item name="contact" label="Contact"><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Form.Item name="note" label="Note"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
