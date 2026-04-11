const LOCALE = "es-AR";
const CURRENCY = "ARS";
const CART_STORAGE_KEY = "chester-cart-v1";
const CUSTOMER_STORAGE_KEY = "chester-customer-v1";
const WHATSAPP_PHONE = "5491124031761";
const PICKUP_ADDRESS = "Chaco 150 esquina Maipu, Don Bosco, Buenos Aires, Argentina";

const SHIPPING_ZONES = {
    centro: { label: "Zona 1 (0 a 3 km)", price: 1000 },
    norte: { label: "Zona 2 (3 a 5 km)", price: 3000 },
    sur: { label: "Zona 3 (5 a 7 km)", price: 4000 },
    retiro: { label: "Take away", price: 0 }
};

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0
});

const menu = {
    burgers: [
        { id: 1, name: "Cheese", price: 11700, desc: "Doble medallon y doble cheddar" },
        { id: 2, name: "Cheese & Bacon", price: 12800, desc: "Doble medallon, cheddar y panceta" },
        { id: 3, name: "Egg & Bacon", price: 12800, desc: "Doble medallon, cheddar, huevo y panceta" },
        { id: 4, name: "Crispy Chester", price: 13000, desc: "Cebolla crispy y salsa chester" },
        { id: 5, name: "Clasica", price: 12300, desc: "Lechuga, tomate, cebolla y salsa chester" },
        { id: 6, name: "Criolla", price: 14000, desc: "Provoleta, morrones, cebolla caramelizada" },
        { id: 7, name: "Chesty", price: 13000, desc: "Panceta, pepino y salsa chesty" }
    ],
    extras: [
        { id: 8, name: "Papas Fritas", price: 6000, desc: "Porcion grande" },
        { id: 9, name: "Aros de Cebolla", price: 6000, desc: "Porcion de 10 unidades" }
    ],
    drinks: [
        { id: 10, name: "Coca Cola 500ml", price: 2500 },
        { id: 11, name: "Sprite 500ml", price: 2500 },
        { id: 12, name: "Agua Mineral", price: 2000 }
    ]
};

let cart = loadCart();

const burgersList = document.getElementById("burgers-list");
const extrasList = document.getElementById("extras-list");
const drinksList = document.getElementById("drinks-list");
const cartItems = document.getElementById("cart-items");
const cartDrawer = document.getElementById("cart-drawer");
const cartDrawerSubtotal = document.getElementById("cart-drawer-subtotal");
const cartToggleBtn = document.getElementById("cart-toggle-btn");
const closeCartDrawerBtn = document.getElementById("close-cart-drawer-btn");
const totalPrice = document.getElementById("total-price");
const cartCount = document.getElementById("cart-count");
const subtotalPrice = document.getElementById("subtotal-price");
const shippingPrice = document.getElementById("shipping-price");
const grandTotalPrice = document.getElementById("grand-total-price");
const checkoutDetailList = document.getElementById("checkout-detail-list");
const checkoutDetailSubtotal = document.getElementById("checkout-detail-subtotal");
const customerNameInput = document.getElementById("customer-name");
const deliveryAddressFields = document.getElementById("delivery-address-fields");
const customerStreetNumberInput = document.getElementById("customer-street-number");
const customerNeighborhoodSelect = document.getElementById("customer-neighborhood");
const customerBetweenStreetsInput = document.getElementById("customer-between-streets");
const deliveryZoneSelect = document.getElementById("delivery-zone");
const pickupAddressNote = document.getElementById("pickup-address-note");
const checkoutModal = document.getElementById("checkout-modal");
const closeCheckoutBtn = document.getElementById("close-checkout-btn");
const submitOrderBtn = document.getElementById("submit-order-btn");
const feedback = document.getElementById("feedback");
const liveRegion = document.getElementById("a11y-live");
const clearCartBtn = document.getElementById("clear-cart");
const orderBtn = document.getElementById("order-btn");

hydrateCustomerData();
render();
bindEvents();
updateTotals();
updateDeliveryModeUI();

function bindEvents() {
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onDocumentKeydown);
    clearCartBtn.addEventListener("click", clearCart);
    cartToggleBtn.addEventListener("click", toggleCartDrawer);
    closeCartDrawerBtn.addEventListener("click", closeCartDrawer);
    orderBtn.addEventListener("click", openCheckout);
    closeCheckoutBtn.addEventListener("click", closeCheckout);
    submitOrderBtn.addEventListener("click", sendOrder);
    checkoutModal.addEventListener("click", onCheckoutBackdropClick);

    customerNameInput.addEventListener("input", saveCustomerData);
    customerStreetNumberInput.addEventListener("input", saveCustomerData);
    customerNeighborhoodSelect.addEventListener("change", saveCustomerData);
    customerBetweenStreetsInput.addEventListener("input", saveCustomerData);

    deliveryZoneSelect.addEventListener("change", () => {
        saveCustomerData();
        updateTotals();
        updateDeliveryModeUI();
    });
}

