const AdminJS = require("adminjs").default;
const AdminJSExpress = require("@adminjs/express");
const AdminJSSequelize = require("@adminjs/sequelize");

const Category = require("./models/Category");
const Product = require("./models/Product");
const Order = require("./models/Order");
const OrderItem = require("./models/OrderItem");

AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});

const adminJs = new AdminJS({
  rootPath: "/admin",
  resources: [Category, Product, Order, OrderItem]
});

const router = AdminJSExpress.buildRouter(adminJs);

module.exports = { adminJs, router };