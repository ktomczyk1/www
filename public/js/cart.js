let products = [];

async function loadProducts() {
    const res = await fetch('/api/products');
    products = await res.json();
    validateCartAgainstStock(products);
    renderCart();
}

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cartContent');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="bi bi-bag-x"></i>
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
        if (!product) return '';

        const sum = product.price * item.qty;
        total += sum;
        totalQty += item.qty;
        const imageUrl = product.image && product.image.trim() !== ''
            ? `/uploads/${product.image}`
            : '/uploads/No_Image_Available.jpg';
        const plusDisabled = canAddToCart(product, cart) ? '' : 'disabled';

        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-image">
                        <img src="${imageUrl}" alt="${product.name}">
                    </div>
                    <div class="cart-item-details">
                        <h5 class="cart-item-name">${product.name}</h5>
                        <span class="cart-item-price">Cena jednostkowa: ${product.price} zł</span>
                    </div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn-small" onclick="decreaseQty(${item.id})">
                        <i class="bi bi-dash-lg"></i>
                    </button>
                    <span class="qty-display-small">${item.qty}</span>
                    <button class="qty-btn-small" onclick="increaseQty(${item.id})" ${plusDisabled}>
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
    const product = products.find(p => p.id === id);
    const cart = getCart();

    if (!canAddToCart(product, cart)) {
        return;
    }

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
