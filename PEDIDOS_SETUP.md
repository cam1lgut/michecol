# Implementacion de pedidos (frontend + API + base de datos)

## 1) Crear base de datos en Supabase
1. Crea una cuenta en Supabase.
2. Crea un proyecto nuevo.
3. Entra a SQL Editor y ejecuta el archivo `supabase/schema.sql`.

## 2) Donde ver los pedidos
1. En Supabase, entra a `Table Editor`.
2. Abre la tabla `pedidos`.
3. Alli veras todos los pedidos que entren desde la pagina.
4. Puedes ordenar por `created_at` para ver los mas recientes.

## 3) Configurar backend API (Vercel)
1. Sube este repositorio a GitHub.
2. Importa el repo en Vercel.
3. En Vercel > Project Settings > Environment Variables, crea:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Haz deploy.

La API quedara en: `https://TU-PROYECTO.vercel.app/api/pedidos`

## 4) Frontend y API
- Si frontend y backend estan en el mismo proyecto de Vercel, no necesitas nada extra.
- Si el frontend queda en otro dominio (por ejemplo GitHub Pages), define antes de `script.js`:

```html
<script>
  window.MICHECOL_API_BASE_URL = 'https://TU-PROYECTO.vercel.app';
</script>
<script src="./script.js"></script>
```

## 5) Metodo de pago
El sistema guarda siempre `metodo_pago = efectivo` y `estado = pendiente`.

## 6) Campos guardados por pedido
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
