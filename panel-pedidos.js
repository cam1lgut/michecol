document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = window.MICHECOL_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = window.MICHECOL_SUPABASE_ANON_KEY || '';
  const createClient = window.supabase?.createClient;

  const ordersBody = document.getElementById('orders-body');
  const ordersError = document.getElementById('orders-error');
  const refreshButton = document.getElementById('refresh-btn');
  const lastSync = document.getElementById('last-sync');

  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statDelivered = document.getElementById('stat-delivered');
  const statSales = document.getElementById('stat-sales');

  if (!createClient || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    ordersError.textContent = 'Falta configurar Supabase en esta pagina.';
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const formatter = new Intl.NumberFormat('es-CO');

  const formatHour = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const renderRows = (orders) => {
    if (!orders.length) {
      ordersBody.innerHTML = '<tr><td colspan="10" class="empty-row">Aun no hay pedidos.</td></tr>';
      return;
    }

    ordersBody.innerHTML = orders.map((order) => {
      const stateClass = escapeHtml(order.estado || 'pendiente');
      return `
        <tr>
          <td>${formatHour(order.created_at)}</td>
          <td>${escapeHtml(order.cliente_nombre)}</td>
          <td>${escapeHtml(order.cliente_telefono)}</td>
          <td>${escapeHtml(order.direccion)}</td>
          <td>${escapeHtml(order.producto)}</td>
          <td>${escapeHtml(order.tamano)}</td>
          <td>${escapeHtml(order.metodo_pago)}</td>
          <td>$${formatter.format(order.precio || 0)} COP</td>
          <td><span class="state-chip ${stateClass}">${escapeHtml(order.estado || 'pendiente')}</span></td>
          <td>${escapeHtml(order.notas || '-')}</td>
        </tr>
      `;
    }).join('');
  };

  const renderStats = (orders) => {
    const today = new Date();
    const todayDate = today.toISOString().slice(0, 10);
    const todayOrders = orders.filter((order) => String(order.created_at || '').slice(0, 10) === todayDate);

    const pending = todayOrders.filter((order) => (order.estado || '').toLowerCase() === 'pendiente').length;
    const delivered = todayOrders.filter((order) => (order.estado || '').toLowerCase() === 'entregado').length;
    const sales = todayOrders.reduce((sum, order) => sum + Number(order.precio || 0), 0);

    statTotal.textContent = String(todayOrders.length);
    statPending.textContent = String(pending);
    statDelivered.textContent = String(delivered);
    statSales.textContent = `$${formatter.format(sales)}`;
  };

  const loadOrders = async () => {
    ordersError.textContent = '';

    const { data, error } = await supabase
      .from('pedidos')
      .select('created_at, cliente_nombre, cliente_telefono, direccion, producto, tamano, metodo_pago, precio, estado, notas')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      ordersError.textContent = `No se pudieron cargar pedidos: ${error.message}`;
      return;
    }

    renderRows(data || []);
    renderStats(data || []);
    lastSync.textContent = `Ultima actualizacion: ${new Date().toLocaleTimeString('es-CO')}`;
  };

  refreshButton.addEventListener('click', loadOrders);

  loadOrders();
  setInterval(loadOrders, 15000);
});
