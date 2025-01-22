const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');

// Register new vehicle
router.post('/', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.create({
      ...req.body,
      ownerId: req.user.id
    });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's vehicles
router.get('/my-vehicles', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { ownerId: req.user.id }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get vehicle by id
router.get('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all vehicles
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update vehicle status
router.patch('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    vehicle.status = status;
    await vehicle.save();
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update vehicle
router.patch('/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['make', 'model', 'year'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    const vehicle = await Vehicle.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    updates.forEach(update => vehicle[update] = req.body[update]);
    await vehicle.save();
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 