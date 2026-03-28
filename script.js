document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = window.MICHECOL_SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = window.MICHECOL_SUPABASE_ANON_KEY || '';
    const supabaseFactory = window.supabase?.createClient;
    const supabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY && supabaseFactory)
        ? supabaseFactory(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

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

    // 3.1 Scroll suave del CTA principal hacia productos
    const heroScrollButton = document.querySelector('.hero-scroll-btn');
    const productsSection = document.getElementById('productos');

    if (heroScrollButton && productsSection) {
        heroScrollButton.addEventListener('click', (event) => {
            event.preventDefault();

            const navbarOffset = 90;
            const targetTop = productsSection.getBoundingClientRect().top + window.scrollY - navbarOffset;

            window.scrollTo({
                top: Math.max(targetTop, 0),
                behavior: 'smooth'
            });
        });
    }

    // 4. Boton flotante PQR
    const pqrButton = document.getElementById('pqr-float');
    const pqrCard = document.getElementById('pqr-card');
    const pqrForm = document.getElementById('pqr-form');
    const pqrMessage = document.getElementById('pqr-message');
    const pqrCounter = document.getElementById('pqr-counter');
    const pqrStatus = document.getElementById('pqr-status');

    const setPqrStatus = (message, statusClass = '') => {
        if (!pqrStatus) {
            return;
        }

        pqrStatus.textContent = message;
        pqrStatus.classList.remove('success', 'error');
        if (statusClass) {
            pqrStatus.classList.add(statusClass);
        }
    };

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

    if (pqrMessage && pqrCounter) {
        const updateCounter = () => {
            const length = String(pqrMessage.value || '').length;
            pqrCounter.textContent = `${length} / 500`;
        };

        pqrMessage.addEventListener('input', updateCounter);
        updateCounter();
    }

    if (pqrForm) {
        pqrForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!supabaseClient) {
                setPqrStatus('No se pudo enviar PQR por configuracion de Supabase.', 'error');
                return;
            }

            const formData = new FormData(pqrForm);
            const nombre = String(formData.get('nombre') || '').trim();
            const correo = String(formData.get('correo') || '').trim();
            const mensaje = String(formData.get('mensaje') || '').trim();

            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

            if (!mensaje || mensaje.length > 500) {
                setPqrStatus('El mensaje debe tener entre 1 y 500 caracteres.', 'error');
                return;
            }

            if (!isValidEmail) {
                setPqrStatus('Ingresa un correo valido para poder darte respuesta.', 'error');
                return;
            }

            const submitButton = pqrForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            setPqrStatus('Enviando PQR...');

            try {
                const { error } = await supabaseClient
                    .from('pqr')
                    .insert([
                        {
                            nombre,
                            correo,
                            mensaje
                        }
                    ]);

                if (error) {
                    throw new Error(error.message || 'No se pudo enviar PQR');
                }

                pqrForm.reset();
                if (pqrMessage && pqrCounter) {
                    pqrCounter.textContent = '0 / 500';
                }
                setPqrStatus('PQR enviado con exito. Gracias por escribirnos.', 'success');
            } catch (error) {
                const errorMessage = error?.message ? ` (${error.message})` : '';
                setPqrStatus(`No se pudo enviar tu PQR.${errorMessage}`, 'error');
            } finally {
                submitButton.disabled = false;
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
    const cupSizeSelector = document.getElementById('cup-size-selector');
    const cupSizeCards = document.querySelectorAll('.cup-size-card');
    const orderDrinkSelect = document.getElementById('order-drink');
    const orderToppingSelect = document.getElementById('order-topping');
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

    const syncCupSizeSelection = (selectedSize) => {
        cupSizeCards.forEach((card) => {
            const isActive = card.dataset.size === selectedSize;
            card.classList.toggle('active', isActive);
            card.setAttribute('aria-checked', String(isActive));
        });
    };

    const updateOrderPrice = () => {
        const selectedOption = orderSizeSelect.options[orderSizeSelect.selectedIndex];
        const selectedPrice = Number(selectedOption?.dataset?.price || 5000);
        const selectedSize = selectedOption?.value || 'pequeno';

        syncCupSizeSelection(selectedSize);
        orderPriceHidden.value = String(selectedPrice);
        orderTotal.textContent = `$${currencyFormatter.format(selectedPrice)} COP`;
    };

    const openOrderModal = (productName) => {
        orderProductInput.value = productName;
        orderSizeSelect.value = 'pequeno';
        if (orderDrinkSelect) {
            orderDrinkSelect.value = 'ginger_canada_dry';
        }
        if (orderToppingSelect) {
            orderToppingSelect.value = 'gomitas';
        }
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

        if (cupSizeSelector) {
            cupSizeSelector.addEventListener('click', (event) => {
                const selectedCard = event.target.closest('.cup-size-card');
                if (!selectedCard) {
                    return;
                }

                const selectedSize = selectedCard.dataset.size;
                if (!selectedSize || !orderSizeSelect) {
                    return;
                }

                orderSizeSelect.value = selectedSize;
                updateOrderPrice();
            });
        }

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

            const selectedSize = payload.tamano || 'pequeno';
            const selectedDrink = String(payload.bebida || '').trim();
            const selectedTopping = String(payload.topping || '').trim();
            const priceBySize = {
                pequeno: 5000,
                mediano: 6000,
                grande: 7000
            };
            const normalizedPrice = priceBySize[selectedSize] || 5000;

            const formatLabel = (value) => value
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (letter) => letter.toUpperCase());

            const baseNotes = String(payload.notas || '').trim();
            const orderDetails = `Bebida: ${formatLabel(selectedDrink)} | Topping: ${formatLabel(selectedTopping)}`;
            const normalizedNotes = baseNotes ? `${orderDetails} | Nota: ${baseNotes}` : orderDetails;

            const insertPayload = {
                cliente_nombre: String(payload.cliente_nombre || '').trim(),
                cliente_telefono: String(payload.cliente_telefono || '').trim(),
                direccion: String(payload.direccion || '').trim(),
                producto: String(payload.producto || '').trim(),
                tamano: selectedSize,
                precio: normalizedPrice,
                metodo_pago: 'efectivo',
                estado: 'pendiente',
                notas: normalizedNotes
            };

            try {
                if (!supabaseClient) {
                    throw new Error('Cliente de Supabase no configurado');
                }

                const { error } = await supabaseClient
                    .from('pedidos')
                    .insert([insertPayload]);

                if (error) {
                    throw new Error('No se pudo guardar el pedido');
                }

                setStatus('Pedido recibido con exito. Te contactaremos pronto.', 'success');
                orderForm.reset();
                orderSizeSelect.value = 'pequeno';
                if (orderDrinkSelect) {
                    orderDrinkSelect.value = 'ginger_canada_dry';
                }
                if (orderToppingSelect) {
                    orderToppingSelect.value = 'gomitas';
                }
                updateOrderPrice();

                setTimeout(() => {
                    closeOrderModal();
                }, 900);
            } catch (error) {
                const errorMessage = error?.message ? ` (${error.message})` : '';
                setStatus(`No se pudo enviar. Intenta de nuevo o usa WhatsApp.${errorMessage}`, 'error');
            } finally {
                submitButton.disabled = false;
            }
        });
    }
});