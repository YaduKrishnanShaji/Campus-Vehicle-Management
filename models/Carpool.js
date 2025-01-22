const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Carpool = sequelize.define('Carpool', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Vehicles',
      key: 'id'
    }
  },
  startLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  departureTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  availableSeats: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  costPerPerson: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = Carpool; 