const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Order = require("./Order");
const Product = require("./Product");

const OrderItem = sequelize.define("OrderItem", {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },

  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);

Product.hasMany(OrderItem);
OrderItem.belongsTo(Product);

module.exports = OrderItem;