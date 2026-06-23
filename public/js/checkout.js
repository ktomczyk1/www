let products = [];

const NAME_PATTERN = /^[A-Za-zÀ-žĄĆĘŁŃÓŚŹŻąćęłńóśźż\s'-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^(\+48\s?)?(\d[\s-]?){9}$/;
const STREET_PATTERN = /^[A-Za-zÀ-žĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9\s.'-]+$/;
const HOUSE_NUMBER_PATTERN = /^\d+[a-zA-Z]?([/-]\d+[a-zA-Z]?)?$/;
const APARTMENT_PATTERN = /^[\dA-Za-z/-]+$/;
const POSTAL_CODE_PATTERN = /^\d{2}-\d{3}$/;

const FIELD_IDS = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'street',
    'houseNumber',
    'apartmentNumber',
    'postalCode',
    'city'
];

async function loadProducts() {
    const res = await fetch('/api/products');
    products = await res.json();
    validateCartAgainstStock(products);
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
            <p class="order-summary-empty">
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

function validateName(value, fieldLabel) {
    const trimmed = value.trim();

    if (!trimmed) {
        return `${fieldLabel} jest wymagane.`;
    }

    if (trimmed.length < 2) {
        return `${fieldLabel} musi mieć co najmniej 2 znaki.`;
    }

    if (!NAME_PATTERN.test(trimmed)) {
        return `${fieldLabel} może zawierać tylko litery, spacje, myślniki i apostrofy.`;
    }

    return '';
}

function validateEmail(value) {
    const trimmed = value.trim();

    if (!trimmed) {
        return 'Email jest wymagany.';
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
        return 'Podaj poprawny adres email (np. jan@example.com).';
    }

    return '';
}

function validatePhone(value) {
    const trimmed = value.trim();

    if (!trimmed) {
        return '';
    }

    if (!PHONE_PATTERN.test(trimmed)) {
        return 'Podaj poprawny numer telefonu (9 cyfr, opcjonalnie z +48).';
    }

    return '';
}

function validateStreet(value) {
    const trimmed = value.trim();

    if (!trimmed) {
        return 'Ulica jest wymagana.';
    }

    if (trimmed.length < 2) {
        return 'Nazwa ulicy musi mieć co najmniej 2 znaki.';
    }

    if (!STREET_PATTERN.test(trimmed)) {
        return 'Ulica zawiera niedozwolone znaki.';
    }

    return '';
}

function validateHouseNumber(value) {
    const trimmed = value.trim();

    if (!trimmed) {
        return 'Numer domu jest wymagany.';
    }

    if (!HOUSE_NUMBER_PATTERN.test(trimmed)) {
        return 'Podaj poprawny numer domu (np. 12, 12A, 12/3).';
    }

    return '';
}

function validateApartmentNumber(value) {
    const trimmed = value.trim();

    if (!trimmed) {
        return '';
    }

    if (!APARTMENT_PATTERN.test(trimmed)) {
        return 'Numer lokalu może zawierać tylko cyfry, litery, / i -. ';
    }

    return '';
}

function validatePostalCode(value) {
    const trimmed = value.trim();

    if (!trimmed) {
        return 'Kod pocztowy jest wymagany.';
    }

    if (!POSTAL_CODE_PATTERN.test(trimmed)) {
        return 'Kod pocztowy musi być w formacie XX-XXX (np. 00-001).';
    }

    return '';
}

function validateCity(value) {
    return validateName(value, 'Miasto');
}

function validateField(fieldId) {
    const input = document.getElementById(fieldId);
    const value = input.value;
    let error = '';

    switch (fieldId) {
        case 'firstName':
            error = validateName(value, 'Imię');
            break;
        case 'lastName':
            error = validateName(value, 'Nazwisko');
            break;
        case 'email':
            error = validateEmail(value);
            break;
        case 'phone':
            error = validatePhone(value);
            break;
        case 'street':
            error = validateStreet(value);
            break;
        case 'houseNumber':
            error = validateHouseNumber(value);
            break;
        case 'apartmentNumber':
            error = validateApartmentNumber(value);
            break;
        case 'postalCode':
            error = validatePostalCode(value);
            break;
        case 'city':
            error = validateCity(value);
            break;
    }

    setFieldError(fieldId, error);
    return !error;
}

function validateForm() {
    return FIELD_IDS.every(validateField);
}

function setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}Error`);
    const group = input.closest('.form-group');

    errorEl.textContent = message;
    group.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function formatPostalCode(value) {
    const digits = value.replace(/\D/g, '').slice(0, 5);

    if (digits.length <= 2) {
        return digits;
    }

    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

function buildAddress(formData) {
    const apartment = formData.apartmentNumber ? `/${formData.apartmentNumber}` : '';
    return `${formData.street} ${formData.houseNumber}${apartment}, ${formData.postalCode} ${formData.city}`;
}

function getFormData() {
    const street = document.getElementById('street').value.trim();
    const houseNumber = document.getElementById('houseNumber').value.trim();
    const apartmentNumber = document.getElementById('apartmentNumber').value.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const city = document.getElementById('city').value.trim();

    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        street,
        houseNumber,
        apartmentNumber,
        postalCode,
        city
    };

    formData.address = buildAddress(formData);
    return formData;
}

function resetSubmitButton(submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.innerHTML = '<i class="bi bi-credit-card"></i> Złóż zamówienie i zapłać';
}

function showPaymentSuccess() {
    const modal = document.getElementById('paymentSuccessModal');
    if (!modal) return;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        window.location.href = '/index.html';
    }, 3500);
}

async function handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');

    if (!paymentStatus) {
        return;
    }

    if (paymentStatus === 'cancelled') {
        const orderId = params.get('order_id');

        if (orderId) {
            await fetch('/api/cancel-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });
        }

        alert('Płatność została anulowana. Możesz wrócić do formularza i spróbować ponownie.');
        window.history.replaceState({}, document.title, '/checkout.html');
        return;
    }

    if (paymentStatus !== 'success' || !sessionId) {
        return;
    }

    try {
        const res = await fetch(`/api/payment-status?session_id=${encodeURIComponent(sessionId)}`);
        const result = await res.json();

        if (res.ok && result.paid) {
            localStorage.removeItem('cart');
            window.history.replaceState({}, document.title, '/checkout.html');
            showPaymentSuccess();
            return;
        }

        alert('Płatność nie została jeszcze potwierdzona. Jeśli pieniądze zostały pobrane, status zamówienia zaktualizuje webhook Stripe.');
        window.history.replaceState({}, document.title, '/checkout.html');
    } catch (error) {
        alert('Nie udało się sprawdzić statusu płatności: ' + error.message);
    }
}

function setupValidation() {
    FIELD_IDS.forEach(fieldId => {
        const input = document.getElementById(fieldId);

        input.addEventListener('blur', () => validateField(fieldId));

        input.addEventListener('input', () => {
            if (fieldId === 'postalCode') {
                input.value = formatPostalCode(input.value);
            }

            if (input.closest('.form-group').classList.contains('has-error')) {
                validateField(fieldId);
            }
        });
    });
}

document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cart = getCart();

    if (cart.length === 0) {
        alert('Koszyk jest pusty!');
        return;
    }

    if (!validateForm()) {
        const firstInvalid = FIELD_IDS.find(id => document.getElementById(`${id}Error`).textContent);
        if (firstInvalid) {
            document.getElementById(firstInvalid).focus();
        }
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span class="spinner"></span> Przekierowanie do Stripe...';

    try {
        const formData = getFormData();
        const data = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            cart
        };

        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok && result.url) {
            window.location.href = result.url;
        } else {
            alert('Błąd: ' + (result.error || 'Nie udało się złożyć zamówienia'));
            resetSubmitButton(submitBtn);
        }
    } catch (error) {
        alert('Błąd sieci: ' + error.message);
        resetSubmitButton(submitBtn);
    }
});

function goBack() {
    window.location.href = '/cart.html';
}

loadProducts();
setupValidation();
handlePaymentReturn();
