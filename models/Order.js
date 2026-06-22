const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Order = sequelize.define("Order", {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false
  },

  phone: {
    type: DataTypes.STRING
  },

  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  status: {
    type: DataTypes.STRING,
    defaultValue: "oczekujące"
  },

  totalPrice: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
});

module.exports = Order;
