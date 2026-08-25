import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker, Typography, Row, Col,
  Card, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { dockingApi, clientApi, inboundApi } from '../api'
import { useAuth } from '../App'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

const statusColor = { 'FULL': 'green', 'EMPTY': 'default', 'PARTIAL': 'orange', 'PENDING': 'blue' }
const statusOptions = ['PENDING', 'FULL', 'PARTIAL', 'EMPTY']
const dockOptions = ['RAMP', 'BIN1', 'BIN2', 'BIN3', 'BIN4', 'BIN5', 'DOCK1', 'DOCK2', 'DOCK3']

export default function Docking() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [clients, setClients] = useState([])
  const [containers, setContainers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      const res = await dockingApi.list(params)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    clientApi.list().then(r => setClients(r.data))
    inboundApi.list({ limit: 500 }).then(r => setContainers(r.data))
  }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (r) => {
    setEditing(r)
    form.setFieldsValue({ ...r, date_in: r.date_in ? dayjs(r.date_in) : null, date_out: r.date_out ? dayjs(r.date_out) : null })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (values.date_in) values.date_in = values.date_in.toISOString()
      if (values.date_out) values.date_out = values.date_out.toISOString()
      if (editing) {
        await dockingApi.update(editing.id, values)
        message.success('Updated')
      } else {
        await dockingApi.create(values)
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
    await dockingApi.delete(id)
    message.success('Deleted')
    fetchData()
  }

  const columns = [
    { title: 'Date In', dataIndex: 'date_in', key: 'date_in', width: 120,
      render: d => d ? dayjs(d).format('MM/DD/YYYY') : '-', sorter: (a, b) => new Date(a.date_in) - new Date(b.date_in) },
    { title: 'Dock#', dataIndex: 'dock_no', key: 'dock_no', width: 90 },
    { title: 'Container#', dataIndex: 'container_no', key: 'container_no', width: 160 },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', width: 100 },
    { title: 'Client', dataIndex: 'client_code', key: 'client_code', width: 80 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: s => <Tag color={statusColor[s] || 'default'}>{s}</Tag>,
      filters: statusOptions.map(s => ({ text: s, value: s })),
      onFilter: (v, r) => r.status === v,
    },
    { title: 'Date Out', dataIndex: 'date_out', key: 'date_out', width: 120,
      render: d => d ? dayjs(d).format('MM/DD/YYYY') : '-' },
    { title: 'Note', dataIndex: 'note', key: 'note', ellipsis: true },
    { title: 'Actions', key: 'actions', fixed: 'right', width: 90, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        {user?.role === 'admin' && (
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Docking Form</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Record</Button>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Input placeholder="Search container#, client, carrier..." prefix={<SearchOutlined />}
          value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ maxWidth: 400 }} />
      </Card>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 900 }} size="small" />

      <Modal title={editing ? 'Edit Docking Record' : 'Add Docking Record'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} width={680} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date_in" label="Date In">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dock_no" label="Dock#">
                <Select showSearch allowClear>
                  {dockOptions.map(d => <Option key={d} value={d}>{d}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="container_no" label="Container#">
                <Select showSearch allowClear placeholder="Type or select container"
                  options={containers.map(c => ({ value: c.container_no, label: `${c.container_no} (${c.client_code})` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="carrier" label="Carrier">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="client_code" label="Client">
                <Select showSearch allowClear>
                  {clients.map(c => <Option key={c.code} value={c.code}>{c.code}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" initialValue="PENDING">
                <Select>{statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_out" label="Date Out">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="note" label="Note">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
