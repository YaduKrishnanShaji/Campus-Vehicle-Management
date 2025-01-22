const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const Carpool = require('../models/Carpool');
const Vehicle = require('../models/Vehicle');

// Create new carpool
router.post('/', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      where: {
        id: req.body.vehicleId,
        ownerId: req.user.id,
        status: 'approved'
      }
    });

    if (!vehicle) {
      return res.status(400).json({ message: 'Invalid or unapproved vehicle' });
    }

    const carpool = await Carpool.create({
      ...req.body,
      creatorId: req.user.id
    });
    res.status(201).json(carpool);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all active carpools
router.get('/active', auth, async (req, res) => {
  try {
    const carpools = await Carpool.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Vehicle,
          attributes: ['make', 'model', 'year']
        }
      ]
    });
    res.json(carpools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's carpools
router.get('/my-carpools', auth, async (req, res) => {
  try {
    const carpools = await Carpool.findAll({
      where: { creatorId: req.user.id },
      include: [
        {
          model: Vehicle,
          attributes: ['make', 'model', 'year']
        }
      ]
    });
    res.json(carpools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get carpool by id
router.get('/:id', auth, async (req, res) => {
  try {
    const carpool = await Carpool.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          attributes: ['make', 'model', 'year']
        }
      ]
    });
    if (!carpool) {
      return res.status(404).json({ message: 'Carpool not found' });
    }
    res.json(carpool);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update carpool status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const carpool = await Carpool.findOne({
      where: {
        id: req.params.id,
        creatorId: req.user.id
      }
    });

    if (!carpool) {
      return res.status(404).json({ message: 'Carpool not found' });
    }

    carpool.status = req.body.status;
    await carpool.save();
    res.json(carpool);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Search carpools by route
router.post('/search', auth, async (req, res) => {
  try {
    const { startLocation, endLocation, departureTime } = req.body;
    
    const carpools = await Carpool.findAll({
      where: {
        startLocation,
        endLocation,
        departureTime: {
          [Op.gte]: new Date(departureTime)
        },
        status: 'active',
        availableSeats: {
          [Op.gt]: 0
        }
      },
      include: [
        {
          model: Vehicle,
          attributes: ['make', 'model', 'year']
        }
      ]
    });
    
    res.json(carpools);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Admin: Get all carpools
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const carpools = await Carpool.findAll({
      include: [
        {
          model: Vehicle,
          attributes: ['make', 'model', 'year']
        }
      ]
    });
    res.json(carpools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 