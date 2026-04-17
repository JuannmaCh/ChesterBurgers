const LOCALE = "es-AR";
const CURRENCY = "ARS";
const CART_STORAGE_KEY = "chester-cart-v1";
const CUSTOMER_STORAGE_KEY = "chester-customer-v1";
const WHATSAPP_PHONE = "5491124031761";
const PICKUP_ADDRESS = "Chaco 150 esquina Maipu, Don Bosco, Buenos Aires, Argentina";
const DEFAULT_ITEM_IMAGE = "burger_chester.jpeg";
const DISCOUNT_PERCENTAGE = 0.1;
const BURGER_CUSTOMIZER_HASH = "#burger-customizer";

const CONFIG_PRICES = {
    modifiers: {
        notco: 0,
        triple: 3000,
        cheddar: 1500,
        panceta: 1500,
        huevo: 1500,
        pepino: 500
    }
};

const BURGER_MODIFIER_META = {
    notco: { inputId: "customizer-notco", displayLabel: "NotCo", nameSuffix: " (NotCo)" },
    triple: { inputId: "customizer-triple", displayLabel: "Triple", nameSuffix: " (Triple)" },
    cheddar: { inputId: "customizer-cheddar", displayLabel: "+ Cheddar", nameSuffix: " (+Cheddar)" },
    panceta: { inputId: "customizer-panceta", displayLabel: "+ Panceta", nameSuffix: " (+Panceta)" },
    huevo: { inputId: "customizer-huevo", displayLabel: "+ Huevo", nameSuffix: " (+Huevo)" },
    pepino: { inputId: "customizer-pepino", displayLabel: "+ Pepino", nameSuffix: " (+Pepino)" }
};

const BURGER_MODIFIER_ORDER = ["notco", "triple", "cheddar", "panceta", "huevo", "pepino"];
const STREET_AND_NUMBER_REGEX = /^(?=.*[A-Za-z\u00C0-\u024F])(?=.*\d)[A-Za-z\u00C0-\u024F\d\s.,'#\-/]+$/;

const PAYMENT_METHOD_LABELS = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    tarjeta: "Tarjeta"
};

const SHIPPING_ZONES = {
    centro: { label: "Zona 1 (hasta 2.5 km)", price: 1000 },
    norte: { label: "Zona 2 (de 2.5 km a 4 km)", price: 2000 },
    retiro: { label: "Take away", price: 0 }
};

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0
});

const menu = {
    burgerOfMonth: [
        { id: 14, name: "Pulled Pork", price: 14000, desc: "Doble medallon 90grs, cheddar, bondiola desmenuzada, cebolla crispy, pepinillos agridulces, salsa bbq y salsa chester con pan de kalis", image: "burger_chester.jpeg" }
    ],
    burgers: [
        { id: 1, name: "Cheese", price: 11700, desc: "Doble medallon 90grs y doble cheddar con pan de kalis", image: "burger_chester.jpeg" },
        { id: 2, name: "Cheese & Bacon", price: 12800, desc: "Doble medallon 90grs, cheddar y panceta con pan de kalis", image: "burger_chester.jpeg" },
        { id: 3, name: "Egg & Bacon", price: 12800, desc: "Doble medallon 90grs, cheddar, huevo y panceta con pan de kalis", image: "burger_chester.jpeg" },
        { id: 4, name: "Crispy Chester", price: 13000, desc: "Doble medallon 90grs, cheddar, panceta, cebolla crispy y salsa chester con pan de kalis", image: "burger_chester.jpeg" },
        { id: 5, name: "Clasica", price: 12300, desc: "Doble medallon 90grs, lechuga, tomate, cebolla, cheddar y salsa chester con pan de kalis", image: "burger_chester.jpeg" },
        { id: 6, name: "Criolla", price: 14000, desc: "Doble medallon 90grs, provoleta, morrones encurtidos, cebolla caramelizada y mayochurri con pan de kalis", image: "burger_chester.jpeg", inStock: true },
        { id: 7, name: "Chesty", price: 13000, desc: "Doble medallon 90grs, cheddar, panceta, lechuga, tomate, cebolla, pepino y salsa chesty con pan de kalis", image: "burger_chester.jpeg" }
    ],
    extras: [
        { id: 8, name: "Papas Fritas", price: 4000, desc: "Porcion de 120grs", image: "papas_fritas.avif" },
        { id: 9, name: "Aros de Cebolla", price: 6000, desc: "Porcion de 8 unidades", image: "aros_de_cebolla.webp", inStock: true }
    ],
    drinks: [
        { id: 10, name: "Coca Cola", price: 3000, desc: "Lata 354 ml", image: "lata_coca.webp", inStock: true },
        { id: 11, name: "Sprite", price: 3000, desc: "Lata 354 ml", image: "lata_sprite.png", inStock: true },
        { id: 13, name: "Fanta", price: 3000, desc: "Lata 354 ml", image: "lata_fanta.png", inStock: false },
        { id: 12, name: "Agua Mineral", price: 2000, desc: "Botella 500 ml", image: "agua.png", inStock: true },
        { id: 15, name: "Cerveza Heineken", price: 4400, desc: "Lata", image: "lata_heineken.png", inStock: true },
        { id: 16, name: "Cerveza Miller", price: 3400, desc: "Lata", image: "lata_miller.png", inStock: true }
    ]
};

