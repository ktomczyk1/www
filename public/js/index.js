let allProducts = [];
let allCategories = [];
let selectedCategoryId = null;
let currentSearch = '';
let currentModalProductId = null;

async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        allCategories = categories;
        
            const container = document.getElementById('categories');
            container.innerHTML = categories.map(c => `
                <div class="category-item" onclick="filterByCategory(event, ${c.id})" data-id="${c.id}">
                    ${c.name}
                </div>
            `).join('');
    } catch (error) {
        console.error('Błąd ładowania kategorii:', error);
    }
}

async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        allProducts = products;

        validateCartAgainstStock(allProducts);
        renderProducts(getFilteredProducts());
        updateCartBadge();
    } catch (error) {
        console.error('Błąd ładowania produktów:', error);
    }
}

function getFilteredProducts() {
    if (currentSearch && currentSearch.length > 0) {
        return allProducts.filter(p => p.name && p.name.toLowerCase().includes(currentSearch));
    }

    if (selectedCategoryId === null) {
        return allProducts;
    }

    return allProducts.filter(p => p.CategoryId === selectedCategoryId);
}

function renderProductCartAction(product, cart) {
    const qty = getCartQty(cart, product.id);

    if (qty === 0) {
        if (isProductUnavailable(product, cart)) {
            return '<span class="product-unavailable">Produkt niedostępny</span>';
        }

        return `
            <button onclick="addToCart(event, ${product.id})" class="btn btn-primary btn-sm add-to-cart-btn">
                <i class="bi bi-plus-lg"></i> Dodaj
            </button>
        `;
    }

    const plusDisabled = canAddToCart(product, cart) ? '' : 'disabled';
    return `
        <div class="product-quantity-controls">
            <button onclick="removeFromCart(event, ${product.id})" class="qty-btn qty-minus">
                <i class="bi bi-dash-lg"></i>
            </button>
            <span class="qty-display">${qty}</span>
            <button onclick="addToCart(event, ${product.id})" class="qty-btn qty-plus" ${plusDisabled}>
                <i class="bi bi-plus-lg"></i>
            </button>
        </div>
    `;
}