function onDocumentKeydown(event) {
    if (event.key === "Escape" && !checkoutModal.hidden) {
        closeCheckout();
    }
}

function onCheckoutBackdropClick(event) {
    if (event.target === checkoutModal) {
        closeCheckout();
    }
}

function onDocumentClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    if (action === "add-burger") {
        addBurger(Number(button.dataset.id));
        return;
    }

    if (action === "add-item") {
        addItem(Number(button.dataset.id), button.dataset.type);
        return;
    }

    if (action === "increase-qty") {
        changeQty(button.dataset.key, 1);
        return;
    }

    if (action === "decrease-qty") {
        changeQty(button.dataset.key, -1);
        return;
    }

    if (action === "remove-item") {
        removeItem(button.dataset.key);
    }
}

function render() {
    renderBurgers();
    const visibleExtras = menu.extras.filter((item) => item.id !== 9);
    renderSimple(visibleExtras, extrasList, "EXTRA", "extras-list");

    // Las gaseosas quedan desactivadas temporalmente si su seccion no esta en HTML.
    if (drinksList) {
        renderSimple(menu.drinks, drinksList, "DRINK", "drinks-list");
    }
    renderCart();
}

function renderBurgers() {
    burgersList.innerHTML = menu.burgers.map((item) => `
        <article class="item-card">
            <div class="item-img" aria-hidden="true"></div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
                <p class="quality-claim">Pan Kalis + medallon de carne 90gr</p>
                <div class="options">
                    <label><input type="checkbox" id="notco-${item.id}"> NotCo</label>
                    <label><input type="checkbox" id="triple-${item.id}"> Triple (+${formatMoney(3000)})</label>
                </div>
                <div class="price-tag">${formatMoney(item.price)}</div>
            </div>
            <button class="btn-add" type="button" data-action="add-burger" data-id="${item.id}" aria-label="Anadir ${item.name}">ANADIR</button>
        </article>
    `).join("");
}

function renderSimple(list, container, label, type) {
    container.innerHTML = list.map((item) => `
        <article class="item-card">
            <div class="item-img" aria-hidden="true"></div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <div class="price-tag">${formatMoney(item.price)}</div>
            </div>
            <button class="btn-add" type="button" data-action="add-item" data-id="${item.id}" data-type="${type}" aria-label="Anadir ${item.name}">ANADIR</button>
        </article>
    `).join("");
}

function renderCart() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Todavia no agregaste productos.</p>';
    } else {
        cartItems.innerHTML = cart.map((item) => {
            const subtotal = item.unitPrice * item.qty;
            return `
                <div class="cart-row">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-controls">
                        <button type="button" class="qty-btn" data-action="decrease-qty" data-key="${item.key}" aria-label="Disminuir cantidad de ${item.name}">-</button>
                        <span class="qty-value">${item.qty}</span>
                        <button type="button" class="qty-btn" data-action="increase-qty" data-key="${item.key}" aria-label="Aumentar cantidad de ${item.name}">+</button>
                        <button type="button" class="btn-remove" data-action="remove-item" data-key="${item.key}" aria-label="Quitar ${item.name}">Quitar</button>
                        <div class="cart-subtotal">${formatMoney(subtotal)}</div>
                    </div>
                </div>
            `;
        }).join("");
    }

    cartDrawerSubtotal.textContent = formatMoney(getCartSubtotal());
    updateTotals();
}

function addBurger(id) {
    const baseItem = menu.burgers.find((burger) => burger.id === id);
    if (!baseItem) return;

    const isNotCo = document.getElementById(`notco-${id}`).checked;
    const isTriple = document.getElementById(`triple-${id}`).checked;

    let finalPrice = baseItem.price;
    let displayName = baseItem.name;
    const modifiers = [];

    if (isNotCo) {
        displayName += " (NotCo)";
        modifiers.push("notco");
    }

    if (isTriple) {
        finalPrice += 3000;
        displayName += " (Triple)";
        modifiers.push("triple");
    }

    addToCart({
        key: createCartKey(baseItem.id, modifiers),
        name: displayName,
        unitPrice: finalPrice
    });
}

function addItem(id, type) {
    const source = type === "extras-list" ? menu.extras : menu.drinks;
    const item = source.find((current) => current.id === id);
    if (!item) return;

    addToCart({
        key: createCartKey(item.id, []),
        name: item.name,
        unitPrice: item.price
    });
}