let cart = loadCart();

const burgerMonthList = document.getElementById("burger-month-list");
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
const customerNotesInput = document.getElementById("customer-notes");
const deliveryZoneSelect = document.getElementById("delivery-zone");
const paymentMethodSelect = document.getElementById("payment-method");
const pickupAddressNote = document.getElementById("pickup-address-note");
const discountRow = document.getElementById("discount-row");
const discountLabel = document.getElementById("discount-label");
const discountPrice = document.getElementById("discount-price");
const checkoutModal = document.getElementById("checkout-modal");
const closeCheckoutBtn = document.getElementById("close-checkout-btn");
const submitOrderBtn = document.getElementById("submit-order-btn");
const feedback = document.getElementById("feedback");
const liveRegion = document.getElementById("a11y-live");
const clearCartBtn = document.getElementById("clear-cart");
const orderBtn = document.getElementById("order-btn");

const burgerCustomizerModal = document.getElementById("burger-customizer-modal");
const closeBurgerCustomizerBtn = document.getElementById("close-customizer-btn");
const confirmBurgerCustomizerBtn = document.getElementById("confirm-customizer-btn");
const burgerCustomizerInfo = document.getElementById("customizer-burger-info");
const burgerCustomizerPrice = document.getElementById("customizer-price");

let currentBurgerToCustomize = null;

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
    closeBurgerCustomizerBtn.addEventListener("click", closeBurgerCustomizer);
    confirmBurgerCustomizerBtn.addEventListener("click", confirmBurgerCustomizer);
    burgerCustomizerModal.addEventListener("click", onBurgerCustomizerBackdropClick);
    document.getElementById("customizer-notco").addEventListener("change", updateCustomizerPrice);
    document.getElementById("customizer-triple").addEventListener("change", updateCustomizerPrice);
    document.getElementById("customizer-cheddar").addEventListener("change", updateCustomizerPrice);
    document.getElementById("customizer-panceta").addEventListener("change", updateCustomizerPrice);
    document.getElementById("customizer-huevo").addEventListener("change", updateCustomizerPrice);
    document.getElementById("customizer-pepino").addEventListener("change", updateCustomizerPrice);
    window.addEventListener("popstate", onWindowPopstate);

    customerNameInput.addEventListener("input", () => {
        clearFieldError(customerNameInput);
        saveCustomerData();
    });
    customerStreetNumberInput.addEventListener("input", () => {
        clearFieldError(customerStreetNumberInput);
        saveCustomerData();
    });
    customerNeighborhoodSelect.addEventListener("change", () => {
        clearFieldError(customerNeighborhoodSelect);
        saveCustomerData();
    });
    customerBetweenStreetsInput.addEventListener("input", () => {
        clearFieldError(customerBetweenStreetsInput);
        saveCustomerData();
    });
    customerNotesInput.addEventListener("input", saveCustomerData);

    deliveryZoneSelect.addEventListener("change", () => {
        clearFieldError(deliveryZoneSelect);
        saveCustomerData();
        updateTotals();
        updateDeliveryModeUI();
    });

    paymentMethodSelect.addEventListener("change", () => {
        clearFieldError(paymentMethodSelect);
        saveCustomerData();
        updateTotals();
    });
}

function getLocationWithoutHash() {
    return `${window.location.pathname}${window.location.search}`;
}

