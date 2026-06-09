const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const Category = require("./Category");

const Product = sequelize.define("Product", {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING
    },
    stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
}
});

Category.hasMany(Product);
Product.belongsTo(Category);

module.exports = Product;