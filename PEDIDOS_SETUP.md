# Implementacion de pedidos (frontend directo + Supabase)

## 1) Crear base de datos en Supabase
1. Crea una cuenta en Supabase.
2. Crea un proyecto nuevo.
3. Entra a SQL Editor y ejecuta el archivo `supabase/schema.sql`.

## 2) Donde ver los pedidos
1. En Supabase, entra a `Table Editor`.
2. Abre la tabla `pedidos`.
3. Alli veras todos los pedidos que entren desde la pagina.
4. Puedes ordenar por `created_at` para ver los mas recientes.

## 3) Configuracion del frontend
El frontend usa la clave publica de Supabase (`sb_publishable`) y envia el pedido directo a la tabla con RLS.

Variables usadas en `index.html`:
- `window.MICHECOL_SUPABASE_URL`
- `window.MICHECOL_SUPABASE_ANON_KEY`

No uses `service_role` en el frontend.

## 4) Metodo de pago
El sistema guarda siempre `metodo_pago = efectivo` y `estado = pendiente`.

## 5) Campos guardados por pedido
- `cliente_nombre`
- `cliente_telefono`
- `direccion`
- `producto`
- `tamano` (pequeno, mediano, grande)
- `precio` (5000, 6000, 7000)
- `metodo_pago` (efectivo)
- `estado` (pendiente)
- `notas`
- `created_at`

## 6) Publicar la pagina
Puedes publicar en GitHub Pages (sin Vercel) porque ya no hay backend aparte.