function syncBodyScrollLock() {
    const shouldLock = !checkoutModal.hidden || !burgerCustomizerModal.hidden;
    document.body.classList.toggle("no-scroll", shouldLock);
}

function onWindowPopstate() {
    if (!burgerCustomizerModal.hidden && window.location.hash !== BURGER_CUSTOMIZER_HASH) {
        closeBurgerCustomizer({ fromHistory: true });
    }
}

function onDocumentKeydown(event) {
    if (event.key === "Escape") {
        if (!burgerCustomizerModal.hidden) {
            closeBurgerCustomizer();
        }
        if (!checkoutModal.hidden) {
            closeCheckout();
        }
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
        addItem(Number(button.dataset.id), button.dataset.type, button);
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
    renderBurgerOfMonth();
    renderBurgers();
    renderSimple(menu.extras, extrasList, "EXTRA", "extras-list");

    if (drinksList) {
        renderSimple(menu.drinks, drinksList, "DRINK", "drinks-list");
    }
    renderCart();
}

function renderBurgerOfMonth() {
    if (!burgerMonthList) return;

    burgerMonthList.innerHTML = menu.burgerOfMonth.map((item) => `
        <article class="item-card" style="border: 2px solid var(--yellow); padding: 15px; border-radius: 8px; background: rgba(255, 209, 59, 0.05);">
            <div class="item-img" style="background-image: url('${resolveAssetPath(item.image || DEFAULT_ITEM_IMAGE)}')" aria-hidden="true"></div>
            <div class="item-details">
                <span style="background: var(--yellow); color: var(--red); padding: 2px 8px; font-weight: 800; font-size: 0.75rem; border-radius: 4px; text-transform: uppercase;">Estrella del Mes</span>
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
                <div class="price-tag">${formatMoney(item.price)}</div>
            </div>
            <button class="btn-add" type="button" data-action="add-burger" data-id="${item.id}" aria-label="Personalizar y agregar ${item.name}">ANADIR</button>
        </article>
    `).join("");
}

function renderBurgers() {
    const triplePrice = formatMoney(CONFIG_PRICES.modifiers.triple);
    const extraModifierPrice = formatMoney(CONFIG_PRICES.modifiers.cheddar);
    const burgersHeader = `
        <div style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px; border-left: 4px solid var(--red);">
            <p style="margin: 0; font-size: 0.9rem; font-weight: 600; color: #333;">
                ✅ <strong>Todas las burgers vienen con papas incluidas</strong>
            </p>
            <p style="margin: 6px 0 0 0; font-size: 0.85rem; color: #666;">
                💡 Opciones disponibles en todas:
            </p>
            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #666; margin-left: 16px;">
                🌱 <strong>NotCo</strong> (veggie) • <strong>Triple</strong> (+${triplePrice}) • <strong>+ Cheddar, Panceta o Huevo</strong> (+${extraModifierPrice} c/u)
            </p>
        </div>
    `;

    burgersList.innerHTML = burgersHeader + menu.burgers.map((item) => {
        const isOutOfStock = item.inStock === false;
        const cardClass = isOutOfStock ? "item-card is-out-of-stock" : "item-card";
        const stockBadge = isOutOfStock ? '<span class="stock-badge" aria-label="Sin stock">SIN STOCK</span>' : "";
        const buttonLabel = isOutOfStock ? "SIN STOCK" : "ANADIR";

        return `
        <article class="${cardClass}">
            <div class="item-img" style="background-image: url('${resolveAssetPath(item.image || DEFAULT_ITEM_IMAGE)}')" aria-hidden="true"></div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
                ${stockBadge}
                <div class="price-tag">${formatMoney(item.price)}</div>
            </div>
            <button class="btn-add" type="button" data-action="add-burger" data-id="${item.id}" aria-label="Personalizar y agregar ${item.name}" ${isOutOfStock ? "disabled" : ""}>${buttonLabel}</button>
        </article>
    `;
    }).join("");
}

function renderSimple(list, container, label, type) {
    container.innerHTML = list.map((item) => {
        const imgStyle = item.image ? ` style="background-image: url('${resolveAssetPath(item.image)}')"` : "";
        const isOutOfStock = item.inStock === false;
        const cardClass = isOutOfStock ? "item-card is-out-of-stock" : "item-card";
        const stockBadge = isOutOfStock ? '<span class="stock-badge" aria-label="Sin stock">SIN STOCK</span>' : "";
        const buttonLabel = isOutOfStock ? "SIN STOCK" : "ANADIR";
        return `
        <article class="${cardClass}">
            <div class="item-img"${imgStyle} aria-hidden="true"></div>
            <div class="item-details">
                <h3>${item.name}</h3>
                ${item.desc ? `<p>${item.desc}</p>` : ""}
                ${stockBadge}
                <div class="price-tag">${formatMoney(item.price)}</div>
            </div>
            <button class="btn-add" type="button" data-action="add-item" data-id="${item.id}" data-type="${type}" aria-label="Anadir ${item.name}" ${isOutOfStock ? "disabled" : ""}>${buttonLabel}</button>
        </article>
    `;
    }).join("");
}

function renderCart() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Todavia no agregaste productos.</p>';
    } else {
        cartItems.innerHTML = cart.map((item) => {
            const subtotal = item.unitPrice * item.qty;
            const imageSrc = resolveAssetPath(item.image || DEFAULT_ITEM_IMAGE);
            return `
                <div class="cart-row">
                    <div class="cart-item-main">
                        <div class="cart-item-thumb" aria-hidden="true">
                            <img class="cart-item-thumb-img" src="${imageSrc}" alt="" loading="lazy" decoding="async">
                        </div>
                        <div class="cart-item-name">${item.name}</div>
                    </div>
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
    // Buscamos en ambas listas para soporte de Burger del Mes
    const allBurgers = [...menu.burgerOfMonth, ...menu.burgers];
    const baseItem = allBurgers.find((burger) => burger.id === id);
    if (!baseItem) return;

    if (baseItem.inStock === false) {
        showFeedback(`${baseItem.name} sin stock`);
        return;
    }

    currentBurgerToCustomize = baseItem;

    BURGER_MODIFIER_ORDER.forEach((modifierKey) => {
        const checkbox = getModifierCheckbox(modifierKey);
        if (checkbox) checkbox.checked = false;
    });

    refreshCustomizerOptionLabels();

    burgerCustomizerInfo.innerHTML = `
        <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: var(--red); font-size: 1.2rem;">${baseItem.name}</h3>
            <p style="margin: 0; color: #666; font-size: 0.9rem;">${baseItem.desc}</p>
        </div>
    `;

    updateCustomizerPrice();
    openBurgerCustomizer();
}

function updateCustomizerPrice() {
    if (!currentBurgerToCustomize) return;

    const selectedModifiers = getSelectedBurgerModifiers();
    const price = calculateCustomizedBurgerPrice(currentBurgerToCustomize.price, selectedModifiers);

    burgerCustomizerPrice.textContent = `Precio: ${formatMoney(price)}`;
}

function confirmBurgerCustomizer() {
    if (!currentBurgerToCustomize) return;

    const modifiers = getSelectedBurgerModifiers();
    const finalPrice = calculateCustomizedBurgerPrice(currentBurgerToCustomize.price, modifiers);
    const displayName = buildCustomizedBurgerName(currentBurgerToCustomize.name, modifiers);

    addToCart({
        key: createCartKey(currentBurgerToCustomize.id, modifiers),
        name: displayName,
        unitPrice: finalPrice,
        image: currentBurgerToCustomize.image
    });

    provideAddButtonFeedback(confirmBurgerCustomizerBtn, {
        temporaryText: "AGREGADA ✅",
        duration: 700
    }).then(() => {
        closeBurgerCustomizer();
    });
}

function openBurgerCustomizer() {
    resetButtonFeedbackState(confirmBurgerCustomizerBtn);

    if (window.location.hash !== BURGER_CUSTOMIZER_HASH) {
        window.history.pushState({ chesterOverlay: "burger-customizer" }, "", `${getLocationWithoutHash()}${BURGER_CUSTOMIZER_HASH}`);
    }

    burgerCustomizerModal.removeAttribute("hidden");
    syncBodyScrollLock();
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            burgerCustomizerModal.classList.add("is-open");
        });
    });
}

function closeBurgerCustomizer(options = {}) {
    const { fromHistory = false } = options;

    if (!fromHistory && window.location.hash === BURGER_CUSTOMIZER_HASH) {
        const customizerState = window.history.state && window.history.state.chesterOverlay === "burger-customizer";
        if (customizerState) {
            window.history.back();
            return;
        }

        window.history.replaceState(window.history.state, "", getLocationWithoutHash());
    }

    burgerCustomizerModal.classList.remove("is-open");
    setTimeout(() => {
        burgerCustomizerModal.setAttribute("hidden", "");
        syncBodyScrollLock();
    }, 300);
    currentBurgerToCustomize = null;
}

function onBurgerCustomizerBackdropClick(event) {
    if (event.target === burgerCustomizerModal) {
        closeBurgerCustomizer();
    }
}

function addItem(id, type, button) {
    const source = type === "extras-list" ? menu.extras : menu.drinks;
    const item = source.find((current) => current.id === id);
    if (!item) return;

    if (item.inStock === false) {
        showFeedback(`${item.name} sin stock`);
        return;
    }

    addToCart({
        key: createCartKey(item.id, []),
        name: item.name,
        unitPrice: item.price,
        image: item.image
    });

    provideAddButtonFeedback(button, {
        temporaryText: "LISTO ✅",
        duration: 650
    });
}

function provideAddButtonFeedback(button, options = {}) {
    if (!button || button.disabled) return Promise.resolve();

    const {
        temporaryText = "LISTO ✅",
        duration = 650
    } = options;

    const originalText = button.dataset.originalText || button.textContent;
    button.dataset.originalText = originalText;
    button.textContent = temporaryText;
    button.classList.add("is-confirmed");
    button.disabled = true;

    clearTimeout(button._feedbackTimeoutId);
    return new Promise((resolve) => {
        button._feedbackTimeoutId = setTimeout(() => {
            resetButtonFeedbackState(button);
            resolve();
        }, duration);
    });
}

function resetButtonFeedbackState(button) {
    if (!button) return;

    clearTimeout(button._feedbackTimeoutId);
    if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
    }
    button.classList.remove("is-confirmed");
    button.disabled = false;
}

function addToCart({ key, name, unitPrice, image = "" }) {
    const existingItem = cart.find((item) => item.key === key);
    const safeImage = image || getItemImageFromKey(key) || DEFAULT_ITEM_IMAGE;

    if (existingItem) {
        existingItem.qty += 1;
        if (!existingItem.image) {
            existingItem.image = safeImage;
        }
    } else {
        cart.push({ key, name, unitPrice, qty: 1, image: safeImage });
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
    const summary = calculateOrderSummary();

    subtotalPrice.textContent = formatMoney(summary.subtotal);
    shippingPrice.textContent = formatMoney(summary.shipping);
    grandTotalPrice.textContent = formatMoney(summary.total);
    checkoutDetailSubtotal.textContent = formatMoney(summary.subtotal);

    if (summary.discount > 0) {
        discountLabel.textContent = `Descuento (${summary.discountReason})`;
        discountPrice.textContent = `- ${formatMoney(summary.discount)}`;
        discountRow.hidden = false;
    } else {
        discountLabel.textContent = "Descuento";
        discountPrice.textContent = formatMoney(0);
        discountRow.hidden = true;
    }

    totalPrice.textContent = formatMoney(summary.total);
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

function getDiscountInfo(subtotal, zoneCode, paymentMethod) {
    if (subtotal <= 0) {
        return { amount: 0, reason: "" };
    }

    if (zoneCode === "retiro") {
        return {
            amount: Math.round(subtotal * DISCOUNT_PERCENTAGE),
            reason: "10% por take away"
        };
    }

    if (paymentMethod === "efectivo") {
        return {
            amount: Math.round(subtotal * DISCOUNT_PERCENTAGE),
            reason: "10% por efectivo"
        };
    }

    return { amount: 0, reason: "" };
}

function calculateOrderSummary() {
    const subtotal = getCartSubtotal();
    const zoneCode = deliveryZoneSelect.value;
    const shipping = getShippingCost();
    const paymentMethod = paymentMethodSelect.value;
    const discountInfo = getDiscountInfo(subtotal, zoneCode, paymentMethod);
    const total = Math.max(0, subtotal + shipping - discountInfo.amount);

    return {
        subtotal,
        shipping,
        discount: discountInfo.amount,
        discountReason: discountInfo.reason,
        paymentMethod,
        total
    };
}

function getCartSubtotal() {
    return cart.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
}

function getCartItemCount() {
    return cart.reduce((acc, item) => acc + item.qty, 0);
}

function createCartKey(baseId, modifiers) {
    const normalizedModifiers = [...modifiers].filter(Boolean).sort();
    return `${baseId}-${normalizedModifiers.join("-") || "base"}`;
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
    const summary = calculateOrderSummary();
    const isPickup = zoneCode === "retiro";
    const streetNumber = customerStreetNumberInput.value.trim();
    const neighborhood = customerNeighborhoodSelect.value;
    const betweenStreets = customerBetweenStreetsInput.value.trim();
    const notes = customerNotesInput.value.trim();
    const orderAddress = isPickup
        ? PICKUP_ADDRESS
        : formatDeliveryAddress(streetNumber, neighborhood, betweenStreets);

    const lines = [
        "NUEVO PEDIDO - CHESTER BURGER",
        "",
        `Cliente: ${customerNameInput.value.trim()}`,
        `${isPickup ? "Take away en" : "Direccion"}: ${orderAddress}`,
        `Zona: ${zoneData.label}`,
        `Metodo de pago: ${formatPaymentMethod(summary.paymentMethod)}`,
        ""
    ];

    if (notes) {
        lines.splice(lines.length - 1, 0, `Aclaraciones: ${notes}`);
    }

    cart.forEach((item) => {
        const itemSubtotal = item.unitPrice * item.qty;
        lines.push(`- ${item.qty} x ${item.name} (${formatMoney(item.unitPrice)}) = ${formatMoney(itemSubtotal)}`);
    });

    lines.push(
        "",
        `SUBTOTAL: ${formatMoney(summary.subtotal)}`,
        `ENVIO: ${formatMoney(summary.shipping)}`
    );

    if (summary.discount > 0) {
        lines.push(`DESCUENTO (${summary.discountReason}): - ${formatMoney(summary.discount)}`);
    }

    lines.push(`TOTAL FINAL: ${formatMoney(summary.total)}`);

    const encodedMessage = encodeURIComponent(lines.join("\n"));
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
    closeCheckout();
    window.open(whatsappUrl, "_blank", "noopener");
    cart = [];
    persistAndRefresh("Pedido enviado. Carrito vaciado");
}

function openCheckout() {
    if (cart.length === 0) {
        showFeedback("El carrito esta vacio");
        return;
    }

    closeCartDrawer();
    updateTotals();
    checkoutModal.removeAttribute("hidden");
    syncBodyScrollLock();
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
        syncBodyScrollLock();
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
    clearCheckoutErrors();

    const name = customerNameInput.value.trim();
    const streetNumber = customerStreetNumberInput.value.trim();
    const neighborhood = customerNeighborhoodSelect.value;
    const betweenStreets = customerBetweenStreetsInput.value.trim();
    const zone = deliveryZoneSelect.value;
    const paymentMethod = paymentMethodSelect.value;

    if (name.length < 2) {
        markFieldInvalid(customerNameInput);
        showFeedback("Ingresa tu nombre para continuar");
        customerNameInput.focus();
        return false;
    }

    if (!zone || !SHIPPING_ZONES[zone]) {
        markFieldInvalid(deliveryZoneSelect);
        showFeedback("Selecciona tu zona para calcular envio");
        deliveryZoneSelect.focus();
        return false;
    }

    if (!paymentMethod || !PAYMENT_METHOD_LABELS[paymentMethod]) {
        markFieldInvalid(paymentMethodSelect);
        showFeedback("Selecciona un metodo de pago para continuar");
        paymentMethodSelect.focus();
        return false;
    }

    if (zone === "retiro") {
        return true;
    }

    if (!STREET_AND_NUMBER_REGEX.test(streetNumber)) {
        markFieldInvalid(customerStreetNumberInput);
        showFeedback("Ingresa una direccion valida (calle y numero)");
        customerStreetNumberInput.focus();
        return false;
    }

    if (!neighborhood) {
        markFieldInvalid(customerNeighborhoodSelect);
        showFeedback("Selecciona un barrio para continuar");
        customerNeighborhoodSelect.focus();
        return false;
    }

    if (betweenStreets.length < 3) {
        markFieldInvalid(customerBetweenStreetsInput);
        showFeedback("Ingresa las entre calles para continuar");
        customerBetweenStreetsInput.focus();
        return false;
    }

    return true;
}

function getCheckoutFields() {
    return [
        customerNameInput,
        deliveryZoneSelect,
        paymentMethodSelect,
        customerStreetNumberInput,
        customerNeighborhoodSelect,
        customerBetweenStreetsInput,
        customerNotesInput
    ];
}

function markFieldInvalid(field) {
    if (!field) return;
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
}

function clearFieldError(field) {
    if (!field) return;
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
}

function clearCheckoutErrors() {
    getCheckoutFields().forEach(clearFieldError);
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

        return parsed
            .filter((item) => {
                return item
                    && typeof item.key === "string"
                    && typeof item.name === "string"
                    && Number.isFinite(item.unitPrice)
                    && Number.isFinite(item.qty)
                    && (item.image === undefined || typeof item.image === "string")
                    && item.qty > 0;
            })
            .map((item) => ({
                ...item,
                image: item.image || getItemImageFromKey(item.key) || DEFAULT_ITEM_IMAGE
            }));
    } catch (error) {
        return [];
    }
}

function getItemImageFromKey(key) {
    const baseId = Number(String(key).split("-")[0]);
    if (!Number.isFinite(baseId)) return "";

    const allItems = [...menu.burgerOfMonth, ...menu.burgers, ...menu.extras, ...menu.drinks];
    const matched = allItems.find((item) => item.id === baseId);
    return matched?.image || "";
}

function resolveAssetPath(assetPath) {
    if (!assetPath) return "";

    if (/^(https?:)?\/\//.test(assetPath) || assetPath.startsWith("data:")) {
        return assetPath;
    }

    if (typeof basePath === "string") {
        return `${basePath}${assetPath}`;
    }

    const currentPath = window.location.pathname;
    const currentDir = currentPath.slice(0, currentPath.lastIndexOf("/") + 1);
    return `${currentDir}${assetPath}`;
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
        notes: customerNotesInput.value.trim(),
        address: formatDeliveryAddress(streetNumber, neighborhood, betweenStreets),
        zone: deliveryZoneSelect.value,
        paymentMethod: paymentMethodSelect.value
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

        if (typeof data.notes === "string") {
            customerNotesInput.value = data.notes;
        }

        if (typeof data.zone === "string" && SHIPPING_ZONES[data.zone]) {
            deliveryZoneSelect.value = data.zone;
        }

        if (typeof data.paymentMethod === "string" && PAYMENT_METHOD_LABELS[data.paymentMethod]) {
            paymentMethodSelect.value = data.paymentMethod;
        }
    } catch (error) {
        return;
    }
}

function formatPaymentMethod(paymentMethod) {
    return PAYMENT_METHOD_LABELS[paymentMethod] || "Sin especificar";
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

    if (isPickup) {
        clearFieldError(customerStreetNumberInput);
        clearFieldError(customerNeighborhoodSelect);
        clearFieldError(customerBetweenStreetsInput);
    }
}

function getModifierCheckbox(modifierKey) {
    const modifierConfig = BURGER_MODIFIER_META[modifierKey];
    if (!modifierConfig) return null;
    return document.getElementById(modifierConfig.inputId);
}

function getSelectedBurgerModifiers() {
    return BURGER_MODIFIER_ORDER.filter((modifierKey) => {
        const checkbox = getModifierCheckbox(modifierKey);
        return checkbox?.checked;
    });
}

function calculateCustomizedBurgerPrice(basePrice, modifiers) {
    return modifiers.reduce((acc, modifierKey) => {
        return acc + (CONFIG_PRICES.modifiers[modifierKey] || 0);
    }, basePrice);
}

function buildCustomizedBurgerName(baseName, modifiers) {
    return modifiers.reduce((acc, modifierKey) => {
        const suffix = BURGER_MODIFIER_META[modifierKey]?.nameSuffix || "";
        return `${acc}${suffix}`;
    }, baseName);
}

function refreshCustomizerOptionLabels() {
    BURGER_MODIFIER_ORDER.forEach((modifierKey) => {
        const label = document.querySelector(`[data-modifier-label="${modifierKey}"]`);
        if (!label) return;

        const price = CONFIG_PRICES.modifiers[modifierKey] || 0;
        const baseLabel = BURGER_MODIFIER_META[modifierKey]?.displayLabel || modifierKey;
        label.textContent = price > 0
            ? `${baseLabel} (+${formatMoney(price)})`
            : baseLabel;
    });
}