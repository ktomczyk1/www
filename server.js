const express = require("express");
const sequelize = require("./database");
const { adminJs, router } = require("./admin");

require("./models/Category");
require("./models/Product");
require("./models/Order");          // całe zamówienie
require("./models/OrderItem");      // pojedyncza pozycja w zamówieniu (produkt + ilość)

const Category = require("./models/Category");
const Product = require("./models/Product");
const Order = require("./models/Order");
const OrderItem = require("./models/OrderItem");

const app = express();
app.use(adminJs.options.rootPath, router);
app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Sklep działa");
});

app.get("/api/categories", async (req, res) => {
    const categories = await Category.findAll();
    res.json(categories);
});

app.get("/api/products", async (req, res) => {
    const products = await Product.findAll();
    res.json(products);
});

app.post("/api/checkout", async (req, res) => {
    const { firstName, lastName, email, phone, address, cart } = req.body;

    let total = 0;

    // tworzenie zamowienia
    const order = await Order.create({
        firstName,
        lastName,
        email,
        phone,
        address,
        status: "pending",
        totalPrice: 0
    });

    // dodanie produktów do zamówienia
    for (const item of cart) {
        const product = await Product.findByPk(item.id);

        const price = product.price * item.qty;
        total += price;

        await OrderItem.create({
            OrderId: order.id,
            ProductId: product.id,
            quantity: item.qty,
            price: product.price
        });
    }

    // aktualizacja ceny całkowitej zamówienia
    order.totalPrice = total;
    await order.save();

    res.json({ orderId: order.id });
});

sequelize.sync().then(() => {
    console.log("Baza gotowa");

    app.listen(3000, () => {
        console.log("Serwer działa");
    });
});


