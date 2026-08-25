import React, { useState, useEffect } from 'react'
import { Drawer, Table, Button, Form, Input, InputNumber, DatePicker, Space, Popconfirm,
  message, Typography, Tag, Row, Col, Divider, Modal } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { outboundApi } from '../api'
import { useAuth } from '../App'
import dayjs from 'dayjs'

export default function OutboundDrawer({ container, onClose }) {
  const { user } = useAuth()
  const [outbounds, setOutbounds] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const fetchOutbounds = async () => {
    setLoading(true)
    try {
      const res = await outboundApi.list({ container_id: container.id })
      setOutbounds(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (container) fetchOutbounds() }, [container])

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
        await outboundApi.create({ ...values, container_id: container.id })
        message.success('Created')
      }
      setModalOpen(false)
      fetchOutbounds()
      onClose()
    } catch (err) {
      if (err.errorFields) return
      message.error(err.response?.data?.detail || 'Save failed')
    }
  }

  const handleDelete = async (id) => {
    await outboundApi.delete(id)
    message.success('Deleted')
    fetchOutbounds()
    onClose()
  }

  const totalOut = outbounds.reduce((s, r) => s + r.ctns_out, 0)
  const balance = Math.max(0, container.ctns_in - totalOut)

  const columns = [
    { title: 'Date Out', dataIndex: 'date_out', width: 110, render: d => d ? dayjs(d).format('MM/DD/YYYY') : '-' },
    { title: 'CTNs', dataIndex: 'ctns_out', width: 70, align: 'right' },
    { title: 'SKIDs', dataIndex: 'skids_out', width: 70, align: 'right' },
    { title: 'Carrier', dataIndex: 'carrier', width: 90 },
    { title: 'Dest FC', dataIndex: 'destination', width: 80 },
    { title: 'ISA', dataIndex: 'isa', width: 100 },
    { title: 'POD', dataIndex: 'pod', width: 100 },
    { title: 'Note', dataIndex: 'note', width: 100 },
    { title: '', key: 'actions', width: 70, render: (_, r) => (
      <Space size="small">
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
    <>
      <Drawer
        title={`Outbound Records — ${container.container_no || `Container #${container.id}`}`}
        placement="right" width={900} open={!!container} onClose={onClose}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Outbound</Button>}
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Typography.Text type="secondary">Client: </Typography.Text><strong>{container.client_code}</strong></Col>
          <Col span={6}><Typography.Text type="secondary">Dest: </Typography.Text><strong>{container.destination}</strong></Col>
          <Col span={4}><Typography.Text type="secondary">In: </Typography.Text><strong>{container.ctns_in}</strong></Col>
          <Col span={4}><Typography.Text type="secondary">Out: </Typography.Text><strong style={{ color: '#fa8c16' }}>{totalOut}</strong></Col>
          <Col span={4}>
            <Typography.Text type="secondary">Balance: </Typography.Text>
            <strong style={{ color: balance > 0 ? '#1677ff' : '#52c41a' }}>{balance}</strong>
          </Col>
        </Row>
        <Table columns={columns} dataSource={outbounds} rowKey="id" loading={loading}
          size="small" scroll={{ x: 700 }} pagination={false} />
      </Drawer>

      <Modal title={editing ? 'Edit Outbound' : 'Add Outbound'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} width={680} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
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
                <Input placeholder="e.g. GCF, BENZ, KN" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="destination" label="Destination FC">
                <Input placeholder="e.g. YYZ9" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isa" label="ISA #">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pod" label="POD">
                <Input placeholder="Proof of Delivery" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="wait_time" label="Wait Time (等时)">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="time_in" label="Time In">
                <Input placeholder="e.g. 09:00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="time_out" label="Time Out">
                <Input placeholder="e.g. 14:30" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="total_pallets" label="Total Pallets">
                <InputNumber min={0} style={{ width: '100%' }} />
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
    </>
  )
}