function addToCart({ key, name, unitPrice }) {
    const existingItem = cart.find((item) => item.key === key);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ key, name, unitPrice, qty: 1 });
    }

    persistAndRefresh(`${name} agregado al carrito`);
}

function changeQty(key, delta) {
    const item = cart.find((current) => current.key === key);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter((current) => current.key !== key);
    }

    persistAndRefresh("Carrito actualizado");
}

function removeItem(key) {
    cart = cart.filter((item) => item.key !== key);
    persistAndRefresh("Item eliminado del carrito");
}

function clearCart() {
    if (cart.length === 0) return;

    cart = [];
    closeCartDrawer();
    persistAndRefresh("Carrito vaciado");
}

function persistAndRefresh(statusMessage) {
    saveCart();
    renderCart();
    announce(statusMessage);
    showFeedback(statusMessage);
}

function updateTotals() {
    const subtotal = getCartSubtotal();
    const shipping = getShippingCost();
    const total = subtotal + shipping;

    subtotalPrice.textContent = formatMoney(subtotal);
    shippingPrice.textContent = formatMoney(shipping);
    grandTotalPrice.textContent = formatMoney(total);
    checkoutDetailSubtotal.textContent = formatMoney(subtotal);

    totalPrice.textContent = formatMoney(total);
    cartCount.textContent = getCartItemCount();

    renderCheckoutDetail();
}

function renderCheckoutDetail() {
    if (cart.length === 0) {
        checkoutDetailList.innerHTML = '<div class="checkout-detail-item">No hay productos en el pedido.</div>';
        return;
    }

    checkoutDetailList.innerHTML = cart.map((item) => {
        const itemSubtotal = item.unitPrice * item.qty;
        return `<div class="checkout-detail-item">${item.qty} x ${item.name} - ${formatMoney(itemSubtotal)}</div>`;
    }).join("");
}

function getShippingCost() {
    const zone = deliveryZoneSelect.value;
    if (!zone || !SHIPPING_ZONES[zone]) return 0;
    return SHIPPING_ZONES[zone].price;
}

function getCartSubtotal() {
    return cart.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
}

function getCartItemCount() {
    return cart.reduce((acc, item) => acc + item.qty, 0);
}

function createCartKey(baseId, modifiers) {
    return `${baseId}-${modifiers.join("-") || "base"}`;
}

function formatMoney(value) {
    return currencyFormatter.format(value);
}

function formatDeliveryAddress(streetNumber, neighborhood, betweenStreets) {
    const parts = [streetNumber];
    if (neighborhood) parts.push(`Barrio ${neighborhood}`);
    if (betweenStreets) parts.push(`Entre calles ${betweenStreets}`);
    return parts.join(", ");
}

function sendOrder() {
    if (cart.length === 0) {
        showFeedback("El carrito esta vacio");
        return;
    }

    if (!validateCheckout()) {
        return;
    }

    const zoneCode = deliveryZoneSelect.value;
    const zoneData = SHIPPING_ZONES[zoneCode];
    const subtotal = getCartSubtotal();
    const shipping = zoneData.price;
    const total = subtotal + shipping;
    const isPickup = zoneCode === "retiro";
    const streetNumber = customerStreetNumberInput.value.trim();
    const neighborhood = customerNeighborhoodSelect.value;
    const betweenStreets = customerBetweenStreetsInput.value.trim();
    const orderAddress = isPickup
        ? PICKUP_ADDRESS
        : formatDeliveryAddress(streetNumber, neighborhood, betweenStreets);

    const lines = [
        "NUEVO PEDIDO - CHESTER BURGER",
        "",
        `Cliente: ${customerNameInput.value.trim()}`,
        `${isPickup ? "Take away en" : "Direccion"}: ${orderAddress}`,
        `Zona: ${zoneData.label}`,
        ""
    ];

    cart.forEach((item) => {
        const itemSubtotal = item.unitPrice * item.qty;
        lines.push(`- ${item.qty} x ${item.name} (${formatMoney(item.unitPrice)}) = ${formatMoney(itemSubtotal)}`);
    });

    lines.push(
        "",
        `SUBTOTAL: ${formatMoney(subtotal)}`,
        `ENVIO: ${formatMoney(shipping)}`,
        `TOTAL FINAL: ${formatMoney(total)}`
    );

    const encodedMessage = encodeURIComponent(lines.join("\n"));
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
    closeCheckout();
    window.open(whatsappUrl, "_blank", "noopener");
}

function openCheckout() {
    if (cart.length === 0) {
        showFeedback("El carrito esta vacio");
        return;
    }

    closeCartDrawer();
    updateTotals();
    checkoutModal.removeAttribute("hidden");
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            checkoutModal.classList.add("is-open");
            customerNameInput.focus();
        });
    });
}

