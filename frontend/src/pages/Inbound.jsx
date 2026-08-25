import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, DatePicker,
  Typography, Row, Col, Card, Popconfirm, message, Tooltip, Badge } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { inboundApi, clientApi, outboundApi, excelApi, downloadBlob } from '../api'
import { useAuth } from '../App'
import dayjs from 'dayjs'
import OutboundDrawer from '../components/OutboundDrawer'

const { Title } = Typography
const { Option } = Select

const statusColor = { 'In Storage': 'blue', 'Partially Out': 'orange', 'Completed': 'green' }
const statusOptions = ['In Storage', 'Partially Out', 'Completed']
const containerTypes = ['container', 'truck', 'LTL', 'Air', 'Other']
const inspectionOptions = ['一致', '短少', '多出', 'N/A']

export default function Inbound() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [outboundDrawer, setOutboundDrawer] = useState(null)
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      if (filterClient) params.client_code = filterClient
      const res = await inboundApi.list(params)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, filterClient])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { clientApi.list().then(r => setClients(r.data)) }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue({ ...record, date_in: record.date_in ? dayjs(record.date_in) : null })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (values.date_in) values.date_in = values.date_in.toISOString()
      if (editing) {
        await inboundApi.update(editing.id, values)
        message.success('Updated successfully')
      } else {
        await inboundApi.create(values)
        message.success('Created successfully')
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      if (err.errorFields) return
      message.error(err.response?.data?.detail || 'Save failed')
    }
  }

  const handleDelete = async (id) => {
    try {
      await inboundApi.delete(id)
      message.success('Deleted')
      fetchData()
    } catch (err) {
      message.error(err.response?.data?.detail || 'Delete failed')
    }
  }

  const exportExcel = async () => {
    try {
      const res = await excelApi.exportInbound()
      downloadBlob(res.data, `FBA_Inbound_${dayjs().format('YYYYMMDD')}.xlsx`)
    } catch { message.error('Export failed') }
  }

  const columns = [
    { title: 'Container#', dataIndex: 'container_no', key: 'container_no', fixed: 'left', width: 160,
      render: (v, r) => <a onClick={() => setOutboundDrawer(r)}>{v || `#${r.id}`}</a> },
    { title: 'Client', dataIndex: 'client_code', key: 'client_code', width: 80 },
    { title: 'Date In', dataIndex: 'date_in', key: 'date_in', width: 110,
      render: d => d ? dayjs(d).format('MM/DD/YYYY') : '-', sorter: (a, b) => new Date(a.date_in) - new Date(b.date_in) },
    { title: 'Type', dataIndex: 'container_type', key: 'container_type', width: 90 },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', width: 100 },
    { title: 'Inspection', dataIndex: 'inspection', key: 'inspection', width: 100,
      render: v => v ? <Tag color={v === '一致' ? 'green' : 'red'}>{v}</Tag> : '-' },
    { title: 'CTNs In', dataIndex: 'ctns_in', key: 'ctns_in', width: 90, align: 'right' },
    { title: 'SKIDs In', dataIndex: 'skids_in', key: 'skids_in', width: 90, align: 'right' },
    { title: 'CTNs Out', dataIndex: 'ctns_out_total', key: 'ctns_out_total', width: 90, align: 'right', render: v => <span style={{ color: '#fa8c16' }}>{v}</span> },
    { title: 'Balance', dataIndex: 'ctns_balance', key: 'ctns_balance', width: 90, align: 'right',
      render: v => <span style={{ fontWeight: 'bold', color: v > 0 ? '#1677ff' : '#52c41a' }}>{v}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120,
      render: s => <Tag color={statusColor[s]}>{s}</Tag>,
      filters: statusOptions.map(s => ({ text: s, value: s })),
      onFilter: (val, r) => r.status === val,
    },
    { title: 'Actions', key: 'actions', fixed: 'right', width: 120, render: (_, r) => (
      <Space>
        <Tooltip title="View Outbound"><Button size="small" icon={<EyeOutlined />} onClick={() => setOutboundDrawer(r)} /></Tooltip>
        <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>
        {user?.role === 'admin' && (
          <Popconfirm title="Delete this container?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Inbound Containers</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportExcel}>Export Excel</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Container</Button>
        </Space>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Input placeholder="Search container#, client, mark..." prefix={<SearchOutlined />}
              value={search} onChange={e => setSearch(e.target.value)} allowClear />
          </Col>
          <Col xs={12} sm={6}>
            <Select placeholder="Filter by Status" value={filterStatus || undefined}
              onChange={setFilterStatus} allowClear style={{ width: '100%' }}>
              {statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6}>
            <Select placeholder="Filter by Client" value={filterClient || undefined}
              onChange={setFilterClient} allowClear style={{ width: '100%' }} showSearch>
              {clients.map(c => <Option key={c.code} value={c.code}>{c.code}</Option>)}
            </Select>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns} dataSource={data} rowKey="id" loading={loading}
        scroll={{ x: 1200 }} size="small"
        summary={pageData => {
          const totalIn = pageData.reduce((s, r) => s + r.ctns_in, 0)
          const totalOut = pageData.reduce((s, r) => s + (r.ctns_out_total || 0), 0)
          const totalBal = pageData.reduce((s, r) => s + (r.ctns_balance || 0), 0)
          return (
            <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
              <Table.Summary.Cell index={0} colSpan={6}>Total ({pageData.length} records)</Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">{totalIn}</Table.Summary.Cell>
              <Table.Summary.Cell index={7} />
              <Table.Summary.Cell index={8} align="right" style={{ color: '#fa8c16' }}>{totalOut}</Table.Summary.Cell>
              <Table.Summary.Cell index={9} align="right" style={{ color: '#1677ff' }}>{totalBal}</Table.Summary.Cell>
              <Table.Summary.Cell index={10} colSpan={2} />
            </Table.Summary.Row>
          )
        }}
      />

      {/* Create/Edit Modal */}
      <Modal title={editing ? 'Edit Container' : 'Add Container'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} width={700} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="client_code" label="Client" rules={[{ required: true }]}>
                <Select showSearch allowClear placeholder="Select client">
                  {clients.map(c => <Option key={c.code} value={c.code}>{c.code} {c.name && `- ${c.name}`}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_in" label="Date In">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="container_no" label="Container# / JOB#" rules={[{ required: true }]}>
                <Input placeholder="e.g. CMAU9450322" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="container_type" label="Type" initialValue="container">
                <Select>{containerTypes.map(t => <Option key={t} value={t}>{t}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ctns_in" label="CTNS" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="skids_in" label="SKIDs" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="destination" label="Destination FC">
                <Input placeholder="e.g. YYZ9" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inspection" label="Inspection (清点)">
                <Select allowClear>{inspectionOptions.map(o => <Option key={o} value={o}>{o}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mark" label="Mark">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sku" label="SKU">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" initialValue="In Storage">
                <Select>{statusOptions.map(s => <Option key={s} value={s}>{s}</Option>)}</Select>
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

      {/* Outbound Drawer */}
      {outboundDrawer && (
        <OutboundDrawer container={outboundDrawer} onClose={() => { setOutboundDrawer(null); fetchData() }} />
      )}
    </div>
  )
}
