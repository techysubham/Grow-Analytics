const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Default categories
const DEFAULT_CATEGORIES = [
  "Phone Case","Console","Mud Flaps","Armrest Cover","Car Screen Protector","Watch Strap",
  "Phone Screen Protector","Carburetor","Steering Wheel Cover","Camera Lens Protector",
  "Cold Air Intake","Windshield","Latch Lock","Air Intake Hose","Tire Valve Cap",
  "Bed Rail","Watch Case","Engine Splash","Bullet Antenna","Push Button","Laser",
  "Sun Visor","Wiring Hardness","Hidden Storage","Hub Cap","Tab Case","Tab S.P",
  "Dash Tray","Laptop Sleeves","Laptop S.P","Charger","Bed Mat","Dash Kit","Bumper Retainer",
  "Car Cover","Timing Chain Kit","Roof Spoiler","Hood Lift","Front Leveling Kit","Engine Oil",
  "Hose Boot","Liquid S.P"
];

// list categories for specific account + marketplace
router.get('/', async (req, res) => {
  try {
    const { account, marketplace } = req.query;
    
    if (!account || !marketplace) {
      return res.status(400).json({ error: 'account and marketplace required' });
    }
    
    // Ensure account and marketplace are strings and not empty
    const accountStr = String(account).trim();
    const marketplaceStr = String(marketplace).trim();
    
    if (!accountStr || !marketplaceStr) {
      return res.status(400).json({ error: 'account and marketplace cannot be empty' });
    }
    
    // STRICT: Only get categories that match EXACTLY this account + marketplace
    // Use explicitquery with exact string match to avoid any comparison issues
    const userCats = await Category.find({ 
      account: { $eq: accountStr }, 
      marketplace: { $eq: marketplaceStr }
    }, 'name').sort('name');
    
    const userCatNames = userCats.map(c => c.name);
    
    // Merge defaults with user-created, removing duplicates
    const allCats = [...new Set([...DEFAULT_CATEGORIES, ...userCatNames])];
    
    console.log(`Categories for ${accountStr}/${marketplaceStr}: ${allCats.length} total (${userCatNames.length} custom)`);
    res.json(allCats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create category for specific account + marketplace
router.post('/', async (req, res) => {
  try {
    let { name, account, marketplace } = req.body;
    
    // Validate and trim inputs
    if (!name) return res.status(400).json({ error: 'name required' });
    if (!account) return res.status(400).json({ error: 'account required' });
    if (!marketplace) return res.status(400).json({ error: 'marketplace required' });
    
    name = String(name).trim();
    account = String(account).trim();
    marketplace = String(marketplace).trim();
    
    if (!name || !account || !marketplace) {
      return res.status(400).json({ error: 'name, account, and marketplace cannot be empty' });
    }
    
    console.log(`Creating category: "${name}" for ${account}/${marketplace}`);
    
    const cat = await Category.findOneAndUpdate(
      { name: name, account: account, marketplace: marketplace },
      { $set: { name: name, account: account, marketplace: marketplace } },
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log(`Category saved: ${cat._id} | account=${cat.account} | marketplace=${cat.marketplace}`);
    res.json({ name: cat.name, account: cat.account, marketplace: cat.marketplace });
  } catch (err) {
    console.error('Category creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint to see all categories in database
router.get('/debug/all', async (req, res) => {
  try {
    const allCats = await Category.find({}).sort({ account: 1, marketplace: 1, name: 1 });
    console.log(`Debug: Found ${allCats.length} categories in database`);
    res.json(allCats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check for problematic/invalid categories
router.get('/debug/check-invalid', async (req, res) => {
  try {
    const invalid = await Category.find({
      $or: [
        { account: { $exists: false } },
        { account: null },
        { account: '' },
        { account: /^\s+$/ },  // whitespace only
        { marketplace: { $exists: false } },
        { marketplace: null },
        { marketplace: '' },
        { name: { $exists: false } },
        { name: null },
        { name: '' },
        { name: /^\s+$/ }  // whitespace only
      ]
    });
    
    const summary = {
      totalInvalidCount: invalid.length,
      invalidCategories: invalid,
      message: invalid.length > 0 ? 'Found invalid categories' : 'No invalid categories found'
    };
    
    console.log(`Debug: Found ${invalid.length} invalid categories`);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove invalid categories (cleanup)
router.delete('/debug/cleanup-invalid', async (req, res) => {
  try {
    const result = await Category.deleteMany({
      $or: [
        { account: { $exists: false } },
        { account: null },
        { account: '' },
        { account: /^\s+$/ },
        { marketplace: { $exists: false } },
        { marketplace: null },
        { marketplace: '' },
        { name: { $exists: false } },
        { name: null },
        { name: '' },
        { name: /^\s+$/ }
      ]
    });
    console.log(`Debug: Cleaned up ${result.deletedCount} invalid categories`);
    res.json({ deletedCount: result.deletedCount, message: 'Cleanup completed - invalid categories removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