function closeCheckout() {
    checkoutModal.classList.remove("is-open");
    checkoutModal.addEventListener("transitionend", () => {
        checkoutModal.setAttribute("hidden", "");
        document.body.classList.remove("no-scroll");
    }, { once: true });
}

function toggleCartDrawer() {
    if (cartDrawer.hidden) {
        openCartDrawer();
    } else {
        closeCartDrawer();
    }
}

function openCartDrawer() {
    cartDrawer.removeAttribute("hidden");
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            cartDrawer.classList.add("is-open");
        });
    });
    cartToggleBtn.textContent = "OCULTAR CARRITO";
}

function closeCartDrawer() {
    cartDrawer.classList.remove("is-open");
    cartDrawer.addEventListener("transitionend", () => {
        cartDrawer.setAttribute("hidden", "");
    }, { once: true });
    cartToggleBtn.textContent = "VER CARRITO";
}

function validateCheckout() {
    const name = customerNameInput.value.trim();
    const streetNumber = customerStreetNumberInput.value.trim();
    const neighborhood = customerNeighborhoodSelect.value;
    const betweenStreets = customerBetweenStreetsInput.value.trim();
    const zone = deliveryZoneSelect.value;

    if (name.length < 2) {
        showFeedback("Ingresa tu nombre para continuar");
        customerNameInput.focus();
        return false;
    }

    if (!zone || !SHIPPING_ZONES[zone]) {
        showFeedback("Selecciona tu zona para calcular envio");
        deliveryZoneSelect.focus();
        return false;
    }

    if (zone === "retiro") {
        return true;
    }

    if (streetNumber.length < 5) {
        showFeedback("Ingresa calle y numero para continuar");
        customerStreetNumberInput.focus();
        return false;
    }

    if (!neighborhood) {
        showFeedback("Selecciona un barrio para continuar");
        customerNeighborhoodSelect.focus();
        return false;
    }

    if (betweenStreets.length < 3) {
        showFeedback("Ingresa las entre calles para continuar");
        customerBetweenStreetsInput.focus();
        return false;
    }

    return true;
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter((item) => {
            return item
                && typeof item.key === "string"
                && typeof item.name === "string"
                && Number.isFinite(item.unitPrice)
                && Number.isFinite(item.qty)
                && item.qty > 0;
        });
    } catch (error) {
        return [];
    }
}

function saveCustomerData() {
    const streetNumber = customerStreetNumberInput.value.trim();
    const neighborhood = customerNeighborhoodSelect.value;
    const betweenStreets = customerBetweenStreetsInput.value.trim();

    const data = {
        name: customerNameInput.value.trim(),
        streetNumber,
        neighborhood,
        betweenStreets,
        address: formatDeliveryAddress(streetNumber, neighborhood, betweenStreets),
        zone: deliveryZoneSelect.value
    };

    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(data));
}

function hydrateCustomerData() {
    try {
        const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
        if (!raw) return;

        const data = JSON.parse(raw);
        if (!data || typeof data !== "object") return;

        if (typeof data.name === "string") {
            customerNameInput.value = data.name;
        }

        if (typeof data.streetNumber === "string") {
            customerStreetNumberInput.value = data.streetNumber;
        } else if (typeof data.address === "string") {
            customerStreetNumberInput.value = data.address;
        }

        if (typeof data.neighborhood === "string") {
            customerNeighborhoodSelect.value = data.neighborhood;
        }

        if (typeof data.betweenStreets === "string") {
            customerBetweenStreetsInput.value = data.betweenStreets;
        }

        if (typeof data.zone === "string" && SHIPPING_ZONES[data.zone]) {
            deliveryZoneSelect.value = data.zone;
        }
    } catch (error) {
        return;
    }
}

function announce(message) {
    liveRegion.textContent = message;
}

function showFeedback(message) {
    feedback.textContent = message;
    announce(message);
    feedback.classList.add("show");

    clearTimeout(showFeedback.timeoutId);
    showFeedback.timeoutId = setTimeout(() => {
        feedback.classList.remove("show");
    }, 1500);
}

function updateDeliveryModeUI() {
    const isPickup = deliveryZoneSelect.value === "retiro";

    if (pickupAddressNote) {
        pickupAddressNote.hidden = !isPickup;
    }

    if (deliveryAddressFields) {
        deliveryAddressFields.hidden = isPickup;
    }

    customerStreetNumberInput.disabled = isPickup;
    customerNeighborhoodSelect.disabled = isPickup;
    customerBetweenStreetsInput.disabled = isPickup;
}
