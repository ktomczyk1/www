function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function getCartQty(cart, productId) {
    const item = cart.find(i => i.id === productId);
    return item ? item.qty : 0;
}

function getAvailableStock(product, cart) {
    if (!product) return 0;
    const stock = product.stock ?? 0;
    return Math.max(0, stock - getCartQty(cart, product.id));
}

function canAddToCart(product, cart) {
    if (!product) return false;
    return getCartQty(cart, product.id) < (product.stock ?? 0);
}

function isProductUnavailable(product, cart) {
    if (!product) return true;
    return (product.stock ?? 0) <= 0 && getCartQty(cart, product.id) === 0;
}

function validateCartAgainstStock(products) {
    let cart = getCart();
    let changed = false;

    const validated = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) {
            changed = true;
            return null;
        }
        if (item.qty > product.stock) {
            changed = true;
            const qty = Math.max(0, product.stock);
            return qty > 0 ? { id: item.id, qty } : null;
        }
        return item;
    }).filter(Boolean);

    if (changed || validated.length !== cart.length) {
        saveCart(validated);
    }

    return validated;
}
