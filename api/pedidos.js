import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function normalizeSize(value) {
  const allowed = ['pequeno', 'mediano', 'grande'];
  return allowed.includes(value) ? value : 'pequeno';
}

function normalizePrice(size) {
  if (size === 'mediano') return 6000;
  if (size === 'grande') return 7000;
  return 5000;
}

export default async function handler(req, res) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return res.status(500).json({ error: 'Faltan variables de entorno de Supabase' });
  }

  try {
    const {
      cliente_nombre,
      cliente_telefono,
      direccion,
      producto,
      tamano,
      notas
    } = req.body || {};

    if (!cliente_nombre || !cliente_telefono || !direccion || !producto) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const normalizedSize = normalizeSize(tamano);
    const precio = normalizePrice(normalizedSize);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { error } = await supabase
      .from('pedidos')
      .insert({
        cliente_nombre,
        cliente_telefono,
        direccion,
        producto,
        tamano: normalizedSize,
        precio,
        metodo_pago: 'efectivo',
        estado: 'pendiente',
        notas: notas || null
      });

    if (error) {
      return res.status(500).json({ error: 'Error guardando pedido' });
    }

    return res.status(201).json({ ok: true, mensaje: 'Pedido guardado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
