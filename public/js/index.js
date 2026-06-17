let allProducts = [];
let allCategories = [];
let selectedCategoryId = null;
let currentSearch = '';
let currentModalProductId = null;
let currentModalQuantity = 1;

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
        
        renderProducts(products);
        updateCartBadge(); // Aktualizuj badge TUTAJ, po załadowaniu produktów
    } catch (error) {
        console.error('Błąd ładowania produktów:', error);
    }
}

function renderProducts(products) {
    const container = document.getElementById('products');
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (products.length === 0) {
        container.innerHTML = '<p class="col-12 text-center text-muted">Brak produktów w tej kategorii</p>';
        return;
    }
    
    container.innerHTML = products.map(p => {
        const cartItem = cart.find(i => i.id === p.id);
        const qty = cartItem ? cartItem.qty : 0;
        const imageUrl = p.image && p.image.trim() !== '' ? `/uploads/${p.image}` : '/uploads/No_Image_Available.jpg';
        
        // Badge z ilością w koszyku
        const qtyBadgeHtml = qty > 0 ? `<div class="qty-badge">${qty}</div>` : '';
        
        if (qty === 0) {
            // Przycisk Dodaj
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
                            <button onclick="addToCart(event, ${p.id})" class="btn btn-primary btn-sm add-to-cart-btn">
                                <i class="bi bi-plus-lg"></i> Dodaj
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Interfejs z przyciskami - i +
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
                            <div class="product-quantity-controls">
                                <button onclick="removeFromCart(event, ${p.id})" class="qty-btn qty-minus">
                                    <i class="bi bi-dash-lg"></i>
                                </button>
                                <span class="qty-display">${qty}</span>
                                <button onclick="addToCart(event, ${p.id})" class="qty-btn qty-plus">
                                    <i class="bi bi-plus-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function applyFilter() {
    if (currentSearch && currentSearch.length > 0) {
        const filtered = allProducts.filter(p => p.name && p.name.toLowerCase().includes(currentSearch));
        renderProducts(filtered);
        return;
    }

    if (selectedCategoryId === null) {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.CategoryId === selectedCategoryId);
        renderProducts(filtered);
    }
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
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const item = cart.find(i => i.id === id);
    
    if (item) item.qty++;
    else cart.push({ id, qty: 1 });
    
    // Zmniejsz stock w allProducts
    const product = allProducts.find(p => p.id === id);
    if (product && product.stock > 0) {
        product.stock--;
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    updateCartDropdown();
    
    // Re-render current view
    applyFilter();
    
    // Update modal if open
    if (currentModalProductId === id) {
        openProductModal(id);
    }
}

function removeFromCart(evt, id) {
    if (evt) {
        evt.stopPropagation();
    }
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const item = cart.find(i => i.id === id);
    
    if (item) {
        item.qty--;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    
    // Zwiększ stock w allProducts
    const product = allProducts.find(p => p.id === id);
    if (product) {
        product.stock++;
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    updateCartDropdown();
    
    // Re-render current view
    applyFilter();
    
    // Update modal if open
    if (currentModalProductId === id) {
        openProductModal(id);
    }
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartInfo = document.getElementById('cartInfo');
    const clearCartBtn = document.getElementById('clearCartBtnDropdown');
    
    if (cart.length === 0) {
        cartInfo.style.display = 'none';
        if (clearCartBtn) clearCartBtn.style.display = 'none';
        return;
    }
    
    // Oblicz ilość przedmiotów
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    
    // Oblicz cenę
    const totalPrice = cart.reduce((sum, item) => {
        const product = allProducts.find(p => p.id === item.id);
        return sum + (product ? product.price * item.qty : 0);
    }, 0);
    
    // Wyświetl info
    cartInfo.style.display = 'block';
    cartInfo.innerHTML = `${totalItems} szt. / ${totalPrice.toFixed(2)} zł`;
    if (clearCartBtn) clearCartBtn.style.display = 'block';
    
    // Update dropdown
    updateCartDropdown();
}

function clearCartWithConfirm() {
    const confirmed = confirm('Czy na pewno chcesz wyczyścić koszyk?\n\nTa akcja nie może być cofnięta.');
    
    if (confirmed) {
        localStorage.removeItem('cart');
        updateCartBadge();
        updateCartDropdown();
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
    currentModalQuantity = 1;

    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDescription');
    const img = document.getElementById('modalImage');
    const price = document.getElementById('modalPrice');
    const stock = document.getElementById('modalStock');
    const qtyDisplay = document.getElementById('modalQtyDisplay');
    const qtyMinusBtn = document.getElementById('modalQtyMinus');
    const qtyPlusBtn = document.getElementById('modalQtyPlus');

    title.textContent = product.name || '';
    desc.textContent = product.description || 'Brak opisu produktu.';
    img.src = (product.image && product.image.trim() !== '') ? `/uploads/${product.image}` : '/uploads/No_Image_Available.jpg';
    price.textContent = `${product.price} zł`;
    qtyDisplay.textContent = currentModalQuantity;
    
    // Update button states
    qtyMinusBtn.disabled = currentModalQuantity <= 1;
    qtyPlusBtn.disabled = product.stock <= currentModalQuantity;
    
    const stockEl = document.getElementById('modalStock');
    if (product.stock > 0) {
        stockEl.textContent = `${product.stock} szt. dostępne`;
        stockEl.classList.remove('out-of-stock');
    } else {
        stockEl.textContent = 'Brak w magazynie';
        stockEl.classList.add('out-of-stock');
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
    currentModalProductId = null;
}

function addToCartFromModal() {
    if (!currentModalProductId) return;
    addToCart(null, currentModalProductId);
}

function incrementModalQuantity() {
    const product = allProducts.find(p => p.id === currentModalProductId);
    if (!product || currentModalQuantity >= product.stock) return;
    currentModalQuantity++;
    document.getElementById('modalQtyDisplay').textContent = currentModalQuantity;
}

function decrementModalQuantity() {
    if (currentModalQuantity > 1) {
        currentModalQuantity--;
        document.getElementById('modalQtyDisplay').textContent = currentModalQuantity;
    }
}

function addMultipleToCart() {
    if (!currentModalProductId || currentModalQuantity < 1) return;
    
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const item = cart.find(i => i.id === currentModalProductId);
    
    if (item) {
        item.qty += currentModalQuantity;
    } else {
        cart.push({ id: currentModalProductId, qty: currentModalQuantity });
    }
    
    // Zmniejsz stock w allProducts
    const product = allProducts.find(p => p.id === currentModalProductId);
    if (product && product.stock >= currentModalQuantity) {
        product.stock -= currentModalQuantity;
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    updateCartDropdown();
    applyFilter();
    
    // Reset modal quantity
    currentModalQuantity = 1;
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
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const dropdownItems = document.getElementById('cartDropdownItems');
    const clearBtn = document.getElementById('clearCartBtnDropdown');
    
    if (!dropdownItems) return;
    
    if (cart.length === 0) {
        dropdownItems.innerHTML = '<div class="cart-empty-dropdown">Koszyk jest pusty</div>';
        clearBtn.style.display = 'none';
        return;
    }
    
    dropdownItems.innerHTML = cart.map(cartItem => {
        const product = allProducts.find(p => p.id === cartItem.id);
        if (!product) return '';
        
        const itemTotal = product.price * cartItem.qty;
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
                    <button class="qty-btn-mini" onclick="addToCart(event, ${product.id})">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    clearBtn.style.display = 'block';
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