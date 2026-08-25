import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, Alert } from 'antd'
import {
  InboxOutlined, ExportOutlined, BarChartOutlined, TruckOutlined,
  RiseOutlined, FallOutlined, ApartmentOutlined,
} from '@ant-design/icons'
import { dashboardApi } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography

const statusColor = { 'In Storage': 'blue', 'Partially Out': 'orange', 'Completed': 'green' }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (!data) return <Alert message="Failed to load dashboard" type="error" />

  const stats = [
    { title: 'Active Containers', value: data.active_containers, icon: <InboxOutlined />, color: '#1677ff' },
    { title: 'Partial Out', value: data.partial_containers, icon: <RiseOutlined />, color: '#fa8c16' },
    { title: 'Completed', value: data.completed_containers, icon: <ExportOutlined />, color: '#52c41a' },
    { title: 'CTNs Balance', value: data.ctns_balance, icon: <BarChartOutlined />, color: '#722ed1' },
    { title: 'CTNs In (Total)', value: data.total_ctns_in, icon: <RiseOutlined />, color: '#13c2c2' },
    { title: 'CTNs Out (Total)', value: data.total_ctns_out, icon: <FallOutlined />, color: '#eb2f96' },
    { title: 'Pending Appts', value: data.pending_appointments, icon: <TruckOutlined />, color: '#fa541c' },
    { title: 'Active Docks', value: data.active_docks, icon: <ApartmentOutlined />, color: '#2f54eb' },
  ]

  const inboundCols = [
    { title: 'Container#', dataIndex: 'container_no', key: 'container_no', width: 150 },
    { title: 'Client', dataIndex: 'client_code', key: 'client_code', width: 80 },
    { title: 'CTNs', dataIndex: 'ctns_in', key: 'ctns_in', width: 70 },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', width: 90 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 110,
      render: s => <Tag color={statusColor[s] || 'default'}>{s}</Tag> },
    { title: 'Date In', dataIndex: 'date_in', key: 'date_in',
      render: d => d ? dayjs(d).format('MM/DD/YYYY') : '-' },
  ]

  const outboundCols = [
    { title: 'Container#', dataIndex: 'container_no', key: 'container_no', width: 150 },
    { title: 'CTNs', dataIndex: 'ctns_out', key: 'ctns_out', width: 70 },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', width: 90 },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', width: 90 },
    { title: 'Date Out', dataIndex: 'date_out', key: 'date_out',
      render: d => d ? dayjs(d).format('MM/DD/YYYY') : '-' },
  ]

  return (
    <div>
      <Title level={3}>Dashboard</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Col xs={12} sm={8} md={6} key={i}>
            <Card style={{ borderTop: `3px solid ${s.color}` }}>
              <Statistic title={s.title} value={s.value} prefix={React.cloneElement(s.icon, { style: { color: s.color } })} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Recent Inbound" extra={<a href="/inbound">View All</a>}>
            <Table columns={inboundCols} dataSource={data.recent_inbound} rowKey="id"
              pagination={false} size="small" scroll={{ x: true }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Outbound" extra={<a href="/outbound">View All</a>}>
            <Table columns={outboundCols} dataSource={data.recent_outbound} rowKey="id"
              pagination={false} size="small" scroll={{ x: true }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
