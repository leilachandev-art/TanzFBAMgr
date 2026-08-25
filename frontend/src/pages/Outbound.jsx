import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker,
  Typography, Row, Col, Card, Popconfirm, message, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { outboundApi, inboundApi, excelApi, downloadBlob } from '../api'
import { useAuth } from '../App'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select
const carriers = ['GCF', 'BENZ', 'KN', 'CEYCAN', 'SHIPX', 'SKY', 'WM', '自提-1', '自提-2', '自提-3', '客户送']

export default function Outbound() {
  const { user } = useAuth()
  const [data, setData] = useState([])
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
      const res = await outboundApi.list(params)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    inboundApi.list({ limit: 500 }).then(r => setContainers(r.data))
  }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (r) => {
    setEditing(r)
    form.setFieldsValue({ ...r, date_out: r.date_out ? dayjs(r.date_out) : null })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (values.date_out) values.date_out = values.date_out.toISOString()
      if (editing) {
        await outboundApi.update(editing.id, values)
        message.success('Updated')
      } else {
        await outboundApi.create(values)
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
    await outboundApi.delete(id)
    message.success('Deleted')
    fetchData()
  }

  const exportExcel = async () => {
    try {
      const res = await excelApi.exportOutbound()
      downloadBlob(res.data, `FBA_Outbound_${dayjs().format('YYYYMMDD')}.xlsx`)
    } catch { message.error('Export failed') }
  }

  const columns = [
    { title: 'Container#', dataIndex: 'container_no', key: 'container_no', fixed: 'left', width: 160 },
    { title: 'Client', dataIndex: 'client_code', key: 'client_code', width: 80 },
    { title: 'Date Out', dataIndex: 'date_out', key: 'date_out', width: 110,
      render: d => d ? dayjs(d).format('MM/DD/YYYY') : '-', sorter: (a, b) => new Date(a.date_out) - new Date(b.date_out) },
    { title: 'CTNs', dataIndex: 'ctns_out', key: 'ctns_out', width: 80, align: 'right' },
    { title: 'SKIDs', dataIndex: 'skids_out', key: 'skids_out', width: 80, align: 'right' },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', width: 100 },
    { title: 'Destination FC', dataIndex: 'destination', key: 'destination', width: 100 },
    { title: 'ISA #', dataIndex: 'isa', key: 'isa', width: 120 },
    { title: 'POD', dataIndex: 'pod', key: 'pod', width: 120 },
    { title: 'Wait', dataIndex: 'wait_time', key: 'wait_time', width: 80 },
    { title: 'Time In', dataIndex: 'time_in', key: 'time_in', width: 80 },
    { title: 'Time Out', dataIndex: 'time_out', key: 'time_out', width: 80 },
    { title: 'Pallets', dataIndex: 'total_pallets', key: 'total_pallets', width: 80, align: 'right' },
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

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Outbound Records</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportExcel}>Export Excel</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Outbound</Button>
        </Space>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Input placeholder="Search container#, carrier, destination, POD..." prefix={<SearchOutlined />}
          value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ maxWidth: 400 }} />
      </Card>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        scroll={{ x: 1400 }} size="small"
        summary={pd => {
          const totCtn = pd.reduce((s, r) => s + r.ctns_out, 0)
          const totSkid = pd.reduce((s, r) => s + r.skids_out, 0)
          return (
            <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
              <Table.Summary.Cell index={0} colSpan={3}>Total ({pd.length})</Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">{totCtn}</Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">{totSkid}</Table.Summary.Cell>
              <Table.Summary.Cell index={5} colSpan={10} />
            </Table.Summary.Row>
          )
        }}
      />

      <Modal title={editing ? 'Edit Outbound' : 'Add Outbound'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} width={720} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="container_id" label="Container" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select container" filterOption={(i, o) => o.label?.toLowerCase().includes(i.toLowerCase())}
                  options={containers.map(c => ({ value: c.id, label: `${c.container_no} (${c.client_code}) - Balance: ${c.ctns_balance}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_out" label="Date Out">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="ctns_out" label="CTNs Out" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="skids_out" label="SKIDs Out" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="carrier" label="Carrier">
                <Select showSearch allowClear placeholder="Select carrier">
                  {carriers.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="destination" label="Destination FC">
                <Input placeholder="e.g. YYZ9, YYZ4" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isa" label="ISA #">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pod" label="POD">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="wait_time" label="Wait Time"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="time_in" label="Time In"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="time_out" label="Time Out"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="total_pallets" label="Total Pallets"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="note" label="Note"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
