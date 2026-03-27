import React, { useEffect, useState } from 'react'
import { Bar, Line, Pie } from 'react-chartjs-2'
import { Chart, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip, PointElement, LineElement, ArcElement, Filler } from 'chart.js'
import { fetchAggregateWithParams } from './api'
import CATEGORIES from './data/categories'
import { Box, Select, MenuItem, FormControl, InputLabel, TextField, Autocomplete, Chip, Button } from '@mui/material'

Chart.register(BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip, PointElement, LineElement, ArcElement, Filler)

export default function Dashboard({ account, marketplace, startDate, endDate }){
  const [dataObj, setDataObj] = useState(null)
  const [chartType, setChartType] = useState('stacked') // 'stacked' | 'grouped' | 'line' | 'pie'
  const [topN, setTopN] = useState(6)
  const [selectedCats, setSelectedCats] = useState([])
  const [mode, setMode] = useState('range') // 'range' | 'single'
  const [singleDate, setSingleDate] = useState(endDate || startDate || new Date().toISOString().slice(0,10))
  const [localStartDate, setLocalStartDate] = useState(startDate)
  const [localEndDate, setLocalEndDate] = useState(endDate)
  // no default pieScope; we display one pie per date when range selected

  // Load when account or marketplace changes or when user explicitly applies filters
  useEffect(()=>{ load() }, [account, marketplace])

  // Sync incoming prop dates into local inputs so the dashboard has its own controls
  useEffect(() => {
    setLocalStartDate(startDate)
    setLocalEndDate(endDate)
    setSingleDate(endDate || startDate || singleDate)
  }, [startDate, endDate])

  // (no dateOptions fetch needed anymore)

  // Note: do not auto-select categories by default; user will choose.

  const load = async () => {
    try {
      const params = {}
      if (account) params.account = account
      if (marketplace) params.marketplace = marketplace
      // Use local mode-controlled dates: single day becomes startDate=endDate
      if (mode === 'single') {
        if (singleDate) { params.startDate = singleDate; params.endDate = singleDate }
      } else {
        if (localStartDate) params.startDate = localStartDate
        if (localEndDate) params.endDate = localEndDate
      }
      console.debug('Dashboard load params:', params)
      const res = await fetchAggregateWithParams(params)
      console.debug('Dashboard load result dates (raw):', Object.keys(res || {}).length)
      // Client-side safeguard: filter response to the UI-selected date(s)
      let filtered = res || {}
      if (mode === 'single' && singleDate) {
        filtered = {}
        if (res && res[singleDate]) filtered[singleDate] = res[singleDate]
      } else if (mode === 'range' && (localStartDate || localEndDate)) {
        const start = localStartDate || Object.keys(res || {}).sort()[0]
        const end = localEndDate || Object.keys(res || {}).sort().slice(-1)[0]
        filtered = Object.fromEntries(Object.entries(res || {}).filter(([d]) => d >= start && d <= end))
      }
      console.debug('Dashboard load result dates (filtered):', Object.keys(filtered || {}).length)
      setDataObj(filtered)
    } catch (err) {
      console.error(err)
      setDataObj({})
    }
  }

  if (!dataObj) return <div>Loading chart...</div>

  const dates = Object.keys(dataObj).sort()
  
  // Sum totals per category across dates (safe for empty dates)
  const totals = {}
  dates.forEach(d => {
    Object.entries(dataObj[d] || {}).forEach(([cat, val]) => {
      totals[cat] = (totals[cat] || 0) + Number(val || 0)
    })
  })

  // Choose topN categories
  const sortedCats = Object.entries(totals).sort((a,b)=>b[1]-a[1]).map(x=>x[0])
  const topCats = sortedCats.slice(0, topN)
  const otherCats = Object.keys(totals).filter(c=>!topCats.includes(c))

  // Prepare pie data (Top N)
  const pieData = topCats.map(c => totals[c] || 0)
  const othersTotal = otherCats.reduce((s,c)=>s+(totals[c]||0),0)
  const pieLabels = [...topCats]
  const pieValues = [...pieData]
  if (othersTotal>0) { pieLabels.push('Others'); pieValues.push(othersTotal); }
  const pieChartData = { labels: pieLabels, datasets: [{ data: pieValues, backgroundColor: pieLabels.map((_,i)=>`rgba(${(i*73)%255}, ${(i*137)%255}, ${(i*199)%255}, 0.75)`)}] }

  // For line or bar charts we build datasets per selected category (defaults to topCats)
  const catsToShow = (selectedCats && selectedCats.length) ? selectedCats : topCats
  const datasets = catsToShow.map((cat, idx) => {
    const data = dates.map(d => dataObj[d] && dataObj[d][cat] ? dataObj[d][cat] : 0)
    const color = `rgba(${(idx*73)%255}, ${(idx*137)%255}, ${(idx*199)%255}, 0.75)`
    return {
      label: cat,
      data,
      backgroundColor: color,
      borderColor: color,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: dates.length === 1 ? 6 : 4,
      pointBackgroundColor: color,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1,
      pointStyle: 'circle',
      hoverRadius: 6,
      fill: dates.length === 1 ? true : false
    }
  })

  const chartData = { labels: dates, datasets }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { title: { display: true, text: 'Category quantities by Date' }, legend: { position: 'bottom' } },
    scales: {
      x: { stacked: chartType === 'stacked' },
      y: { stacked: chartType === 'stacked' }
    },
    elements: { line: { tension: 0.3 }, point: { radius: 0 } }
  }

  try {
    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Chart</InputLabel>
            <Select value={chartType} label="Chart" onChange={e=>setChartType(e.target.value)}>
              <MenuItem value="stacked">Stacked Bar</MenuItem>
              <MenuItem value="grouped">Grouped Bar</MenuItem>
              <MenuItem value="line">Line</MenuItem>
              <MenuItem value="pie">Pie (total)</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Mode</InputLabel>
            <Select value={mode} label="Mode" onChange={e=>setMode(e.target.value)}>
              <MenuItem value="range">Range</MenuItem>
              <MenuItem value="single">Single Day</MenuItem>
            </Select>
          </FormControl>

          {mode === 'single' ? (
            <TextField size="small" type="date" label="Date" value={singleDate} onChange={e=>setSingleDate(e.target.value)} />
          ) : (
            <>
              <TextField size="small" type="date" label="From" value={localStartDate || ''} onChange={e=>setLocalStartDate(e.target.value)} />
              <TextField size="small" type="date" label="To" value={localEndDate || ''} onChange={e=>setLocalEndDate(e.target.value)} />
            </>
          )}

          <Button variant="outlined" size="small" onClick={() => load()}>Apply</Button>

          <TextField size="small" label="Top N" type="number" value={topN} onChange={e=>setTopN(Number(e.target.value)||1)} />

          <Autocomplete
            multiple
            options={sortedCats}
            value={selectedCats || []}
            onChange={(_, v) => setSelectedCats(v)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const tagProps = getTagProps({ index }) || {}
                const { key, ...other } = tagProps
                return (
                  <Chip
                    key={key}
                    variant="outlined"
                    label={option}
                    size="small"
                    {...other}
                  />
                )
              })
            }
            renderInput={(params) => (
              <TextField {...params} size="small" label="Categories" placeholder="Select categories" sx={{ minWidth: 240 }} />
            )}
          />
        </Box>

        {dates.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            No data available for chart.
          </Box>
        ) : (
          <Box>
            {chartType === 'pie' ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {dates.map(d => {
                  const dObj = dataObj[d] || {}
                  const keys = Object.entries(dObj).sort((a,b)=>b[1]-a[1]).map(x=>x[0])
                  const top = keys.slice(0, topN)
                  const other = keys.slice(topN)
                  const vals = top.map(k => dObj[k] || 0)
                  const otherTotal = other.reduce((s,k)=>s+(dObj[k]||0), 0)
                  const labels = [...top]
                  const values = [...vals]
                  if (otherTotal>0) { labels.push('Others'); values.push(otherTotal) }
                  const pd = { labels, datasets: [{ data: values, backgroundColor: labels.map((_,i)=>`rgba(${(i*73)%255}, ${(i*137)%255}, ${(i*199)%255}, 0.75)`)}] }
                  return (
                    <Box key={d} sx={{ width: 320 }}>
                      <Box sx={{ textAlign: 'center', mb: 1 }}>{d}</Box>
                      <Box sx={{ height: 300 }}>
                        <Pie data={pd} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '60%' }} />
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            ) : chartType === 'line' ? (
              <Box sx={{ height: 420 }}><Line data={chartData} options={options} /></Box>
            ) : (
              <Box sx={{ height: 420 }}><Bar data={chartData} options={{ ...options, scales: { x: { stacked: chartType === 'stacked' }, y: { stacked: chartType === 'stacked' } } }} /></Box>
            )}
          </Box>
        )}
      </Box>
    )
  } catch (err) {
    console.error('Dashboard render error', err)
    return <Box sx={{ p:2, color: 'red' }}>Chart error: {err.message}</Box>
  }
}
