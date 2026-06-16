let allProducts = [];
let allCategories = [];
let selectedCategoryId = null;
let currentSearch = '';

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
        
        if (qty === 0) {
            // Przycisk Dodaj
            return `
                <div class="product-card">
                    <div class="product-image-container">
                        <img src="${imageUrl}" alt="${p.name}" class="product-image">
                    </div>
                    <div class="product-body">
                        <h5 class="product-name">${p.name}</h5>
                        <p class="product-description">${p.description}</p>
                        <div class="product-footer">
                            <span class="product-price">${p.price} zł</span>
                            <button onclick="addToCart(${p.id})" class="btn btn-primary btn-sm add-to-cart-btn">
                                <i class="bi bi-plus-lg"></i> Dodaj
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Interfejs z przyciskami - i +
            return `
                <div class="product-card">
                    <div class="product-image-container">
                        <img src="${imageUrl}" alt="${p.name}" class="product-image">
                    </div>
                    <div class="product-body">
                        <h5 class="product-name">${p.name}</h5>
                        <p class="product-description">${p.description}</p>
                        <div class="product-footer">
                            <span class="product-price">${p.price} zł</span>
                            <div class="product-quantity-controls">
                                <button onclick="removeFromCart(${p.id})" class="qty-btn qty-minus">
                                    <i class="bi bi-dash-lg"></i>
                                </button>
                                <span class="qty-display">${qty}</span>
                                <button onclick="addToCart(${p.id})" class="qty-btn qty-plus">
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

function addToCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const item = cart.find(i => i.id === id);
    
    if (item) item.qty++;
    else cart.push({ id, qty: 1 });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderProducts(allProducts.filter(p => selectedCategoryId === null ? true : p.CategoryId === selectedCategoryId));
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const item = cart.find(i => i.id === id);
    
    if (item) {
        item.qty--;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderProducts(allProducts.filter(p => selectedCategoryId === null ? true : p.CategoryId === selectedCategoryId));
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartInfo = document.getElementById('cartInfo');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    if (cart.length === 0) {
        cartInfo.style.display = 'none';
        clearCartBtn.style.display = 'none';
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
    clearCartBtn.style.display = 'block';
}

function clearCartWithConfirm() {
    const confirmed = confirm('Czy na pewno chcesz wyczyścić koszyk?\n\nTa akcja nie może być cofnięta.');
    
    if (confirmed) {
        localStorage.removeItem('cart');
        updateCartBadge();
        renderProducts(allProducts.filter(p => selectedCategoryId === null ? true : p.CategoryId === selectedCategoryId));
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