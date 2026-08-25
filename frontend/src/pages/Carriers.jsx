import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Typography, Row, Col,
  Card, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { carrierApi, clientApi, excelApi, downloadBlob } from '../api'
import { useAuth } from '../App'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

const statusColors = {
  'ARRIVAL_SCHEDULED': 'blue', 'CHECKED_IN': 'cyan', 'UNLOADING': 'orange',
  'CLOSED': 'green', 'CANCELLED': 'red', 'PENDING': 'default',
}
const statusOptions = ['PENDING', 'ARRIVAL_SCHEDULED', 'CHECKED_IN', 'UNLOADING', 'CLOSED', 'CANCELLED']
const carrierList = ['GCF', 'BENZ', 'KN', 'CEYCAN', 'SHIPX', 'SKY', 'WM', 'KLAIR']

export default function Carriers() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      if (filterClient) params.client_code = filterClient
      const res = await carrierApi.list(params)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, filterClient])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { clientApi.list().then(r => setClients(r.data)) }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (r) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true) }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editing) {
        await carrierApi.update(editing.id, values)
        message.success('Updated')
      } else {
        await carrierApi.create(values)
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
    await carrierApi.delete(id)
    message.success('Deleted')
    fetchData()
  }

  const exportExcel = async () => {
    try {
      const res = await excelApi.exportCarriers()
      downloadBlob(res.data, `FBA_Carriers_${dayjs().format('YYYYMMDD')}.xlsx`)
    } catch { message.error('Export failed') }
  }

  const columns = [
    { title: 'Client', dataIndex: 'client_code', key: 'client_code', fixed: 'left', width: 80 },
    { title: 'Appointment ID', dataIndex: 'appointment_id', key: 'appointment_id', width: 140 },
    { title: 'Trailer#', dataIndex: 'trailer_number', key: 'trailer_number', width: 120 },
    { title: 'Ref Code', dataIndex: 'reference_code', key: 'reference_code', width: 160 },
    { title: 'Dest FC', dataIndex: 'destination_fc', key: 'destination_fc', width: 80 },
    { title: 'ISA', dataIndex: 'isa', key: 'isa', width: 120 },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', width: 90 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 160,
      render: s => <Tag color={statusColors[s] || 'default'}>{s?.replace(/_/g, ' ')}</Tag>,
      filters: statusOptions.map(s => ({ text: s.replace(/_/g, ' '), value: s })),
      onFilter: (v, r) => r.status === v,
    },
    { title: 'Scheduled', dataIndex: 'scheduled_time', key: 'scheduled_time', width: 160 },
    { title: 'Arrival', dataIndex: 'arrival_time', key: 'arrival_time', width: 140 },
    { title: 'Check In', dataIndex: 'checkin_time', key: 'checkin_time', width: 140 },
    { title: 'Unloaded', dataIndex: 'unloaded_time', key: 'unloaded_time', width: 140 },
    { title: 'Note', dataIndex: 'note', key: 'note', width: 120, ellipsis: true },
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

  const formFields = [
    { name: 'client_code', label: 'Client', type: 'clientSelect', span: 8 },
    { name: 'appointment_id', label: 'Appointment ID', span: 8 },
    { name: 'trailer_number', label: 'Trailer Number', span: 8 },
    { name: 'reference_code', label: 'Reference Code', span: 12 },
    { name: 'destination_fc', label: 'Destination FC', span: 6 },
    { name: 'isa', label: 'ISA #', span: 6 },
    { name: 'carrier', label: 'Carrier', type: 'carrierSelect', span: 8 },
    { name: 'status', label: 'Status', type: 'statusSelect', span: 8, init: 'PENDING' },
    { name: 'requested_delivery_date', label: 'Requested Delivery Date', span: 12 },
    { name: 'scheduled_time', label: 'Scheduled Time', span: 12 },
    { name: 'arrival_time', label: 'Arrival Time', span: 12 },
    { name: 'checkin_time', label: 'Check In Time', span: 12 },
    { name: 'unloaded_time', label: 'Unloaded Time', span: 12 },
    { name: 'closed_time', label: 'Closed Time', span: 12 },
    { name: 'creation_time', label: 'Creation Time', span: 12 },
    { name: 'note', label: 'Note', type: 'textarea', span: 24 },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>FBA Appointments</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportExcel}>Export Excel</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Appointment</Button>
        </Space>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Input placeholder="Search appointment ID, trailer, carrier..." prefix={<SearchOutlined />}
              value={search} onChange={e => setSearch(e.target.value)} allowClear />
          </Col>
          <Col xs={12} sm={6}>
            <Select placeholder="Filter Status" value={filterStatus || undefined} onChange={setFilterStatus} allowClear style={{ width: '100%' }}>
              {statusOptions.map(s => <Option key={s} value={s}>{s.replace(/_/g, ' ')}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6}>
            <Select placeholder="Filter Client" value={filterClient || undefined} onChange={setFilterClient} allowClear style={{ width: '100%' }} showSearch>
              {clients.map(c => <Option key={c.code} value={c.code}>{c.code}</Option>)}
            </Select>
          </Col>
        </Row>
      </Card>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        scroll={{ x: 1600 }} size="small" />

      <Modal title={editing ? 'Edit Appointment' : 'Add Appointment'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} width={800} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            {formFields.map(f => (
              <Col span={f.span} key={f.name}>
                <Form.Item name={f.name} label={f.label} initialValue={f.init}>
                  {f.type === 'clientSelect' ? (
                    <Select showSearch allowClear>
                      {clients.map(c => <Option key={c.code} value={c.code}>{c.code}</Option>)}
                    </Select>
                  ) : f.type === 'carrierSelect' ? (
                    <Select showSearch allowClear>
                      {carrierList.map(c => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  ) : f.type === 'statusSelect' ? (
                    <Select>{statusOptions.map(s => <Option key={s} value={s}>{s.replace(/_/g, ' ')}</Option>)}</Select>
                  ) : f.type === 'textarea' ? (
                    <Input.TextArea rows={2} />
                  ) : (
                    <Input />
                  )}
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
