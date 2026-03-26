import React, { useState, useEffect } from 'react'
import CATEGORIES from './data/categories'
import { loadEntry, saveEntry, fetchAccounts, createAccount, fetchCategories, createCategory } from './api'
import Dashboard from './Dashboard'
import { Container, AppBar, Toolbar, Typography, Select, MenuItem, Button, Box, TextField, Table, TableHead, TableBody, TableRow, TableCell, Tabs, Tab, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

export default function App() {
  const [account, setAccount] = useState('')
  const [accounts, setAccounts] = useState([])
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0,10);
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0,10))
  const [items, setItems] = useState(CATEGORIES.map(name => ({ name, qty: 0 })))
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState(0)
  const [categories, setCategories] = useState(CATEGORIES)

  useEffect(() => {
    setItems(CATEGORIES.map(name => ({ name, qty: 0 })));
    (async () => {
      try {
        const acRaw = await fetchAccounts()
        const ac = (acRaw || []).filter(Boolean)
        setAccounts(ac)
        if (ac.length && !account) setAccount(ac[0] || '')
        const cats = await fetchCategories()
        if (cats && cats.length) { setCategories(cats); setItems(cats.map(name=>({name, qty:0}))) }
      } catch (err) {
        console.error('fetch accounts/categories error', err)
      }
    })()
  }, [])

  // Auto-load data when account changes
  useEffect(() => {
    if (account) {
      handleLoad()
    }
  }, [account])

  const handleLoad = async () => {
    try {
      const data = await loadEntry(account, date)
      const baseCats = categories && categories.length ? categories : CATEGORIES
      if (data && data.items) setItems(baseCats.map(name => ({ name, qty: (data.items.find(i=>i.name===name)?.qty) || 0 })))
      else setItems(baseCats.map(name => ({ name, qty: 0 })))
      setMessage('Loaded')
    } catch (err) {
      setMessage('Load error')
    }
  }

  const handleSave = async () => {
    try {
      await saveEntry({ account, date, items })
      setMessage('Saved')
    } catch (err) {
      setMessage('Save error')
    }
  }

  const updateQty = (idx, val) => {
    const copy = [...items]
    copy[idx].qty = Number(val) || 0
    setItems(copy)
  }

  const handleAddAccount = async () => {
    let name = prompt('New account name')
    if (!name) return
    name = name.trim()
    if (!name) return
    try {
      await createAccount(name)
      setAccounts(prev => prev.includes(name) ? prev : [...prev, name])
      setAccount(name)
    } catch (err) {
      console.error(err)
      try {
        const acRaw = await fetchAccounts()
        const ac = (acRaw || []).filter(Boolean)
        setAccounts(ac)
        if (ac.includes(name)) setAccount(name)
        else alert('Failed to create account: ' + (err.response?.data?.error || err.message))
      } catch (e) {
        alert('Failed to create account: ' + (err.response?.data?.error || err.message))
      }
    }
  }

  const handleAddCategory = async () => {
    let name = prompt('New category name')
    if (!name) return
    name = name.trim()
    if (!name) return
    try {
      await createCategory(name)
      const cats = await fetchCategories()
      setCategories(cats)
      setItems(cats.map(n=>({name:n, qty:0})))
    } catch (err) {
      console.error(err)
      alert('Failed to create category: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleTabChange = (_, newV) => setTab(newV)

  return (
    <div>
      <AppBar position="static" sx={{ bgcolor: '#1565c0' }}>
        <Toolbar>
          <Typography variant="h6">Grow Analytics</Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Typography>Account:</Typography>
          <Select value={account || ''} onChange={e=>setAccount(e.target.value)} sx={{ minWidth: 200 }}>
            {accounts.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
          <IconButton size="small" onClick={handleAddAccount} title="Add account"><AddIcon /></IconButton>
          <TextField type="date" label="" value={date} onChange={e=>setDate(e.target.value)} InputLabelProps={{ shrink: false }} />
          
          <Button variant="outlined" onClick={handleSave}>Save</Button>
          <Typography sx={{ ml: 2 }}>{message}</Typography>
        </Box>

        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Sheet" />
          <Tab label="Dashboard" />
        </Tabs>

        {tab === 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb:1 }}>
              <Button startIcon={<AddIcon/>} onClick={handleAddCategory}>Add Category</Button>
            </Box>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it, i) => (
                  <TableRow key={it.name}>
                    <TableCell>{it.name}</TableCell>
                    <TableCell>
                      <TextField type="number" value={it.qty} onChange={e => updateQty(i, e.target.value)} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        {tab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Dashboard account={account} startDate={startDate} endDate={endDate} />
          </Box>
        )}
      </Container>
    </div>
  )
}
