# AGENTS.md — Chester Burger

Guía para agentes de IA que trabajan en este repositorio.

## Qué es este proyecto

Sistema de pedidos online para **Chester Burger** ([chesterburger.com.ar](https://chesterburger.com.ar)). El cliente elige productos, personaliza burgers, ve totales con envío y promos, y envía el pedido por WhatsApp. Hay un panel de cocina para imprimir tickets.

## Cómo correrlo

Requiere servidor HTTP (los JSON se cargan con `fetch`):

```bash
npx serve .
```

Luego abrir `http://localhost:3000` (o el puerto que indique `serve`).

## Mapa del repositorio

```
index.html              → App principal + SEO embebido
app.js                  → Toda la lógica de pedidos
styles.css              → Estilos
data/
  menu.json             → Productos y precios
  promotions.json       → Promociones (data-driven, sin tocar app.js)
  shipping.json         → Zonas de envío
  config.json           → WhatsApp, take away, modificadores, horarios
pages/creacion_ticket.html → Tickets de cocina
scripts/sync-seo.js     → Regenera noscript + JSON-LD en index.html
```

## Reglas de oro

1. **Datos en JSON, lógica en JS** — Menú, precios, promos y envío se editan en `/data`. No duplicar en código.
2. **Sin frameworks** — No agregar React, Vue, bundlers ni dependencias npm sin pedido explícito.
3. **No refactorizar por defecto** — `app.js` es un monolito intencional. Cambios mínimos y focalizados.
4. **Zona horaria Argentina** — Promos y horarios usan `America/Argentina/Buenos_Aires`.
5. **Cache busting obligatorio** — Tras cambios visibles para el cliente, bump `?v=` en `app.js` e `index.html`.

## Tareas frecuentes

### Agregar o editar una promo

1. Editar `data/promotions.json` (ver tipos `percent_off` y `bundle_fixed_price` en README)
2. Si el combo incluye bebidas, verificar `inStock: true` en `menu.json`
3. Bump de versión `?v=` en los 4 `fetch` de `app.js`

### Actualizar menú o precios

1. Editar `data/menu.json` y/o `data/config.json`
2. Correr `node scripts/sync-seo.js`
3. Bump de versión `?v=` en `app.js` e `index.html`

### Cambiar zona de envío

1. Editar `data/shipping.json`
2. Bump de versión `?v=` en `app.js`

### Cambiar estilos

1. Editar `styles.css`
2. Bump `styles.css?v=` en `index.html`

## Checklist de publicación

- [ ] Cambios de datos reflejados en los JSON correctos
- [ ] Si se editó `menu.json`: `node scripts/sync-seo.js` ejecutado
- [ ] Versión `?v=` incrementada en `app.js` (fetch de JSON) e `index.html` (CSS/JS)
- [ ] Probar en servidor local: menú carga, promos activas, carrito, checkout WhatsApp

## Ubicaciones de cache (`?v=`)

| Archivo | Líneas aproximadas |
|---------|-------------------|
| `app.js` | 4 URLs `data/*.json?v=` |
| `index.html` | `styles.css?v=` y `app.js?v=` |

Versión actual: **1.3.4**

## Lo que NO hacer

- Abrir `index.html` como `file://` (falla el fetch)
- Tocar `app.js` para agregar promos simples
- Commitear `.env`, `*.db` ni archivos en `.gitignore`
- Hacer refactors grandes de `app.js` sin que lo pidan
- Olvidar el bump de cache después de cambios en `/data`

## Commits y PRs

- Solo commitear cuando el usuario lo pida explícitamente
- Mensajes de commit en español, concisos, enfocados en el "por qué"
- Para PRs: usar `gh` y seguir el flujo del repositorio

## Referencia extendida

Detalles de promociones, ejemplos JSON y estructura completa: ver `README.md`.
