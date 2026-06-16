let products = [];

async function loadProducts() {
    const res = await fetch('/api/products');
    products = await res.json();
    renderOrderSummary();
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function renderOrderSummary() {
    const cart = getCart();
    const summary = document.getElementById('orderSummary');

    if (cart.length === 0) {
        summary.innerHTML = `
            <p style="color: var(--text-secondary); margin: 0;">
                <i class="bi bi-info-circle"></i> Koszyk jest pusty
            </p>
        `;
        return;
    }

    let total = 0;
    let totalQty = 0;

    const items = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        const sum = product.price * item.qty;
        total += sum;
        totalQty += item.qty;
        return `<div class="summary-item"><span>${product.name} x ${item.qty}</span> <strong>${sum.toFixed(2)} zł</strong></div>`;
    }).join('');

    summary.innerHTML = `
        <div class="summary-title">
            <i class="bi bi-bag-check"></i> Podsumowanie zamówienia
        </div>
        ${items}
        <div class="summary-total">
            <span>Razem (${totalQty} przedmiotów):</span>
            <span>${total.toFixed(2)} zł</span>
        </div>
    `;
}

document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    if (cart.length === 0) {
        alert('Koszyk jest pusty!');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span class="spinner"></span> Przetwarzanie...';

    try {
        const data = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            cart
        };

        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.orderId) {
            alert(`✅ Zamówienie zostało złożone!\n\nNumer zamówienia: ${result.orderId}\n\nDzięki za zakupy!`);
            localStorage.removeItem('cart');
            window.location.href = '/index.html';
        } else {
            alert('Błąd: ' + (result.error || 'Nie udało się złożyć zamówienia'));
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Złóż zamówienie';
        }
    } catch (error) {
        alert('Błąd sieci: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Złóż zamówienie';
    }
});

function goBack() {
    window.location.href = '/cart.html';
}

loadProducts();
