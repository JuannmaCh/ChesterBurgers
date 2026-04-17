# 🍔 Chester Burger — Sistema de Pedidos Online

> 🌐 [chesterburger.com.ar](https://chesterburger.com.ar)

Aplicación web para tomar pedidos de la hamburguesería **Chester Burger**, diseñada para funcionar desde el celular del cliente y enviar el pedido directamente por WhatsApp.

## ¿Qué hace?

- Muestra el menú completo: Burger del Mes, hamburguesas, extras y bebidas
- Permite **personalizar cada burger** (NotCo, Triple, + Cheddar, + Panceta, + Huevo, + Pepino)
- Carrito persistente en `localStorage`
- Calcula envío según zona y aplica descuentos automáticos (10% efectivo / take away)
- Genera y envía el pedido formateado por **WhatsApp**
- Panel de cocina para generar **tickets imprimibles** desde el mensaje de WhatsApp

## Estructura del proyecto

```
├── index.html              # App principal de pedidos
├── app.js                  # Lógica de la app
├── styles.css              # Estilos
├── data/
│   ├── menu.json           # Burgers, extras y bebidas con precios
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
| `shipping.json` | Zonas de envío y sus precios |
| `config.json` | Teléfono de WhatsApp, dirección de take away, % descuento, precios de modificadores |

## Tecnologías

- HTML / CSS / JavaScript vanilla — sin frameworks ni dependencias
- Google Fonts (Montserrat)
- [html2canvas](https://html2canvas.hertzen.com/) — para generar el ticket como imagen
