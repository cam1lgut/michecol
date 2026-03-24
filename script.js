document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.MICHECOL_API_BASE_URL || '';
    const ORDERS_ENDPOINT = `${API_BASE_URL}/api/pedidos`;

    // 1. Preloader
    const preloader = document.getElementById('preloader');
    
    // Ocultar preloader después de que cargue la ventana
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
            // Remove from DOM after transition
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600);
        }, 1000); // Mínimo 1 segundo para mostrar el logo animado
    });

    // 2. Navbar Scroll Effect & Active Links
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        // Añadir sombra y fondo al navbar al hacer scroll
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Resaltar el link activo según la sección en el viewport
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // 3. Menú Móvil (Toggle)
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const toggleIcon = navToggle.querySelector('i');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        // Cambiar icono de hamburguesa a 'X'
        if (navMenu.classList.contains('active')) {
            toggleIcon.classList.remove('fa-bars');
            toggleIcon.classList.add('fa-times');
        } else {
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        }
    });

    // Cerrar menú móvil al hacer clic en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        });
    });

    // 4. Boton flotante PQR
    const pqrButton = document.getElementById('pqr-float');
    const pqrCard = document.getElementById('pqr-card');

    if (pqrButton && pqrCard) {
        pqrButton.addEventListener('click', () => {
            const isOpen = pqrCard.classList.toggle('active');
            pqrButton.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            const clickInsidePqr = pqrCard.contains(event.target) || pqrButton.contains(event.target);
            if (!clickInsidePqr) {
                pqrCard.classList.remove('active');
                pqrButton.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // 5. Modal de pedidos
    const orderModal = document.getElementById('order-modal');
    const orderBackdrop = document.getElementById('order-modal-backdrop');
    const orderCloseButton = document.getElementById('order-close');
    const openOrderButtons = document.querySelectorAll('.open-order-modal');
    const orderForm = document.getElementById('order-form');
    const orderProductInput = document.getElementById('order-product');
    const orderSizeSelect = document.getElementById('order-size');
    const orderTotal = document.getElementById('order-total');
    const orderPriceHidden = document.getElementById('order-price-hidden');
    const orderStatus = document.getElementById('order-status');

    const currencyFormatter = new Intl.NumberFormat('es-CO');

    const setStatus = (message, statusClass = '') => {
        orderStatus.textContent = message;
        orderStatus.classList.remove('success', 'error');
        if (statusClass) {
            orderStatus.classList.add(statusClass);
        }
    };

    const updateOrderPrice = () => {
        const selectedOption = orderSizeSelect.options[orderSizeSelect.selectedIndex];
        const selectedPrice = Number(selectedOption?.dataset?.price || 5000);
        orderPriceHidden.value = String(selectedPrice);
        orderTotal.textContent = `$${currencyFormatter.format(selectedPrice)} COP`;
    };

    const openOrderModal = (productName) => {
        orderProductInput.value = productName;
        orderSizeSelect.value = 'pequeno';
        updateOrderPrice();
        setStatus('');
        orderModal.classList.add('active');
        orderModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeOrderModal = () => {
        orderModal.classList.remove('active');
        orderModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    if (orderModal && orderForm && orderSizeSelect) {
        openOrderButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const productName = button.getAttribute('data-product') || 'Michecol';
                openOrderModal(productName);
            });
        });

        orderSizeSelect.addEventListener('change', updateOrderPrice);

        orderCloseButton.addEventListener('click', closeOrderModal);
        orderBackdrop.addEventListener('click', closeOrderModal);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && orderModal.classList.contains('active')) {
                closeOrderModal();
            }
        });

        orderForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            updateOrderPrice();

            const submitButton = orderForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            setStatus('Enviando pedido...');

            const formData = new FormData(orderForm);
            const payload = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(ORDERS_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error('No se pudo guardar el pedido.');
                }

                setStatus('Pedido recibido con exito. Te contactaremos pronto.', 'success');
                orderForm.reset();
                orderSizeSelect.value = 'pequeno';
                updateOrderPrice();

                setTimeout(() => {
                    closeOrderModal();
                }, 900);
            } catch (error) {
                setStatus('No se pudo enviar. Intenta de nuevo o usa WhatsApp.', 'error');
            } finally {
                submitButton.disabled = false;
            }
        });
    }
});