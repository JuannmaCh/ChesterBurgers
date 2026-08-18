const LOCALE = "es-AR";
const CURRENCY = "ARS";
const CART_STORAGE_KEY = "chester-cart-v1";
const CUSTOMER_STORAGE_KEY = "chester-customer-v1";
const BURGER_CUSTOMIZER_HASH = "#burger-customizer";

let WHATSAPP_PHONE;
let PICKUP_ADDRESS;
let DEFAULT_ITEM_IMAGE;
let DISCOUNT_PERCENTAGE;
let CONFIG_PRICES;
let SHIPPING_ZONES;
let menu;
let promotions = [];

const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";

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

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0
});

let cart = [];

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

async function init() {
    try {
        const [menuData, configData, shippingData, promotionsData] = await Promise.all([
            fetch("data/menu.json?v=1.3.6").then(r => r.json()),
            fetch("data/config.json?v=1.3.5").then(r => r.json()),
            fetch("data/shipping.json?v=1.3.5").then(r => r.json()),
            fetch("data/promotions.json?v=1.3.5").then(r => r.json())
        ]);

        menu = menuData;
        promotions = promotionsData.promotions || [];
        WHATSAPP_PHONE = configData.whatsappPhone;
        PICKUP_ADDRESS = configData.pickupAddress;
        DEFAULT_ITEM_IMAGE = configData.defaultItemImage;
        DISCOUNT_PERCENTAGE = configData.discountPercentage;
        CONFIG_PRICES = { modifiers: configData.modifierPrices };
        SHIPPING_ZONES = shippingData;

        cart = loadCart();
        hydrateCustomerData();
        render();
        bindEvents();
        updateDailyPromoBanner();
        updateTotals();
        updateDeliveryModeUI();
        checkOpeningHours(configData.openingHours);
    } catch (err) {
        console.error("Error inicializando la app:", err);
    }
}

init();

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
    document.getElementById("customizer-combo-enable")?.addEventListener("change", onCustomizerComboChange);
    document.getElementById("customizer-combo-drink-options")?.addEventListener("change", updateCustomizerPrice);
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

function buildItemImageHTML(item) {
    const src = resolveAssetPath(item.image || DEFAULT_ITEM_IMAGE);
    const alt = `${item.name} - Chester Burger`;
    return `<div class="item-img"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></div>`;
}

function renderBurgerOfMonth() {
    if (!burgerMonthList) return;

    burgerMonthList.innerHTML = menu.burgerOfMonth.map((item) => `
        <article class="item-card" data-item-id="${item.id}" data-item-name="${item.name}" style="border: 2px solid var(--yellow); padding: 15px; border-radius: 8px; background: rgba(255, 209, 59, 0.05);">
            ${buildItemImageHTML(item)}
            <div class="item-details">
                <span style="background: var(--yellow); color: var(--red); padding: 2px 8px; font-weight: 800; font-size: 0.75rem; border-radius: 4px; text-transform: uppercase;">Estrella del Mes</span>
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
                ${getItemPriceHTML(item)}
            </div>
            <div class="cart-qty-badge-slot">${buildCartBadgeHTML(item.id, item.name)}</div>
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
                ✅ <strong>Todas las burgers vienen con papas fritas sazonadas incluidas</strong>
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
        <article class="${cardClass}" data-item-id="${item.id}" data-item-name="${item.name}">
            ${buildItemImageHTML(item)}
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
                ${stockBadge}
                ${getItemPriceHTML(item)}
            </div>
            <div class="cart-qty-badge-slot">${isOutOfStock ? "" : buildCartBadgeHTML(item.id, item.name)}</div>
            <button class="btn-add" type="button" data-action="add-burger" data-id="${item.id}" aria-label="Personalizar y agregar ${item.name}" ${isOutOfStock ? "disabled" : ""}>${buttonLabel}</button>
        </article>
    `;
    }).join("");
}

