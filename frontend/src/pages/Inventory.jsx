import React, { useState, useEffect, useCallback } from 'react'
import { Table, Typography, Row, Col, Card, Input, Select, Statistic, Tag, Button, message } from 'antd'
import { SearchOutlined, DownloadOutlined, BarChartOutlined } from '@ant-design/icons'
import { inventoryApi, clientApi, excelApi, downloadBlob } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

export default function Inventory() {
  const [data, setData] = useState([])
  const [summary, setSummary] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterClient) params.client_code = filterClient
      const [dataRes, summaryRes] = await Promise.all([inventoryApi.list(params), inventoryApi.summary()])
      setData(dataRes.data)
      setSummary(summaryRes.data)
    } finally {
      setLoading(false)
    }
  }, [search, filterClient])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { clientApi.list().then(r => setClients(r.data)) }, [])

  const exportExcel = async () => {
    try {
      const res = await excelApi.exportInventory()
      downloadBlob(res.data, `FBA_Inventory_${dayjs().format('YYYYMMDD')}.xlsx`)
    } catch { message.error('Export failed') }
  }

  const columns = [
    { title: 'Container#', dataIndex: 'container_no', key: 'container_no', fixed: 'left', width: 160 },
    { title: 'Client', dataIndex: 'client_code', key: 'client_code', width: 80 },
    { title: 'Date In', dataIndex: 'date_in', key: 'date_in', width: 110,
      render: d => d ? dayjs(d).format('MM/DD/YYYY') : '-', sorter: (a, b) => new Date(a.date_in) - new Date(b.date_in) },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', width: 100 },
    { title: 'CTNs In', dataIndex: 'ctns_in', key: 'ctns_in', width: 90, align: 'right' },
    { title: 'CTNs Out', dataIndex: 'ctns_out', key: 'ctns_out', width: 90, align: 'right',
      render: v => <span style={{ color: '#fa8c16' }}>{v}</span> },
    { title: 'CTNs Balance', dataIndex: 'ctns_balance', key: 'ctns_balance', width: 110, align: 'right',
      render: v => <strong style={{ color: v > 0 ? '#1677ff' : '#999' }}>{v}</strong>,
      sorter: (a, b) => a.ctns_balance - b.ctns_balance },
    { title: 'SKIDs In', dataIndex: 'skids_in', key: 'skids_in', width: 90, align: 'right' },
    { title: 'SKIDs Out', dataIndex: 'skids_out', key: 'skids_out', width: 90, align: 'right',
      render: v => <span style={{ color: '#fa8c16' }}>{v}</span> },
    { title: 'SKIDs Balance', dataIndex: 'skids_balance', key: 'skids_balance', width: 110, align: 'right',
      render: v => <strong style={{ color: v > 0 ? '#1677ff' : '#999' }}>{v}</strong> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120,
      render: s => <Tag color={s === 'In Storage' ? 'blue' : 'orange'}>{s}</Tag> },
  ]

  const pctOut = summary ? Math.round((summary.total_ctns_out / (summary.total_ctns_in || 1)) * 100) : 0

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Inventory</Title>
        <Button icon={<DownloadOutlined />} onClick={exportExcel}>Export Excel</Button>
      </Row>

      {summary && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {[
            { title: 'Active Containers', value: summary.active_containers, color: '#1677ff' },
            { title: 'Partial Out', value: summary.partial_containers, color: '#fa8c16' },
            { title: 'Total CTNs In', value: summary.total_ctns_in, color: '#52c41a' },
            { title: 'Total CTNs Out', value: summary.total_ctns_out, color: '#ff4d4f' },
            { title: 'CTNs Balance', value: summary.total_ctns_balance, color: '#722ed1' },
            { title: 'SKIDs Balance', value: summary.total_skids_balance, color: '#13c2c2' },
          ].map((s, i) => (
            <Col xs={12} sm={8} md={4} key={i}>
              <Card><Statistic title={s.title} value={s.value} valueStyle={{ color: s.color }} /></Card>
            </Col>
          ))}
        </Row>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={10}>
            <Input placeholder="Search container#, client..." prefix={<SearchOutlined />}
              value={search} onChange={e => setSearch(e.target.value)} allowClear />
          </Col>
          <Col xs={24} sm={6}>
            <Select placeholder="Filter by Client" value={filterClient || undefined}
              onChange={setFilterClient} allowClear style={{ width: '100%' }} showSearch>
              {clients.map(c => <Option key={c.code} value={c.code}>{c.code}</Option>)}
            </Select>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns} dataSource={data} rowKey="id" loading={loading}
        scroll={{ x: 1100 }} size="small"
        summary={pageData => {
          const totIn = pageData.reduce((s, r) => s + r.ctns_in, 0)
          const totOut = pageData.reduce((s, r) => s + r.ctns_out, 0)
          const totBal = pageData.reduce((s, r) => s + r.ctns_balance, 0)
          return (
            <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
              <Table.Summary.Cell index={0} colSpan={4}>Total ({pageData.length} records)</Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">{totIn}</Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right" style={{ color: '#fa8c16' }}>{totOut}</Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right" style={{ color: '#1677ff' }}>{totBal}</Table.Summary.Cell>
              <Table.Summary.Cell index={7} colSpan={4} />
            </Table.Summary.Row>
          )
        }}
      />
    </div>
  )
}
