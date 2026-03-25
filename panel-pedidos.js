document.addEventListener('DOMContentLoaded', () => {
  const PANEL_USER = 'admin';
  const PANEL_PASS = 'michecol';
  const AUTH_KEY = 'michecol_panel_auth';

  const SUPABASE_URL = window.MICHECOL_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = window.MICHECOL_SUPABASE_ANON_KEY || '';
  const createClient = window.supabase?.createClient;

  const panelLogin = document.getElementById('panel-login');
  const panelApp = document.getElementById('panel-app');
  const loginForm = document.getElementById('panel-login-form');
  const loginUser = document.getElementById('panel-user');
  const loginPass = document.getElementById('panel-pass');
  const loginError = document.getElementById('panel-login-error');
  const logoutButton = document.getElementById('logout-btn');

  const ordersBody = document.getElementById('orders-body');
  const ordersError = document.getElementById('orders-error');
  const pqrBody = document.getElementById('pqr-body');
  const pqrError = document.getElementById('pqr-error');
  const pqrModal = document.getElementById('pqr-modal');
  const pqrModalBackdrop = document.getElementById('pqr-modal-backdrop');
  const pqrModalClose = document.getElementById('pqr-modal-close');
  const pqrModalMeta = document.getElementById('pqr-modal-meta');
  const pqrModalMessage = document.getElementById('pqr-modal-message');
  const refreshButton = document.getElementById('refresh-btn');
  const lastSync = document.getElementById('last-sync');

  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statDelivered = document.getElementById('stat-delivered');
  const statSales = document.getElementById('stat-sales');

  const supabase = (createClient && SUPABASE_URL && SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
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

  const previewMessage = (text, max = 95) => {
    const safe = String(text || '');
    if (safe.length <= max) {
      return safe;
    }
    return `${safe.slice(0, max)}...`;
  };

  const isAuthenticated = () => sessionStorage.getItem(AUTH_KEY) === 'ok';

  const showPanel = () => {
    panelLogin.classList.add('hidden');
    panelApp.classList.remove('hidden');
  };

  const showLogin = () => {
    panelApp.classList.add('hidden');
    panelLogin.classList.remove('hidden');
  };

  const renderRows = (orders) => {
    if (!orders.length) {
      ordersBody.innerHTML = '<tr><td colspan="11" class="empty-row">Aun no hay pedidos.</td></tr>';
      return;
    }

    ordersBody.innerHTML = orders.map((order) => {
      const stateClass = escapeHtml(order.estado || 'pendiente');
      const isDelivered = (order.estado || '').toLowerCase() === 'entregado';
      const deliverAction = isDelivered
        ? '<span class="action-btn done">Entregado</span>'
        : `<button type="button" class="action-btn deliver-btn" data-id="${order.id}">Marcar entregado</button>`;
      const deleteAction = `<button type="button" class="action-btn delete delete-btn" data-id="${order.id}">Eliminar</button>`;
      const actionCell = `<div class="action-group">${deliverAction}${deleteAction}</div>`;
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
          <td>${actionCell}</td>
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

    if (!supabase) {
      ordersError.textContent = 'Falta configurar Supabase en esta pagina.';
      return;
    }

    const { data, error } = await supabase
      .from('pedidos')
      .select('id, created_at, cliente_nombre, cliente_telefono, direccion, producto, tamano, metodo_pago, precio, estado, notas')
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

  const renderPqrRows = (pqrItems) => {
    if (!pqrItems.length) {
      pqrBody.innerHTML = '<tr><td colspan="5" class="empty-row">Aun no hay PQR.</td></tr>';
      return;
    }

    pqrBody.innerHTML = pqrItems.map((item) => `
      <tr>
        <td>${formatHour(item.created_at)}</td>
        <td>${escapeHtml(item.nombre || 'Anonimo')}</td>
        <td>${escapeHtml(item.correo || '-')}</td>
        <td><span class="message-preview">${escapeHtml(previewMessage(item.mensaje || ''))}</span></td>
        <td>
          <div class="pqr-actions">
            <button type="button" class="action-btn read pqr-read-btn" data-id="${item.id}">Leer</button>
            <button type="button" class="action-btn delete pqr-delete-btn" data-id="${item.id}">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  const loadPqr = async () => {
    pqrError.textContent = '';

    if (!supabase) {
      pqrError.textContent = 'Falta configurar Supabase en esta pagina.';
      return;
    }

    const { data, error } = await supabase
      .from('pqr')
      .select('id, created_at, nombre, correo, mensaje')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      pqrError.textContent = `No se pudieron cargar PQR: ${error.message}`;
      return;
    }

    renderPqrRows(data || []);
  };

  const openPqrModal = (data) => {
    pqrModalMeta.textContent = `${data.nombre || 'Anonimo'} · ${data.correo || '-'} · ${formatHour(data.created_at)}`;
    pqrModalMessage.textContent = data.mensaje || '';
    pqrModal.classList.remove('hidden');
    pqrModal.setAttribute('aria-hidden', 'false');
  };

  const closePqrModal = () => {
    pqrModal.classList.add('hidden');
    pqrModal.setAttribute('aria-hidden', 'true');
  };

  const loadSinglePqr = async (pqrId) => {
    const { data, error } = await supabase
      .from('pqr')
      .select('id, created_at, nombre, correo, mensaje')
      .eq('id', Number(pqrId))
      .single();

    if (error || !data) {
      pqrError.textContent = `No se pudo cargar el PQR: ${error?.message || 'No encontrado'}`;
      return;
    }

    openPqrModal(data);
  };

  const deletePqr = async (pqrId) => {
    pqrError.textContent = '';

    const { error } = await supabase
      .from('pqr')
      .delete()
      .eq('id', Number(pqrId));

    if (error) {
      pqrError.textContent = `No se pudo eliminar PQR: ${error.message}`;
      return;
    }

    await loadPqr();
  };

  const markAsDelivered = async (orderId) => {
    ordersError.textContent = '';

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'entregado' })
      .eq('id', Number(orderId))
      .eq('estado', 'pendiente');

    if (error) {
      ordersError.textContent = `No se pudo actualizar estado: ${error.message}`;
      return;
    }

    await loadOrders();
  };

  const deleteOrder = async (orderId) => {
    ordersError.textContent = '';

    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', Number(orderId));

    if (error) {
      ordersError.textContent = `No se pudo eliminar pedido: ${error.message}`;
      return;
    }

    await loadOrders();
  };

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loginError.textContent = '';

    const userValue = String(loginUser.value || '').trim();
    const passValue = String(loginPass.value || '').trim();

    if (userValue === PANEL_USER && passValue === PANEL_PASS) {
      sessionStorage.setItem(AUTH_KEY, 'ok');
      showPanel();
      loadOrders();
      return;
    }

    loginError.textContent = 'Usuario o clave incorrectos.';
  });

  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    showLogin();
  });

  ordersBody.addEventListener('click', (event) => {
    const deliverButton = event.target.closest('.deliver-btn');
    if (deliverButton) {
      const orderId = deliverButton.getAttribute('data-id');
      if (!orderId) {
        return;
      }

      markAsDelivered(orderId);
      return;
    }

    const deleteButton = event.target.closest('.delete-btn');
    if (!deleteButton) {
      return;
    }

    const orderId = deleteButton.getAttribute('data-id');
    if (!orderId) {
      return;
    }

    const confirmed = window.confirm('¿Seguro que quieres eliminar este pedido? Esta accion no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    deleteOrder(orderId);
  });

  pqrBody.addEventListener('click', (event) => {
    const readButton = event.target.closest('.pqr-read-btn');
    if (readButton) {
      const pqrId = readButton.getAttribute('data-id');
      if (!pqrId) {
        return;
      }

      loadSinglePqr(pqrId);
      return;
    }

    const deleteButton = event.target.closest('.pqr-delete-btn');
    if (!deleteButton) {
      return;
    }

    const pqrId = deleteButton.getAttribute('data-id');
    if (!pqrId) {
      return;
    }

    const confirmed = window.confirm('¿Seguro que quieres eliminar este PQR? Esta accion no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    deletePqr(pqrId);
  });

  pqrModalClose.addEventListener('click', closePqrModal);
  pqrModalBackdrop.addEventListener('click', closePqrModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !pqrModal.classList.contains('hidden')) {
      closePqrModal();
    }
  });

  refreshButton.addEventListener('click', loadOrders);

  refreshButton.addEventListener('click', loadPqr);

  if (isAuthenticated()) {
    showPanel();
    loadOrders();
    loadPqr();
  } else {
    showLogin();
  }

  setInterval(() => {
    if (isAuthenticated()) {
      loadOrders();
      loadPqr();
    }
  }, 15000);
});
