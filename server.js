require("dotenv").config();

const express = require("express");
const sequelize = require("./database");
const { adminJs, router } = require("./admin");
const Stripe = require("stripe");

require("./models/Category");
require("./models/Product");
require("./models/Order");
require("./models/OrderItem");

const Category = require("./models/Category");
const Product = require("./models/Product");
const Order = require("./models/Order");
const OrderItem = require("./models/OrderItem");

const app = express();
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-05-27.dahlia" })
    : null;

function getAppUrl(req) {
    return process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
}

async function markOrderPaid(orderId) {
    const order = await Order.findByPk(orderId);

    if (!order) {
        return null;
    }

    if (order.status !== "opłacone") {
        order.status = "opłacone";
        await order.save();
    }

    return order;
}

async function cancelPendingOrder(orderId) {
    const order = await Order.findByPk(orderId);

    if (!order || order.status !== "oczekujące") {
        return order;
    }

    const transaction = await sequelize.transaction();

    try {
        const orderItems = await OrderItem.findAll({
            where: { orderId },
            transaction
        });

        for (const item of orderItems) {
            const product = await Product.findByPk(item.productId, { transaction });

            if (product) {
                product.stock += item.quantity;
                await product.save({ transaction });
            }
        }

        order.status = "anulowane";
        await order.save({ transaction });
        await transaction.commit();

        return order;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send("Stripe webhook nie jest skonfigurowany.");
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers["stripe-signature"],
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Niepoprawny podpis webhooka Stripe:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
    ) {
        const session = event.data.object;

        if (session.payment_status === "paid" && session.metadata?.orderId) {
            await markOrderPaid(session.metadata.orderId);
        }
    }

    if (event.type === "checkout.session.expired") {
        const session = event.data.object;

        if (session.metadata?.orderId) {
            await cancelPendingOrder(session.metadata.orderId);
        }
    }

    res.json({ received: true });
});

app.use(adminJs.options.rootPath, router);
app.use(express.static("public"));
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

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

    if (!stripe) {
        return res.status(500).json({
            error: "Stripe nie jest skonfigurowany. Ustaw STRIPE_SECRET_KEY w pliku .env."
        });
    }

    if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: "Koszyk jest pusty." });
    }

    const transaction = await sequelize.transaction();

    try {
        const lineItems = [];

        for (const item of cart) {
            const product = await Product.findByPk(item.id, { transaction });

            if (!product) {
                await transaction.rollback();
                return res.status(400).json({ error: "Jeden z produktów nie istnieje." });
            }

            if (item.qty <= 0) {
                await transaction.rollback();
                return res.status(400).json({ error: "Nieprawidłowa ilość produktu w koszyku." });
            }

            if (product.stock < item.qty) {
                await transaction.rollback();
                return res.status(400).json({
                    error: `Brak wystarczającej ilości produktu "${product.name}" (dostępne: ${product.stock} szt.).`
                });
            }

            lineItems.push({
                quantity: item.qty,
                price_data: {
                    currency: "pln",
                    unit_amount: Math.round(product.price * 100),
                    product_data: {
                        name: product.name
                    }
                }
            });
        }

        const order = await Order.create({
            firstName,
            lastName,
            email,
            phone,
            address,
            status: "oczekujące",
            totalPrice: 0
        }, { transaction });

        let total = 0;

        for (const item of cart) {
            const product = await Product.findByPk(item.id, { transaction });
            const price = product.price * item.qty;
            total += price;

            product.stock -= item.qty;
            await product.save({ transaction });

            await OrderItem.create({
                orderId: order.id,
                productId: product.id,
                quantity: item.qty,
                price: product.price
            }, { transaction });
        }

        order.totalPrice = total;
        await order.save({ transaction });

        const appUrl = getAppUrl(req);
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            customer_email: email,
            line_items: lineItems,
            client_reference_id: String(order.id),
            metadata: {
                orderId: String(order.id)
            },
            success_url: `${appUrl}/checkout.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/checkout.html?payment=cancelled&order_id=${order.id}`
        });

        await transaction.commit();
        res.json({ orderId: order.id, url: session.url });
    } catch (error) {
        await transaction.rollback();
        console.error("Błąd checkout:", error);
        res.status(500).json({ error: "Nie udało się złożyć zamówienia." });
    }
});

app.post("/api/cancel-order", async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ error: "Brak numeru zamówienia." });
    }

    try {
        const order = await cancelPendingOrder(orderId);

        if (!order) {
            return res.status(404).json({ error: "Zamówienie nie istnieje." });
        }

        res.json({ status: order.status });
    } catch (error) {
        console.error("Błąd anulowania zamówienia:", error);
        res.status(500).json({ error: "Nie udało się anulować zamówienia." });
    }
});

app.get("/api/payment-status", async (req, res) => {
    if (!stripe) {
        return res.status(500).json({
            error: "Stripe nie jest skonfigurowany. Ustaw STRIPE_SECRET_KEY w pliku .env."
        });
    }

    const { session_id: sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: "Brak identyfikatora sesji Stripe." });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const orderId = session.metadata?.orderId;

        if (session.payment_status === "paid" && orderId) {
            await markOrderPaid(orderId);
        }

        res.json({
            orderId,
            status: session.payment_status,
            paid: session.payment_status === "paid"
        });
    } catch (error) {
        console.error("Błąd sprawdzania płatności Stripe:", error);
        res.status(500).json({ error: "Nie udało się sprawdzić statusu płatności." });
    }
});

sequelize.sync().then(() => {
    console.log("Baza gotowa");

    app.listen(3000, () => {
        console.log("Serwer działa");
    });
});