function renderProducts(products) {
    const container = document.getElementById('products');
    const cart = getCart();
    
    if (products.length === 0) {
        container.innerHTML = '<p class="col-12 text-center text-muted">Brak produktów w tej kategorii</p>';
        return;
    }
    
    container.innerHTML = products.map(p => {
        const cartItem = cart.find(i => i.id === p.id);
        const qty = cartItem ? cartItem.qty : 0;
        const imageUrl = p.image && p.image.trim() !== '' ? `/uploads/${p.image}` : '/uploads/No_Image_Available.jpg';
        const qtyBadgeHtml = qty > 0 ? `<div class="qty-badge">${qty}</div>` : '';
        const cartActionHtml = renderProductCartAction(p, cart);

        return `
            <div class="product-card" onclick="openProductModal(${p.id})">
                ${qtyBadgeHtml}
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${p.name}" class="product-image">
                </div>
                <div class="product-body">
                    <h5 class="product-name">${p.name}</h5>
                    <p class="product-description">${p.description}</p>
                    <div class="product-footer">
                        <span class="product-price">${p.price} zł</span>
                        ${cartActionHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function applyFilter() {
    renderProducts(getFilteredProducts());
}

function filterByCategory(evt, categoryId) {
    const items = document.querySelectorAll('.category-item');

    const numCategoryId = categoryId !== null ? parseInt(categoryId) : null;
    const clickedItem = evt.target.closest('.category-item');

    if (clickedItem && clickedItem.classList.contains('active') && numCategoryId !== null) {
        items.forEach(item => item.classList.remove('active'));
        selectedCategoryId = null;
        applyFilter();
        return;
    }

    selectedCategoryId = numCategoryId;
    items.forEach(item => item.classList.remove('active'));

    if (clickedItem) clickedItem.classList.add('active');
    applyFilter();
}

function addToCart(evt, id) {
    if (evt) {
        evt.stopPropagation();
    }

    const product = allProducts.find(p => p.id === id);
    const cart = getCart();

    if (!canAddToCart(product, cart)) {
        return;
    }

    const item = cart.find(i => i.id === id);

    if (item) {
        item.qty++;
    } else {
        cart.push({ id, qty: 1 });
    }

    saveCart(cart);
    updateCartBadge();
    applyFilter();

    if (currentModalProductId === id) {
        openProductModal(id);
    }
}

function removeFromCart(evt, id) {
    if (evt) {
        evt.stopPropagation();
    }

    let cart = getCart();
    const item = cart.find(i => i.id === id);

    if (item) {
        item.qty--;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }

    saveCart(cart);
    updateCartBadge();
    applyFilter();

    if (currentModalProductId === id) {
        openProductModal(id);
    }
}

function updateCartBadge() {
    const cart = getCart();
    const cartInfo = document.getElementById('cartInfo');
    const clearCartBtn = document.getElementById('clearCartBtnDropdown');
    
    if (cart.length === 0) {
        cartInfo.style.display = 'none';
        cartInfo.textContent = '';
        if (clearCartBtn) clearCartBtn.style.display = 'none';
        updateCartDropdown();
        return;
    }

    const totalPrice = cart.reduce((sum, item) => {
        const product = allProducts.find(p => p.id === item.id);
        return sum + (product ? product.price * item.qty : 0);
    }, 0);

    cartInfo.textContent = `${totalPrice.toFixed(2)} zł`;
    cartInfo.style.display = 'inline';
    if (clearCartBtn) clearCartBtn.style.display = 'block';
    
    // Update dropdown
    updateCartDropdown();
}

function clearCartWithConfirm() {
    const confirmed = confirm('Czy na pewno chcesz wyczyścić koszyk?\n\nTa akcja nie może być cofnięta.');
    
    if (confirmed) {
        saveCart([]);
        updateCartBadge();
        applyFilter();
        closeProductModal();
    }
}

function scrollCategories(direction) {
    const scroll = document.getElementById('categoriesScroll');
    const itemWidth = scroll.querySelector('.category-item').offsetWidth;
    const scrollAmount = itemWidth * 5;
    
    if (direction === 'left') {
        scroll.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
        scroll.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

// Initialize
loadCategories();
loadProducts();

// Search input handling (search by title only)
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('productSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim().toLowerCase();
        applyFilter();
    });
});

function openProductModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    currentModalProductId = id;

    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDescription');
    const img = document.getElementById('modalImage');
    const price = document.getElementById('modalPrice');
    const stockEl = document.getElementById('modalStock');

    title.textContent = product.name || '';
    desc.textContent = product.description || 'Brak opisu produktu.';
    img.src = (product.image && product.image.trim() !== '') ? `/uploads/${product.image}` : '/uploads/No_Image_Available.jpg';
    price.textContent = `${product.price} zł`;

    const cart = getCart();
    const available = getAvailableStock(product, cart);

    if (available > 0) {
        stockEl.textContent = `${available} szt. dostępne`;
        stockEl.classList.remove('out-of-stock');
    } else {
        stockEl.textContent = 'Brak w magazynie';
        stockEl.classList.add('out-of-stock');
    }

    renderModalCartControls(id);

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function renderModalCartControls(productId) {
    const container = document.getElementById('modalCartControls');
    if (!container) return;

    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const cart = getCart();
    const qty = getCartQty(cart, productId);

    if (qty === 0) {
        if (isProductUnavailable(product, cart)) {
            container.innerHTML = '<span class="product-unavailable product-unavailable-modal">Produkt niedostępny</span>';
            return;
        }

        container.innerHTML = `
            <button onclick="addToCartFromModal(event)" class="btn-add-modal btn-add-modal-full">
                <i class="bi bi-plus-lg"></i> Dodaj do koszyka
            </button>
        `;
        return;
    }

    const plusDisabled = canAddToCart(product, cart) ? '' : 'disabled';
    container.innerHTML = `
        <div class="product-quantity-controls modal-cart-qty-controls">
            <button onclick="removeFromCart(event, ${productId})" class="qty-btn qty-minus">
                <i class="bi bi-dash-lg"></i>
            </button>
            <span class="qty-display">${qty}</span>
            <button onclick="addToCart(event, ${productId})" class="qty-btn qty-plus" ${plusDisabled}>
                <i class="bi bi-plus-lg"></i>
            </button>
        </div>
    `;
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
    currentModalProductId = null;
}

function addToCartFromModal(evt) {
    if (evt) evt.stopPropagation();
    if (!currentModalProductId) return;
    addToCart(null, currentModalProductId);
}

// close modal when clicking outside content or pressing Escape
document.addEventListener('click', (e) => {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    if (e.target === modal) closeProductModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
});

/* Cart dropdown functions */
let cartDropdownHideTimeout;

function openCartDropdown() {
    clearTimeout(cartDropdownHideTimeout);
    const dropdown = document.getElementById('cartDropdownMenu');
    if (dropdown) {
        dropdown.classList.add('open');
    }
}

function closeCartDropdownDelay() {
    const dropdown = document.getElementById('cartDropdownMenu');
    if (!dropdown) return;
    cartDropdownHideTimeout = setTimeout(() => {
        dropdown.classList.remove('open');
    }, 200);
}

function toggleCartDropdown() {
    const dropdown = document.getElementById('cartDropdownMenu');
    if (!dropdown) return;
    dropdown.classList.toggle('open');
}

function closeCartDropdown() {
    const dropdown = document.getElementById('cartDropdownMenu');
    if (dropdown) {
        dropdown.classList.remove('open');
    }
}

function updateCartDropdown() {
    const cart = getCart();
    const dropdownItems = document.getElementById('cartDropdownItems');
    const clearBtn = document.getElementById('clearCartBtnDropdown');
    
    if (!dropdownItems) return;
    
    if (cart.length === 0) {
        dropdownItems.innerHTML = '<div class="cart-empty-dropdown">Koszyk jest pusty</div>';
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }
    
    dropdownItems.innerHTML = cart.map(cartItem => {
        const product = allProducts.find(p => p.id === cartItem.id);
        if (!product) return '';
        
        const itemTotal = product.price * cartItem.qty;
        const plusDisabled = canAddToCart(product, cart) ? '' : 'disabled';
        return `
            <div class="cart-item-dropdown">
                <div class="cart-item-info-dropdown">
                    <div class="cart-item-name-dropdown">${product.name}</div>
                    <div class="cart-item-price-dropdown">${itemTotal.toFixed(2)} zł</div>
                </div>
                <div class="cart-item-qty-dropdown">
                    <button class="qty-btn-mini" onclick="removeFromCart(event, ${product.id})">
                        <i class="bi bi-dash-lg"></i>
                    </button>
                    <span class="qty-display-mini">${cartItem.qty}</span>
                    <button class="qty-btn-mini" onclick="addToCart(event, ${product.id})" ${plusDisabled}>
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    if (clearBtn) clearBtn.style.display = 'block';
}

// Close dropdown when clicking outside (optional additional layer)
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('cartDropdownMenu');
    const wrapper = document.getElementById('cartDropdownWrapper');
    if (!dropdown || !wrapper) return;
    
    if (!wrapper.contains(e.target)) {
        dropdown.classList.remove('open');
    }
});