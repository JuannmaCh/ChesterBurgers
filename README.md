# 🍔 Chester Burger — Sistema de Pedidos Online

> 🌐 [chesterburger.com.ar](https://chesterburger.com.ar)

Aplicación web para tomar pedidos de la hamburguesería **Chester Burger**, diseñada para funcionar desde el celular del cliente y enviar el pedido directamente por WhatsApp.

## ¿Qué hace?

- Muestra el menú completo: Burger del Mes, hamburguesas, extras y bebidas
- Permite **personalizar cada burger** (NotCo, Triple, + Cheddar, + Panceta, + Huevo, + Pepino)
- Carrito persistente en `localStorage`
- Calcula envío según zona y aplica descuentos promocionales automáticos
- Genera y envía el pedido formateado por **WhatsApp**
- Panel de cocina para generar **tickets imprimibles** desde el mensaje de WhatsApp

## Estructura del proyecto

```
├── index.html              # App principal de pedidos
├── app.js                  # Lógica de la app
├── styles.css              # Estilos
├── data/
│   ├── menu.json           # Burgers, extras y bebidas con precios
│   ├── promotions.json     # Promociones diarias, semanales y especiales
│   ├── shipping.json       # Zonas de envío y precios
│   └── config.json         # Configuración general (WhatsApp, descuentos, modificadores)
├── pages/
│   └── creacion_ticket.html  # Panel de cocina para imprimir tickets
└── assets/                 # Imágenes del menú y logo
```

## Cómo correr el proyecto

Requiere un servidor HTTP (no funciona abriendo el archivo directamente) porque carga los JSON con `fetch`.

```bash
# Con VS Code: instalar la extensión Live Server y hacer click en "Go Live"
# O con Node.js:
npx serve .
```

## Datos del menú

Toda la información editable está en `/data`:

| Archivo | Qué contiene |
|---|---|
| `menu.json` | Lista de burgers, extras y bebidas. Campo `inStock: false` para deshabilitar un ítem |
| `promotions.json` | Promociones activas (ver sección Promociones) |
| `shipping.json` | Zonas de envío y sus precios |
| `config.json` | Teléfono de WhatsApp, dirección de take away, precios de modificadores |

## Promociones

Todas las promociones se definen en `data/promotions.json`. No hace falta tocar `app.js` para agregar o quitar promos.

### Tipos de promo

**`percent_off`** — descuento porcentual sobre ítems específicos (ej. 15% OFF en una burger los viernes):

```json
{
  "id": "friday-crispy",
  "type": "percent_off",
  "days": [5],
  "itemIds": [4],
  "percent": 15,
  "basePriceOnly": true,
  "banner": "🍔 VIERNES: 15% OFF en Crispy Chester",
  "reason": "15% OFF Crispy Chester"
}
```

**`bundle_fixed_price`** — combo con precio fijo (ej. burger + gaseosa a $13.000):

```json
{
  "id": "world-cup-2026-07-03",
  "type": "bundle_fixed_price",
  "dates": ["2026-07-03"],
  "bundlePrice": 13000,
  "burgerIds": "any",
  "drinkIds": [10, 11, 13],
  "modifiersChargedSeparately": true,
  "banner": "🇦🇷 MUNDIAL: Burger + Gaseosa $13.000",
  "reason": "Combo Burger + Gaseosa"
}
```

### Cómo agregar o quitar promos

| Acción | Qué hacer |
|--------|-----------|
| Promo semanal | Agregar entrada con `"days": [0-6]` (0=domingo, 5=viernes) |
| Promo de un solo día | Agregar entrada con `"dates": ["YYYY-MM-DD"]` y borrarla al día siguiente |
| Desactivar sin borrar | `"active": false` en la entrada |
| Habilitar bebidas para combo | `"inStock": true` en `menu.json` para las gaseosas |

Después de editar, subir el cambio y **bump de cache** en las URLs de `app.js` (ej. `?v=1.2.9` → `?v=1.3.0`) para que los clientes vean la promo actualizada.

Las promos usan la zona horaria `America/Argentina/Buenos_Aires`. Si hay más de una promo aplicable al carrito, se aplica la que más ahorro genere.

## Tecnologías

- HTML / CSS / JavaScript vanilla — sin frameworks ni dependencias
- Google Fonts (Montserrat)
- [html2canvas](https://html2canvas.hertzen.com/) — para generar el ticket como imagen
