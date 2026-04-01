import React, { useState, useEffect } from 'react'
import CATEGORIES from './data/categories'
import { loadEntry, saveEntry, fetchAccounts, createAccount, fetchMarketplaces, fetchCategories, createCategory, editCategory, deleteCategory } from './api'
import Dashboard from './Dashboard'
import { Container, AppBar, Toolbar, Typography, Select, MenuItem, Button, Box, TextField, Table, TableHead, TableBody, TableRow, TableCell, Tabs, Tab, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

export default function App() {
  const [marketplace, setMarketplace] = useState('')
  const [marketplaces, setMarketplaces] = useState([])
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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editNewName, setEditNewName] = useState('')

  useEffect(() => {
    setItems(CATEGORIES.map(name => ({ name, qty: 0 })));
    (async () => {
      try {
        const mkts = await fetchMarketplaces()
        setMarketplaces(mkts || [])
        if (mkts && mkts.length) setMarketplace(mkts[0])
      } catch (err) {
        console.error('fetch marketplaces error', err)
      }
    })()
  }, [])

  // Load accounts when marketplace changes
  useEffect(() => {
    setAccount('')
    if (marketplace) {
      (async () => {
        try {
          const acRaw = await fetchAccounts(marketplace)
          const ac = (acRaw || []).map(a => typeof a === 'string' ? a : a.name)
          setAccounts(ac)
          if (ac.length) setAccount(ac[0])
        } catch (err) {
          console.error('fetch accounts error', err)
        }
      })()
    }
  }, [marketplace])

  // Fetch categories when account or marketplace changes
  useEffect(() => {
    if (account && marketplace) {
      (async () => {
        try {
          console.log(`Fetching categories for ${account}/${marketplace}...`);
          const cats = await fetchCategories(account, marketplace)
          console.log(`Fetched ${cats?.length || 0} categories:`, cats?.slice(0, 3));
          if (cats && cats.length) {
            setCategories(cats)
            // Preserve quantities from current items where category name matches
            const newItems = cats.map(catName => ({
              name: catName,
              qty: items.find(i => i.name === catName)?.qty || 0
            }))
            setItems(newItems)
          } else {
            console.warn('No categories fetched, falling back to defaults');
            setCategories(CATEGORIES)
            setItems(CATEGORIES.map(name => ({ name, qty: 0 })))
          }
        } catch (err) {
          console.error(`Failed to fetch categories for ${account}/${marketplace}:`, err)
          setCategories(CATEGORIES)
          setItems(CATEGORIES.map(name => ({ name, qty: 0 })))
        }
      })()
    }
  }, [account, marketplace])

  // Auto-load data when account or date changes
  useEffect(() => {
    if (account && marketplace && date) {
      handleLoad()
    }
  }, [account, marketplace, date])

  const handleLoad = async () => {
    try {
      const data = await loadEntry(account, marketplace, date)
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
      await saveEntry({ account, marketplace, date, items })
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
    if (!marketplace) {
      alert('Please select a marketplace first');
      return;
    }
    
    let name = prompt('New account name')
    if (!name) return
    name = name.trim()
    if (!name) return
    
    try {
      const result = await createAccount(name, marketplace)
      setAccounts(prev => prev.includes(name) ? prev : [...prev, name])
      setAccount(name)
      setMessage(`Account "${name}" created for ${marketplace}`)
    } catch (err) {
      console.error('Create account error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      
      // If it's an index migration issue, provide helpful message
      if (errorMsg.includes('index')) {
        alert(`Error creating account: ${errorMsg}\n\nPlease contact support to run index migration.`)
      } else {
        alert(`Failed to create account: ${errorMsg}`)
      }
      
      // Try to reload accounts from server
      try {
        const acRaw = await fetchAccounts(marketplace)
        const ac = (acRaw || []).map(a => typeof a === 'string' ? a : a.name)
        setAccounts(ac)
        if (ac.includes(name)) setAccount(name)
      } catch (e) {
        console.error('Failed to reload accounts:', e)
      }
    }
  }

  const handleAddCategory = async () => {
    if (!account || !marketplace) {
      alert('Please select account and marketplace first');
      return;
    }
    
    let name = prompt('New category name')
    if (!name) return
    name = name.trim()
    if (!name) return
    try {
      console.log(`[${account}/${marketplace}] Creating category "${name}"...`)
      const result = await createCategory(name, account, marketplace)
      console.log(`[${account}/${marketplace}] Category created:`, result)
      
      // IMPORTANT: Fetch fresh categories ONLY for this account+marketplace combination
      console.log(`[${account}/${marketplace}] Fetching updated category list...`)
      const cats = await fetchCategories(account, marketplace)
      console.log(`[${account}/${marketplace}] Updated categories (${cats?.length || 0}):`, cats?.slice(0, 5))
      
      if (cats && cats.length) {
        setCategories(cats)
        // Preserve quantities from current items
        const newItems = cats.map(catName => ({
          name: catName,
          qty: items.find(i => i.name === catName)?.qty || 0
        }))
        setItems(newItems)
        setMessage(`Category "${name}" added to ${account}`)
        console.log(`[${account}/${marketplace}] Successfully added category "${name}"`)
      } else {
        console.warn(`[${account}/${marketplace}] No categories returned from server`)
        setMessage('Category saved but failed to fetch updated list')
      }
    } catch (err) {
      console.error(`[${account}/${marketplace}] Add category error:`, err)
      alert('Failed to create category: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleEditCategory = (categoryName) => {
    if (!account || !marketplace) {
      alert('Please select account and marketplace first');
      return;
    }
    setEditCategoryName(categoryName)
    setEditNewName(categoryName)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editNewName.trim()) {
      alert('Category name cannot be empty')
      return;
    }
    
    try {
      console.log(`[${account}/${marketplace}] Editing category: "${editCategoryName}" -> "${editNewName}"...`)
      await editCategory(editCategoryName, editNewName.trim(), account, marketplace)
      console.log(`[${account}/${marketplace}] Category edited successfully`)
      
      // Fetch fresh categories
      const cats = await fetchCategories(account, marketplace)
      if (cats && cats.length) {
        setCategories(cats)
        const newItems = cats.map(catName => ({
          name: catName,
          qty: items.find(i => i.name === catName)?.qty || items.find(i => i.name === editCategoryName)?.qty || 0
        }))
        setItems(newItems)
        setMessage(`Category "${editCategoryName}" renamed to "${editNewName}"`)
      }
      setEditDialogOpen(false)
      setEditCategoryName('')
      setEditNewName('')
    } catch (err) {
      console.error(`[${account}/${marketplace}] Edit category error:`, err)
      alert('Failed to edit category: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleDeleteCategory = async (categoryName) => {
    if (!account || !marketplace) {
      alert('Please select account and marketplace first');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
      return;
    }
    
    try {
      console.log(`[${account}/${marketplace}] Deleting category: "${categoryName}"...`)
      await deleteCategory(categoryName, account, marketplace)
      console.log(`[${account}/${marketplace}] Category deleted successfully`)
      
      // Fetch fresh categories
      const cats = await fetchCategories(account, marketplace)
      if (cats && cats.length) {
        setCategories(cats)
        const newItems = cats.map(catName => ({
          name: catName,
          qty: items.find(i => i.name === catName)?.qty || 0
        }))
        setItems(newItems)
        setMessage(`Category "${categoryName}" deleted`)
      }
    } catch (err) {
      console.error(`[${account}/${marketplace}] Delete category error:`, err)
      alert('Failed to delete category: ' + (err.response?.data?.error || err.message))
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Typography>Marketplace:</Typography>
          <Select value={marketplace || ''} onChange={e=>setMarketplace(e.target.value)} sx={{ minWidth: 120 }}>
            {marketplaces.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>

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
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it, i) => (
                  <TableRow key={it.name}>
                    <TableCell>{it.name}</TableCell>
                    <TableCell>
                      <TextField type="number" value={it.qty} onChange={e => updateQty(i, e.target.value)} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditCategory(it.name)} title="Edit category" color="primary">
                        <EditIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteCategory(it.name)} title="Delete category" color="error">
                        <DeleteIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        {tab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Dashboard account={account} marketplace={marketplace} startDate={startDate} endDate={endDate} />
          </Box>
        )}
      </Container>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>Current name: {editCategoryName}</Typography>
          <TextField
            autoFocus
            fullWidth
            label="New category name"
            value={editNewName}
            onChange={e => setEditNewName(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleSaveEdit()
              }
            }}
            placeholder="Enter new category name"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
