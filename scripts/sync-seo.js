#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://chesterburger.com.ar";

const DAY_MAP = {
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday"
};

const priceFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
});

function formatPrice(price) {
    return priceFormatter.format(price);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildOpeningHoursSpecification(schedule) {
    return Object.entries(schedule)
        .filter(([, hours]) => hours)
        .map(([day, hours]) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: DAY_MAP[day],
            opens: hours.open,
            closes: hours.close
        }));
}

function buildMenuItemSchema(item) {
    const schema = {
        "@type": "MenuItem",
        name: item.name,
        offers: {
            "@type": "Offer",
            price: String(item.price),
            priceCurrency: "ARS",
            availability: item.inStock === false
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock"
        }
    };

    if (item.desc) {
        schema.description = item.desc;
    }

    return schema;
}

function buildMenuSection(name, items) {
    if (!items?.length) return null;

    return {
        "@type": "MenuSection",
        name,
        hasMenuItem: items.map(buildMenuItemSchema)
    };
}

function buildMenuSchema(menu) {
    const sections = [
        buildMenuSection("Burger del Mes", menu.burgerOfMonth),
        buildMenuSection("Hamburguesas", menu.burgers),
        buildMenuSection("Extras", menu.extras),
        buildMenuSection("Bebidas", menu.drinks)
    ].filter(Boolean);

    return {
        "@context": "https://schema.org",
        "@type": "Menu",
        name: "Menú Chester Burger",
        url: `${SITE_URL}/`,
        hasMenuSection: sections
    };
}

function buildRestaurantSchema(config) {
    return {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: "Chester Burger",
        url: SITE_URL,
        image: `${SITE_URL}/assets/logo_chester.png`,
        telephone: `+${config.whatsappPhone}`,
        address: {
            "@type": "PostalAddress",
            streetAddress: "Chaco 150 esquina Maipu",
            addressLocality: "Don Bosco",
            addressRegion: "Buenos Aires",
            addressCountry: "AR"
        },
        servesCuisine: "Hamburguesas",
        priceRange: "$$",
        openingHoursSpecification: buildOpeningHoursSpecification(config.openingHours.schedule),
        hasMenu: `${SITE_URL}/`,
        acceptsReservations: false
    };
}

function buildNoscriptSection(title, items) {
    if (!items?.length) return "";

    const listItems = items.map((item) => {
        const desc = item.desc ? ` — ${escapeHtml(item.desc)}` : "";
        const stock = item.inStock === false ? " (sin stock)" : "";
        return `        <li><strong>${escapeHtml(item.name)}</strong>${desc} — ${formatPrice(item.price)}${stock}</li>`;
    }).join("\n");

    return `    <h2>${escapeHtml(title)}</h2>\n    <ul>\n${listItems}\n    </ul>`;
}

function buildNoscript(menu) {
    return `<noscript>
    <section class="seo-fallback">
        <h2>Menú Chester Burger</h2>
        <p>Pedí hamburguesas artesanales con delivery en Don Bosco, Quilmes, Avellaneda y zona sur. Take away en Chaco 150.</p>
${buildNoscriptSection("Burger del Mes", menu.burgerOfMonth)}
${buildNoscriptSection("Hamburguesas", menu.burgers)}
${buildNoscriptSection("Extras", menu.extras)}
${buildNoscriptSection("Bebidas", menu.drinks)}
    </section>
</noscript>`;
}

function buildSchemaBlock(menu, config) {
    const schemas = [buildRestaurantSchema(config), buildMenuSchema(menu)];
    return schemas
        .map((schema) => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`)
        .join("\n");
}

function replaceBlock(html, startMarker, endMarker, content) {
    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker);

    if (start === -1 || end === -1 || end < start) {
        throw new Error(`Markers not found: ${startMarker} / ${endMarker}`);
    }

    return html.slice(0, start + startMarker.length) + "\n" + content + "\n" + html.slice(end);
}

function main() {
    const menuPath = path.join(ROOT, "data", "menu.json");
    const configPath = path.join(ROOT, "data", "config.json");
    const indexPath = path.join(ROOT, "index.html");

    const menu = JSON.parse(fs.readFileSync(menuPath, "utf8"));
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    let indexHtml = fs.readFileSync(indexPath, "utf8");

    indexHtml = replaceBlock(
        indexHtml,
        "<!-- SEO:MENU_SCHEMA_START -->",
        "<!-- SEO:MENU_SCHEMA_END -->",
        buildSchemaBlock(menu, config)
    );

    indexHtml = replaceBlock(
        indexHtml,
        "<!-- SEO:NOSCRIPT_START -->",
        "<!-- SEO:NOSCRIPT_END -->",
        buildNoscript(menu)
    );

    fs.writeFileSync(indexPath, indexHtml, "utf8");
    console.log("SEO blocks updated in index.html");
}

main();
