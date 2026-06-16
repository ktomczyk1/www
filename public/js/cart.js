let products = [];

async function loadProducts() {
    const res = await fetch('/api/products');
    products = await res.json();
    renderCart();
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cartContent');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="bi bi-bag-x" style="font-size: 3rem; color: var(--text-secondary);"></i>
                <p>Twój koszyk jest pusty</p>
                <a href="/index.html">
                    <i class="bi bi-arrow-left"></i> Powrót do sklepu
                </a>
            </div>
        `;
        return;
    }

    let total = 0;
    let totalQty = 0;

    const itemsHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        const sum = product.price * item.qty;
        total += sum;
        totalQty += item.qty;

        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h5 class="cart-item-name">${product.name}</h5>
                    <span class="cart-item-price">Cena jednostkowa: ${product.price} zł</span>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn-small" onclick="decreaseQty(${item.id})">
                        <i class="bi bi-dash-lg"></i>
                    </button>
                    <span class="qty-display-small">${item.qty}</span>
                    <button class="qty-btn-small" onclick="increaseQty(${item.id})">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
                <div class="cart-item-sum">${sum.toFixed(2)} zł</div>
                <button class="cart-item-remove" onclick="removeItem(${item.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    const summaryHTML = `
        <div class="cart-items">
            ${itemsHTML}
        </div>

        <div class="cart-summary">
            <div class="summary-row">
                <span>Liczba przedmiotów:</span>
                <strong>${totalQty}</strong>
            </div>
            <div class="summary-total">
                <span>Razem:</span>
                <span>${total.toFixed(2)} zł</span>
            </div>
        </div>

        <div class="cart-actions">
            <button class="btn-checkout" onclick="checkout()">
                <i class="bi bi-check-circle"></i> Przejdź do zamówienia
            </button>
            <button class="btn-back" onclick="goBack()">
                <i class="bi bi-arrow-left"></i> Powrót do sklepu
            </button>
        </div>
    `;

    container.innerHTML = summaryHTML;
}

function increaseQty(id) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty++;
        saveCart(cart);
        renderCart();
    }
}

function decreaseQty(id) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty--;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart(cart);
        renderCart();
    }
}

function removeItem(id) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
    renderCart();
}

function checkout() {
    window.location.href = "/checkout.html";
}

function goBack() {
    window.location.href = "/index.html";
}

loadProducts();