function renderSimple(list, container, label, type) {
    container.innerHTML = list.map((item) => {
        const isOutOfStock = item.inStock === false;
        const cardClass = isOutOfStock ? "item-card is-out-of-stock" : "item-card";
        const stockBadge = isOutOfStock ? '<span class="stock-badge" aria-label="Sin stock">SIN STOCK</span>' : "";
        const buttonLabel = isOutOfStock ? "SIN STOCK" : "ANADIR";
        return `
        <article class="${cardClass}" data-item-id="${item.id}" data-item-name="${item.name}">
            ${buildItemImageHTML(item)}
            <div class="item-details">
                <h3>${item.name}</h3>
                ${item.desc ? `<p>${item.desc}</p>` : ""}
                ${stockBadge}
                ${getItemPriceHTML(item)}
            </div>
            <div class="cart-qty-badge-slot">${isOutOfStock ? "" : buildCartBadgeHTML(item.id, item.name)}</div>
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
            const promoDisplay = getCartItemPromoDisplay(item);
            const originalSubtotal = item.unitPrice * item.qty;
            const discountedSubtotal = (item.unitPrice - promoDisplay.discountAmount) * item.qty;

            const subtotalHTML = promoDisplay.hasDiscount
                ? `<div style="text-decoration: line-through; color: #999; font-size: 0.8rem;">${formatMoney(originalSubtotal)}</div>
                   <div>${formatMoney(discountedSubtotal)} <span style="background: #1f7a2e; color: #fff; font-size: 0.65rem; padding: 2px 4px; border-radius: 4px; vertical-align: middle;">${promoDisplay.discountBadge}</span></div>`
                : `${formatMoney(originalSubtotal)}`;

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
                        <div class="cart-subtotal" style="text-align: right; display: flex; flex-direction: column; justify-content: center; align-items: flex-end; min-width: 80px;">${subtotalHTML}</div>
                    </div>
                </div>
            `;
        }).join("");
    }

    const dailyPromo = getDailyPromoInfo(cart);
    cartDrawerSubtotal.textContent = formatMoney(getCartSubtotal() - dailyPromo.amount);
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
    setupCustomizerComboSection();

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
    const normalPrice = calculateCustomizedBurgerPrice(currentBurgerToCustomize.price, selectedModifiers);

    if (isComboCustomizerSelected()) {
        const comboPromo = getActiveBundleCustomizerPromo();
        if (comboPromo) {
            const modifierCosts = normalPrice - currentBurgerToCustomize.price;
            const comboPrice = comboPromo.bundlePrice + modifierCosts;
            const drinkId = getSelectedComboDrinkId();
            const drink = drinkId ? menu.drinks.find((d) => d.id === drinkId) : null;
            const drinkLabel = drink ? ` + ${drink.name}` : "";
            const extrasNote = modifierCosts > 0
                ? `<span style="display: block; font-size: 0.85rem; font-weight: 600; color: #666; margin-top: 4px;">Incluye personalización (+${formatMoney(modifierCosts)})</span>`
                : "";

            burgerCustomizerPrice.innerHTML = `Combo${drinkLabel}: <span>${formatMoney(comboPrice)}</span>${extrasNote}`;
            return;
        }
    }

    const promoDisplay = getCustomizerPromoDisplay(currentBurgerToCustomize, normalPrice);

    if (promoDisplay.hasDiscount) {
        burgerCustomizerPrice.innerHTML = `Precio: <span style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-right: 8px;">${formatMoney(normalPrice)}</span>
            <span>${formatMoney(promoDisplay.discountedPrice)}</span>
            <span style="background: #1f7a2e; color: #fff; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; margin-left: 8px; vertical-align: middle; display: inline-block;">${promoDisplay.discountBadge}</span>`;
    } else {
        burgerCustomizerPrice.innerHTML = `Precio: <span>${formatMoney(normalPrice)}</span>`;
    }
}

function confirmBurgerCustomizer() {
    if (!currentBurgerToCustomize) return;

    const modifiers = getSelectedBurgerModifiers();
    const modifierNames = modifiers.map(key => BURGER_MODIFIER_META[key]?.displayLabel || key).join(', ');
    gtag('event', 'customize_burger', {
        modifiers: modifierNames
    });

    if (isComboCustomizerSelected()) {
        const comboPromo = getActiveBundleCustomizerPromo();
        const drinkId = getSelectedComboDrinkId();
        if (!comboPromo) {
            showFeedback("La promo de combo no está disponible");
            return;
        }
        if (!drinkId) {
            showFeedback("Elegí una gaseosa para el combo");
            return;
        }

        const drink = menu.drinks.find((d) => d.id === drinkId);
        if (!drink) {
            showFeedback("Gaseosa no disponible");
            return;
        }

        const normalPrice = calculateCustomizedBurgerPrice(currentBurgerToCustomize.price, modifiers);
        const modifierCosts = normalPrice - currentBurgerToCustomize.price;
        const comboPrice = comboPromo.bundlePrice + modifierCosts;
        const burgerName = buildCustomizedBurgerName(currentBurgerToCustomize.name, modifiers);
        const displayName = `${burgerName} + ${drink.name} — ${comboPromo.reason}`;

        addToCart({
            key: createComboCartKey(currentBurgerToCustomize.id, modifiers, drinkId),
            name: displayName,
            unitPrice: comboPrice,
            image: currentBurgerToCustomize.image,
            combo: { promoId: comboPromo.id, drinkId }
        });
    } else {
        const finalPrice = calculateCustomizedBurgerPrice(currentBurgerToCustomize.price, modifiers);
        const displayName = buildCustomizedBurgerName(currentBurgerToCustomize.name, modifiers);

        addToCart({
            key: createCartKey(currentBurgerToCustomize.id, modifiers),
            name: displayName,
            unitPrice: finalPrice,
            image: currentBurgerToCustomize.image
        });
    }

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
    resetCustomizerComboSection();
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

function addToCart({ key, name, unitPrice, image = "", combo = null }) {
    gtag('event', 'add_to_cart', {
        currency: 'ARS',
        value: unitPrice,
        items: [
            {
                item_name: name,
                price: unitPrice
            }
        ]
    });

    const existingItem = cart.find((item) => item.key === key);
    const safeImage = image || getItemImageFromKey(key) || DEFAULT_ITEM_IMAGE;

    if (existingItem) {
        existingItem.qty += 1;
        if (!existingItem.image) {
            existingItem.image = safeImage;
        }
    } else {
        const cartItem = { key, name, unitPrice, qty: 1, image: safeImage };
        if (combo) {
            cartItem.combo = combo;
        }
        cart.push(cartItem);
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
    const item = cart.find((current) => current.key === key);
    if (item) {
        gtag('event', 'remove_from_cart', {
            currency: 'ARS',
            value: item.unitPrice * item.qty,
            items: [
                {
                    item_name: item.name,
                    price: item.unitPrice,
                    quantity: item.qty
                }
            ]
        });
    }

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
    renderMenuBadges();
    announce(statusMessage);
    showFeedback(statusMessage);
}

function renderMenuBadges() {
    document.querySelectorAll(".item-card[data-item-id]").forEach((card) => {
        const id = Number(card.dataset.itemId);
        const baseName = card.dataset.itemName || "";
        const badgeSlot = card.querySelector(".cart-qty-badge-slot");
        if (badgeSlot) {
            badgeSlot.innerHTML = buildCartBadgeHTML(id, baseName);
        }
    });
}

function getCartEntriesForItem(id) {
    return cart.filter((entry) => Number(String(entry.key).split("-")[0]) === id);
}

function buildCartBadgeHTML(id, baseName) {
    const entries = getCartEntriesForItem(id);
    const total = entries.reduce((sum, e) => sum + e.qty, 0);
    if (total === 0) return "";

    const hasVariants = entries.length > 1 || entries.some((e) => !e.key.endsWith("-base"));
    let detailHTML = "";

    if (hasVariants) {
        detailHTML = `<div class="cart-badge-detail">${
            entries.map((e) => {
                const mod = e.name.slice(baseName.length).trim();
                const label = mod ? `${e.qty}× ${mod}` : `${e.qty}× original`;
                return `<span class="cart-badge-line">${label}</span>`;
            }).join("")
        }</div>`;
    }

    return `<div class="cart-qty-badge" aria-label="${total} en el carrito">
        <span class="cart-badge-count">+${total}</span>
        ${detailHTML}
    </div>`;
}

function updateTotals() {
    const summary = calculateOrderSummary();

    subtotalPrice.textContent = formatMoney(summary.subtotal);

    // Mostrar "A confirmar" en lugar de precio de envío
    const isPickup = deliveryZoneSelect.value === "retiro";
    if (deliveryZoneSelect.value === "delivery") {
        shippingPrice.textContent = "A confirmar por el local";
    } else if (isPickup) {
        shippingPrice.textContent = formatMoney(0);
    } else {
        shippingPrice.textContent = "Selecciona tipo de envío";
    }

    grandTotalPrice.textContent = formatMoney(summary.total);


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

    renderCheckoutDetail(summary.freeItems);
}

function renderCheckoutDetail(freeItems = []) {
    if (cart.length === 0) {
        checkoutDetailList.innerHTML = '<div class="checkout-detail-item">No hay productos en el pedido.</div>';
        return;
    }

    let detailHTML = cart.map((item) => {
        const itemSubtotal = item.unitPrice * item.qty;
        return `<div class="checkout-detail-item">${item.qty} x ${item.name} - ${formatMoney(itemSubtotal)}</div>`;
    }).join("");
    
    if (freeItems && freeItems.length > 0) {
        detailHTML += freeItems.map(fi => `<div class="checkout-detail-item" style="color: #1f7a2e; font-weight: bold; margin-top: 4px;">🎁 ${fi} - ¡GRATIS!</div>`).join("");
    }
    
    checkoutDetailList.innerHTML = detailHTML;
}

function getShippingCost() {
    const zone = deliveryZoneSelect.value;
    if (!zone || !SHIPPING_ZONES[zone]) return 0;
    return SHIPPING_ZONES[zone].price;
}

function getArgentinaDate() {
    const now = new Date();
    const dateString = new Intl.DateTimeFormat("en-CA", { timeZone: ARGENTINA_TZ }).format(now);
    const dayIndex = new Date(now.toLocaleString("en-US", { timeZone: ARGENTINA_TZ })).getDay();
    return { dayIndex, dateString };
}

function getActivePromotions() {
    const { dayIndex, dateString } = getArgentinaDate();
    return promotions.filter((promo) => {
        if (promo.active === false) return false;
        if (promo.dates && promo.dates.length) {
            return promo.dates.includes(dateString);
        }
        if (promo.days && promo.days.length) {
            return promo.days.includes(dayIndex);
        }
        return false;
    });
}

function getActiveBundleCustomizerPromo() {
    return getActivePromotions().find((promo) => (
        promo.type === "bundle_fixed_price" && promo.customizerOffer
    ));
}

function resetCustomizerComboSection() {
    const section = document.getElementById("customizer-combo-section");
    const enable = document.getElementById("customizer-combo-enable");
    const drinks = document.getElementById("customizer-combo-drinks");
    const options = document.getElementById("customizer-combo-drink-options");

    if (section) section.hidden = true;
    if (enable) enable.checked = false;
    if (drinks) drinks.hidden = true;
    if (options) options.innerHTML = "";
}

function setupCustomizerComboSection() {
    const promo = getActiveBundleCustomizerPromo();
    const section = document.getElementById("customizer-combo-section");

    if (!section || !promo) {
        resetCustomizerComboSection();
        return;
    }

    resetCustomizerComboSection();
    section.hidden = false;

    const label = document.getElementById("customizer-combo-label");
    if (label) {
        label.textContent = promo.customizerLabel || `Combo — ${formatMoney(promo.bundlePrice)}`;
    }

    const optionsContainer = document.getElementById("customizer-combo-drink-options");
    if (!optionsContainer) return;

    optionsContainer.innerHTML = promo.drinkIds.map((drinkId) => {
        const drink = menu.drinks.find((d) => d.id === drinkId);
        if (!drink) return "";

        return `
            <label class="customizer-combo-drink-option">
                <input type="radio" name="customizer-combo-drink" value="${drinkId}">
                <span>${drink.name}</span>
            </label>
        `;
    }).join("");
}

function isComboCustomizerSelected() {
    return document.getElementById("customizer-combo-enable")?.checked ?? false;
}

function getSelectedComboDrinkId() {
    const selected = document.querySelector('input[name="customizer-combo-drink"]:checked');
    return selected ? Number(selected.value) : null;
}

function onCustomizerComboChange() {
    const drinks = document.getElementById("customizer-combo-drinks");
    if (drinks) {
        drinks.hidden = !isComboCustomizerSelected();
    }
    updateCustomizerPrice();
}

function getBaseItemById(id) {
    return menu.burgers.find((b) => b.id === id)
        || menu.burgerOfMonth.find((b) => b.id === id)
        || menu.extras.find((e) => e.id === id)
        || menu.drinks.find((d) => d.id === id);
}

function isBurgerId(id) {
    return menu.burgers.some((b) => b.id === id) || menu.burgerOfMonth.some((b) => b.id === id);
}

function getCartBaseId(cartItem) {
    return Number(String(cartItem.key).split("-")[0]);
}

function getPercentOffForItem(item, activePromos) {
    if (!item || item.id == null) return null;

    const percentPromos = activePromos.filter((promo) => promo.type === "percent_off");
    let best = null;

    for (const promo of percentPromos) {
        if (!promo.itemIds.includes(item.id)) continue;

        const discountAmount = promo.basePriceOnly
            ? Math.round(item.price * promo.percent / 100)
            : Math.round(item.price * promo.percent / 100);

        if (!best || discountAmount > best.discountAmount) {
            best = {
                discountAmount,
                badge: `${promo.percent}% OFF`,
                reason: promo.reason
            };
        }
    }

    return best;
}

function getItemPromoDisplay(item) {
    const percentOff = getPercentOffForItem(item, getActivePromotions());
    if (percentOff) {
        return {
            hasDiscount: true,
            discountedPrice: item.price - percentOff.discountAmount,
            discountBadge: percentOff.badge,
            discountAmount: percentOff.discountAmount
        };
    }

    return {
        hasDiscount: false,
        discountedPrice: item.price,
        discountBadge: "",
        discountAmount: 0
    };
}

function getCustomizerPromoDisplay(baseItem, normalPrice) {
    const percentOff = getPercentOffForItem(baseItem, getActivePromotions());
    if (percentOff) {
        return {
            hasDiscount: true,
            discountedPrice: normalPrice - percentOff.discountAmount,
            discountBadge: percentOff.badge
        };
    }

    return {
        hasDiscount: false,
        discountedPrice: normalPrice,
        discountBadge: ""
    };
}

function getCartItemPromoDisplay(cartItem) {
    if (cartItem.combo) {
        return { hasDiscount: false, discountAmount: 0, discountBadge: "" };
    }

    const baseId = getCartBaseId(cartItem);
    const baseItem = getBaseItemById(baseId);
    if (!baseItem) {
        return { hasDiscount: false, discountAmount: 0, discountBadge: "" };
    }

    const percentOff = getPercentOffForItem(baseItem, getActivePromotions());
    if (percentOff) {
        return {
            hasDiscount: true,
            discountAmount: percentOff.discountAmount,
            discountBadge: percentOff.badge
        };
    }

    return { hasDiscount: false, discountAmount: 0, discountBadge: "" };
}

function computePercentOffTotal(cartItems, activePromos, excludedBurgerQty = null) {
    let amount = 0;
    const reasons = [];
    let coveredSubtotal = 0;
    const percentPromos = activePromos.filter((promo) => promo.type === "percent_off");

    cartItems.forEach((item) => {
        if (item.combo) return;

        const baseId = getCartBaseId(item);
        const baseItem = getBaseItemById(baseId);
        if (!baseItem) return;

        const excluded = excludedBurgerQty?.get(item.key) || 0;
        const eligibleQty = item.qty - excluded;
        if (eligibleQty <= 0) return;

        for (const promo of percentPromos) {
            if (!promo.itemIds.includes(baseId)) continue;

            const discountPerUnit = promo.basePriceOnly
                ? Math.round(baseItem.price * promo.percent / 100)
                : Math.round(item.unitPrice * promo.percent / 100);

            amount += discountPerUnit * eligibleQty;
            coveredSubtotal += item.unitPrice * eligibleQty;
            if (promo.reason && !reasons.includes(promo.reason)) {
                reasons.push(promo.reason);
            }
            break;
        }
    });

    return { amount, reasons, coveredSubtotal };
}

function computeBundleTotal(cartItems, activePromos) {
    const bundlePromos = activePromos.filter((promo) => promo.type === "bundle_fixed_price");
    if (!bundlePromos.length) {
        return { amount: 0, reasons: [], pairedBurgerQty: new Map() };
    }

    const promo = bundlePromos[0];
    const drinkIds = new Set(promo.drinkIds);
    const burgerIdsAny = promo.burgerIds === "any";
    const burgers = [];
    const drinks = [];

    cartItems.forEach((item) => {
        if (item.combo) return;

        const baseId = getCartBaseId(item);
        const baseItem = getBaseItemById(baseId);

        for (let i = 0; i < item.qty; i++) {
            if (isBurgerId(baseId) && (burgerIdsAny || promo.burgerIds.includes(baseId))) {
                burgers.push({
                    key: item.key,
                    basePrice: baseItem?.price || 0
                });
            } else if (drinkIds.has(baseId)) {
                drinks.push({
                    drinkPrice: baseItem?.price || item.unitPrice
                });
            }
        }
    });

    let amount = 0;
    const pairedBurgerQty = new Map();

    while (burgers.length && drinks.length) {
        const burger = burgers.shift();
        const drink = drinks.shift();
        const discount = burger.basePrice + drink.drinkPrice - promo.bundlePrice;
        if (discount > 0) {
            amount += discount;
            pairedBurgerQty.set(burger.key, (pairedBurgerQty.get(burger.key) || 0) + 1);
        }
    }

    return {
        amount,
        reasons: amount > 0 && promo.reason ? [promo.reason] : [],
        pairedBurgerQty
    };
}

function getCartPromoDiscount(cartItems) {
    const activePromos = getActivePromotions();
    if (!activePromos.length) {
        return { amount: 0, reason: "", freeItems: [], coveredSubtotal: 0 };
    }

    const bundleResult = computeBundleTotal(cartItems, activePromos);
    const percentWithBundle = computePercentOffTotal(cartItems, activePromos, bundleResult.pairedBurgerQty);
    const percentOnly = computePercentOffTotal(cartItems, activePromos, null);

    const hybridAmount = bundleResult.amount + percentWithBundle.amount;
    const percentOnlyAmount = percentOnly.amount;
    const bundleOnlyAmount = bundleResult.amount;

    let amount;
    let reason;
    let coveredSubtotal;

    if (hybridAmount >= percentOnlyAmount && hybridAmount >= bundleOnlyAmount) {
        amount = hybridAmount;
        reason = [...bundleResult.reasons, ...percentWithBundle.reasons].filter(Boolean).join(" + ");
        coveredSubtotal = percentWithBundle.coveredSubtotal;
    } else if (percentOnlyAmount >= bundleOnlyAmount) {
        amount = percentOnlyAmount;
        reason = percentOnly.reasons.join(" + ");
        coveredSubtotal = percentOnly.coveredSubtotal;
    } else {
        amount = bundleOnlyAmount;
        reason = bundleResult.reasons.join(" + ");
        coveredSubtotal = 0;
    }

    return {
        amount: Math.round(amount),
        reason,
        freeItems: [],
        coveredSubtotal
    };
}

function getDailyPromoInfo(cartItems) {
    return getCartPromoDiscount(cartItems);
}

function updateDailyPromoBanner() {
    const banner = document.getElementById("daily-promo-banner");
    if (!banner) return;

    const activePromos = getActivePromotions();
    const datedPromos = activePromos.filter((promo) => promo.dates && promo.dates.length);
    const weeklyPromos = activePromos.filter((promo) => promo.days && promo.days.length && (!promo.dates || !promo.dates.length));
    const bannerPromos = datedPromos.length ? datedPromos : weeklyPromos;
    const bannerText = bannerPromos.map((promo) => promo.banner).filter(Boolean).join(" · ");

    if (!bannerText) {
        banner.hidden = true;
        return;
    }

    banner.textContent = bannerText;
    banner.hidden = false;
}

function getDiscountInfo() {
    return { amount: 0, reason: "" };
}

function calculateOrderSummary() {
    const subtotal = getCartSubtotal();
    const shipping = getShippingCost();
    const paymentMethod = paymentMethodSelect.value;
    
    const dailyPromo = getDailyPromoInfo(cart);

    // Acumula descuentos (diarios + otros si aplica)
    const subtotalForBaseDiscount = Math.max(0, subtotal - (dailyPromo.coveredSubtotal || 0));
    const baseDiscountInfo = getDiscountInfo();

    const totalDiscount = baseDiscountInfo.amount + dailyPromo.amount;
    let reasons = [];
    if (dailyPromo.reason) reasons.push(dailyPromo.reason);
    if (baseDiscountInfo.reason) reasons.push(baseDiscountInfo.reason);
    const combinedReason = reasons.join(" + ");

    const total = Math.max(0, subtotal + shipping - totalDiscount);

    return {
        subtotal,
        shipping,
        discount: totalDiscount,
        discountReason: combinedReason,
        paymentMethod,
        total,
        freeItems: dailyPromo.freeItems
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

function createComboCartKey(baseId, modifiers, drinkId) {
    return `${createCartKey(baseId, modifiers)}-combo-${drinkId}`;
}

function getItemPriceHTML(item) {
    const promoDisplay = getItemPromoDisplay(item);

    const priceContent = promoDisplay.hasDiscount
        ? `<span style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-right: 8px;">${formatMoney(item.price)}</span>
            <span>${formatMoney(promoDisplay.discountedPrice)}</span>
            <span style="background: #1f7a2e; color: #fff; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; margin-left: 8px; vertical-align: middle; display: inline-block;">${promoDisplay.discountBadge}</span>`
        : `<span>${formatMoney(item.price)}</span>`;

    return `<div class="price-tag">${priceContent}</div>`;
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

    const summary = calculateOrderSummary();
    const isPickup = deliveryZoneSelect.value === "retiro";
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

    if (summary.freeItems && summary.freeItems.length > 0) {
        summary.freeItems.forEach(fi => {
            lines.push(`- 🎁 ${fi} (¡GRATIS!)`);
        });
    }

    lines.push(
        "",
        `SUBTOTAL: ${formatMoney(summary.subtotal)}`,
        `ENVIO: A confirmar por el local`
    );

    if (summary.discount > 0) {
        lines.push(`DESCUENTO (${summary.discountReason}): - ${formatMoney(summary.discount)}`);
    }

    lines.push(`TOTAL FINAL: ${formatMoney(summary.total)}`);

    const encodedMessage = encodeURIComponent(lines.join("\n"));
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
    closeCheckout();

    gtag('event', 'purchase', {
        transaction_id: 'WPP_' + Date.now(),
        value: summary.total,
        currency: 'ARS'
    });

    window.open(whatsappUrl, "_blank", "noopener");
    cart = [];
    persistAndRefresh("Pedido enviado. Carrito vaciado");
}

function openCheckout() {
    if (cart.length === 0) {
        showFeedback("El carrito esta vacio");
        return;
    }

    if (orderBtn.dataset.closed === "true") {
        showFeedback("Estamos cerrados. Por favor, intenta más tarde.");
        return;
    }

    gtag('event', 'begin_checkout', {
        currency: 'ARS',
        value: getCartSubtotal()
    });

    closeCartDrawer();
    updateTotals();
    checkoutModal.removeAttribute("hidden");
    syncBodyScrollLock();
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            updateDeliveryModeUI();
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
    const paymentMethod = paymentMethodSelect.value;

    if (name.length < 2) {
        markFieldInvalid(customerNameInput);
        showFeedback("Ingresa tu nombre para continuar");
        customerNameInput.focus();
        gtag('event', 'checkout_error', { field: 'falta_nombre' });
        return false;
    }

    if (!paymentMethod || !PAYMENT_METHOD_LABELS[paymentMethod]) {
        markFieldInvalid(paymentMethodSelect);
        showFeedback("Selecciona un metodo de pago para continuar");
        paymentMethodSelect.focus();
        gtag('event', 'checkout_error', { field: 'falta_metodo_pago' });
        return false;
    }

    // Si es take away (retiro), no necesita dirección
    if (deliveryZoneSelect.value === "retiro") {
        gtag('event', 'add_shipping_info', { shipping_tier: deliveryZoneSelect.value });
        gtag('event', 'add_payment_info', { payment_type: paymentMethodSelect.value });
        return true;
    }

    // Si es delivery, requiere dirección válida
    if (!STREET_AND_NUMBER_REGEX.test(streetNumber)) {
        markFieldInvalid(customerStreetNumberInput);
        showFeedback("Ingresa una direccion valida (calle y numero)");
        customerStreetNumberInput.focus();
        gtag('event', 'checkout_error', { field: 'falta_direccion' });
        return false;
    }

    if (!neighborhood) {
        markFieldInvalid(customerNeighborhoodSelect);
        showFeedback("Selecciona un barrio para continuar");
        customerNeighborhoodSelect.focus();
        gtag('event', 'checkout_error', { field: 'falta_barrio' });
        return false;
    }

    if (betweenStreets.length < 3) {
        markFieldInvalid(customerBetweenStreetsInput);
        showFeedback("Ingresa las entre calles para continuar");
        customerBetweenStreetsInput.focus();
        gtag('event', 'checkout_error', { field: 'falta_entre_calles' });
        return false;
    }

    gtag('event', 'add_shipping_info', { shipping_tier: deliveryZoneSelect.value });
    gtag('event', 'add_payment_info', { payment_type: paymentMethodSelect.value });
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
    const hasZone = deliveryZoneSelect.value !== "";


    const zoneDependentFields = document.getElementById("checkout-zone-dependent");
    if (zoneDependentFields) {
        zoneDependentFields.hidden = !hasZone;
    }

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
function checkOpeningHours(openingHours) {
    if (!openingHours || !openingHours.schedule) return;

    const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const DAY_LABELS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

    function parseTime(str) {
        const [h, m] = str.split(":").map(Number);
        return h * 60 + m;
    }

    function getNowInArgentina() {
        const now = new Date();
        const argStr = now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" });
        const arg = new Date(argStr);
        return { dayIndex: arg.getDay(), totalMinutes: arg.getHours() * 60 + arg.getMinutes() };
    }

    function isOpenAt(schedule, dayIndex, totalMinutes) {
        const dayName = DAY_NAMES[dayIndex];
        const hours = schedule[dayName];
        if (!hours) return false;
        const open = parseTime(hours.open);
        let close = parseTime(hours.close);
        if (close === 0) close = 24 * 60;
        return totalMinutes >= open && totalMinutes < close;
    }

    function getNextOpenInfo(schedule, dayIndex, totalMinutes) {
        for (let i = 0; i <= 7; i++) {
            const d = (dayIndex + i) % 7;
            const dayName = DAY_NAMES[d];
            const hours = schedule[dayName];
            if (!hours) continue;
            const open = parseTime(hours.open);
            if (i === 0 && totalMinutes >= open) continue;
            return `${DAY_LABELS[d]} a las ${hours.open}`;
        }
        return null;
    }

    const { dayIndex, totalMinutes } = getNowInArgentina();
    const schedule = openingHours.schedule;
    const open = isOpenAt(schedule, dayIndex, totalMinutes);

    const banner = document.getElementById("closed-banner");
    const bannerText = document.getElementById("closed-banner-text");
    const orderBtn = document.getElementById("order-btn");

    if (!open) {
        const next = getNextOpenInfo(schedule, dayIndex, totalMinutes);
        bannerText.textContent = next
            ? `🔒 Estamos cerrados. Abrimos el ${next}.`
            : `🔒 Estamos cerrados por hoy.`;
        banner.style.display = "block";
        if (orderBtn) {
            orderBtn.dataset.closed = "true";
            orderBtn.setAttribute("aria-disabled", "true");
            orderBtn.title = "Estamos cerrados";
            orderBtn.dataset.nextOpen = next ? `Abrimos el ${next}` : "Cerrado por hoy";
        }
    }
}
