// Script loaded

function gtagEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
        console.debug('GA event:', eventName, params);
    }
}

function trackProductView(productId, productTitle) {
    gtagEvent('view_product', {
        product_id: String(productId),
        product_title: String(productTitle || ''),
        timestamp: new Date().toISOString()
    });
}

function trackWhatsAppClick(productId, quoteType) {
    gtagEvent('whatsapp_click', {
        product_id: String(productId),
        quote_type: String(quoteType),
        timestamp: new Date().toISOString()
    });
}

function trackFavoriteAdded(productId, productTitle) {
    gtagEvent('favorite_added', {
        product_id: String(productId),
        product_title: String(productTitle || ''),
        timestamp: new Date().toISOString()
    });
}

function trackFilterApplied(filterType, filterValue) {
    gtagEvent('filter_applied', {
        filter_type: String(filterType),
        filter_value: String(filterValue),
        timestamp: new Date().toISOString()
    });
}

function trackSearchOpened() {
    gtagEvent('search_opened', {
        timestamp: new Date().toISOString()
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const FAVORITES_STORAGE_KEY = 'andiworks.favoriteProducts';
const RADIUS_STORAGE_KEY = 'andiworks.cylinderRadiusMultiplier';
const DARK_MODE_KEY = 'andiworks.darkMode';
const CYL_RADIUS_DEFAULT = 1.5;
const CYL_RADIUS_DEFAULT_MOBILE = 1.4;
const CYL_RADIUS_SLIDER_MIN_DESKTOP = 0;
const CYL_RADIUS_SLIDER_MAX_DESKTOP = 5;
const CYL_RADIUS_SLIDER_MIN_MOBILE = 0;
const CYL_RADIUS_SLIDER_MAX_MOBILE = 4;
const CYL_RADIUS_PHYSICAL_MIN = 1;
const CYL_CAMERA_ZOOM_OUT_MAX = 1000;
const CYL_WHEEL_RADIUS_SENSITIVITY = 0.0022;
const CYL_WHEEL_LINE_PX = 16;

let allProducts = [];
let shuffledProducts = [];
let filteredProducts = [];
let currentImageIndex = 0;
let currentProductIndex = 0;
let isAnimating = false;

let favoriteProductIds = new Set();
const filterState = {
    productTypes: new Set(),
    materials: new Set(),
    onlyFavorites: false,
    sortFavoritesFirst: false
};

function uniq(values) {
    return Array.from(new Set(values.filter(Boolean)));
}

function loadFavoriteIds() {
    try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return new Set();
        return new Set(parsed.map(String));
    } catch (_) {
        return new Set();
    }
}

function saveFavoriteIds() {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favoriteProductIds)));
}

function loadStoredRadiusMultiplier() {
    try {
        const bounds = getRadiusSliderBounds();
        const raw = localStorage.getItem(RADIUS_STORAGE_KEY);
        if (raw === null) {
            return window.matchMedia('(max-width: 768px)').matches
                ? CYL_RADIUS_DEFAULT_MOBILE
                : CYL_RADIUS_DEFAULT;
        }
        const parsed = parseFloat(raw || '');
        if (!Number.isFinite(parsed)) return CYL_RADIUS_DEFAULT;
        return Math.max(bounds.min, Math.min(bounds.max, parsed));
    } catch (_) {
        return CYL_RADIUS_DEFAULT;
    }
}

function saveStoredRadiusMultiplier(value) {
    localStorage.setItem(RADIUS_STORAGE_KEY, String(value));
}

function normalizeProduct(product, index) {
    const category = String(product.category || '').trim();
    const productType = String(product.productType || product.title || product.name || `Producto ${index + 1}`).trim();
    const materialTypes = Array.isArray(product.materialTypes)
        ? uniq(product.materialTypes.map((v) => String(v).trim()))
        : [];

    return {
        ...product,
        category,
        productType,
        materialTypes
    };
}

function isFavoriteProduct(product) {
    return favoriteProductIds.has(String(product.id));
}

function setFavoriteButtonState(product) {
    const favoriteBtn = document.getElementById('favorite-btn');
    if (!favoriteBtn || !product) return;
    const isFavorite = isFavoriteProduct(product);
    favoriteBtn.classList.toggle('active', isFavorite);
    favoriteBtn.setAttribute('aria-pressed', String(isFavorite));
    favoriteBtn.setAttribute('aria-label', isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos');
}

function toggleFavorite(productId) {
    const key = String(productId);
    const adding = !favoriteProductIds.has(key);
    if (favoriteProductIds.has(key)) {
        favoriteProductIds.delete(key);
    } else {
        favoriteProductIds.add(key);
    }
    saveFavoriteIds();

    if (adding) {
        const product = filteredProducts.find((item) => String(item.id) === key);
        if (product) {
            trackFavoriteAdded(productId, product.title || product.name || 'Producto');
        }
    }
}

function getProductTagItems(product) {
    const tags = [];
    if (product.category) tags.push({ kind: 'categoria', value: product.category });
    if (product.productType) tags.push({ kind: 'producto', value: product.productType });
    product.materialTypes.forEach((material) => tags.push({ kind: 'material', value: material }));
    return tags;
}

function renderProductTags(product) {
    const tags = getProductTagItems(product);
    if (!tags.length) return '';
    return tags
        .map((tag) => `<span class="product-tag product-tag--${tag.kind}">${tag.value}</span>`)
        .join('');
}

function getFacetValues() {
    return {
        productTypes: uniq(shuffledProducts.map((p) => p.productType)).sort((a, b) => a.localeCompare(b, 'es')),
        materials: uniq(shuffledProducts.flatMap((p) => p.materialTypes)).sort((a, b) => a.localeCompare(b, 'es'))
    };
}

function productMatchesFilters(product) {
    if (filterState.productTypes.size && !filterState.productTypes.has(product.productType)) {
        return false;
    }
    if (filterState.materials.size) {
        const hasAnyMaterial = product.materialTypes.some((material) => filterState.materials.has(material));
        if (!hasAnyMaterial) return false;
    }
    if (filterState.onlyFavorites && !isFavoriteProduct(product)) {
        return false;
    }
    return true;
}

function closeProductFilterOverlay() {
    const overlay = document.getElementById('product-filter-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
}

function isProductFilterOverlayOpen() {
    const overlay = document.getElementById('product-filter-overlay');
    return !!overlay && overlay.classList.contains('visible');
}

function resetCylinderPointerFocus() {
    cylinderPointerX = 0;
    cylinderPointerY = 0;
    if (cylinderPointedCard) {
        cylinderPointedCard.classList.remove('is-pointed');
        cylinderPointedCard = null;
    }
}

function openProductFilterOverlay() {
    const overlay = document.getElementById('product-filter-overlay');
    if (!overlay) return;
    trackSearchOpened();
    resetCylinderPointerFocus();
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden', 'false');
}

function shouldShowBulkQuoteButton() {
    return filterState.onlyFavorites && filteredProducts.length > 1;
}

function buildBulkQuoteMessage() {
    const names = filteredProducts
        .map((product) => String(product.title || product.name || '').trim())
        .filter(Boolean)
        .slice(0, 20);

    if (!names.length) {
        return 'Hola, me gustaria cotizar productos favoritos.';
    }

    const listedNames = names.map((name) => `- ${name}`).join('\n');
    return `¡Hola! Quiero preguntar por los siguientes productos:\n${listedNames}`;
}

function updateBulkQuoteButton() {
    const row = document.querySelector('.contact-buttons');
    const bulkBtn = document.getElementById('bulk-whatsapp-btn');
    if (!row || !bulkBtn) return;

    const shouldShow = shouldShowBulkQuoteButton();
    row.classList.toggle('show-bulk-quote', shouldShow);

    if (!shouldShow) {
        bulkBtn.href = '#';
        bulkBtn.setAttribute('aria-hidden', 'true');
        bulkBtn.setAttribute('tabindex', '-1');
        return;
    }

    const message = buildBulkQuoteMessage();
    bulkBtn.href = `https://wa.me/56953706307?text=${encodeURIComponent(message)}`;
    bulkBtn.removeAttribute('aria-hidden');
    bulkBtn.removeAttribute('tabindex');
    bulkBtn.onclick = () => {
        trackWhatsAppClick('bulk', 'bulk');
    };
}

function readFilterToggleValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('.filter-chip.active')).map((btn) => btn.dataset.value || '');
}

function setFilterOptionButtons() {
    const onlyFavBtn = document.getElementById('filter-only-favorites');
    const sortFavBtn = document.getElementById('filter-sort-favorites');
    if (onlyFavBtn) {
        onlyFavBtn.classList.toggle('active', filterState.onlyFavorites);
        onlyFavBtn.setAttribute('aria-pressed', String(filterState.onlyFavorites));
    }
    if (sortFavBtn) {
        sortFavBtn.classList.toggle('active', filterState.sortFavoritesFirst);
        sortFavBtn.setAttribute('aria-pressed', String(filterState.sortFavoritesFirst));
    }
}

function renderFilterGroup(containerId, values, selectedSet) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    values.forEach((value) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `filter-chip${selectedSet.has(value) ? ' active' : ''}`;
        btn.dataset.value = value;
        btn.setAttribute('aria-pressed', String(selectedSet.has(value)));
        btn.textContent = value;
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const isActive = btn.classList.contains('active');
            btn.setAttribute('aria-pressed', String(isActive));
        });
        container.appendChild(btn);
    });
}

function renderProductFilterUI() {
    const facets = getFacetValues();
    renderFilterGroup('filter-product-types', facets.productTypes, filterState.productTypes);
    renderFilterGroup('filter-materials', facets.materials, filterState.materials);
    setFilterOptionButtons();
}

function applyProductFilters(options = {}) {
    const { preservePage = true } = options;

    const filtered = shuffledProducts.filter(productMatchesFilters);
    if (filterState.sortFavoritesFirst) {
        const orderMap = new Map(shuffledProducts.map((product, idx) => [String(product.id), idx]));
        filtered.sort((a, b) => {
            const favDiff = Number(isFavoriteProduct(b)) - Number(isFavoriteProduct(a));
            if (favDiff !== 0) return favDiff;
            return (orderMap.get(String(a.id)) || 0) - (orderMap.get(String(b.id)) || 0);
        });
    }

    filteredProducts = filtered;

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / CYLINDER_PAGE_SIZE));
    if (!preservePage) {
        cylinderPage = 0;
    } else {
        cylinderPage = Math.min(cylinderPage, totalPages - 1);
    }

    buildCylinder({ animateIn: true, preserveRotation: false });
    renderProductFilterUI();
    updateBulkQuoteButton();

    const openProduct = filteredProducts[currentProductIndex];
    const overlayOpen = isOverlayOpen();
    if (overlayOpen && !openProduct) {
        closeOverlay({ target: { id: 'overlay' } });
    } else if (overlayOpen && openProduct) {
        setFavoriteButtonState(openProduct);
    }
}

function clearAllFilters() {
    filterState.productTypes.clear();
    filterState.materials.clear();
    filterState.onlyFavorites = false;
    filterState.sortFavoritesFirst = false;
}

function syncFiltersFromUI() {
    filterState.productTypes = new Set(readFilterToggleValues('filter-product-types'));
    filterState.materials = new Set(readFilterToggleValues('filter-materials'));
    const onlyFavBtn = document.getElementById('filter-only-favorites');
    const sortFavBtn = document.getElementById('filter-sort-favorites');
    filterState.onlyFavorites = !!onlyFavBtn && onlyFavBtn.classList.contains('active');
    filterState.sortFavoritesFirst = !!sortFavBtn && sortFavBtn.classList.contains('active');
}

function initProductFilterModal() {
    const openBtn = document.getElementById('open-product-search');
    const closeBtn = document.getElementById('close-product-filter');
    const clearBtn = document.getElementById('clear-product-filter');
    const applyBtn = document.getElementById('apply-product-filter');
    const overlay = document.getElementById('product-filter-overlay');
    const onlyFavBtn = document.getElementById('filter-only-favorites');
    const sortFavBtn = document.getElementById('filter-sort-favorites');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            markCylinderInteraction();
            renderProductFilterUI();
            openProductFilterOverlay();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            markCylinderInteraction();
            closeProductFilterOverlay();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'product-filter-overlay') {
                closeProductFilterOverlay();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            markCylinderInteraction();
            clearAllFilters();
            renderProductFilterUI();
            applyProductFilters({ preservePage: false });
            closeProductFilterOverlay();
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            markCylinderInteraction();
            syncFiltersFromUI();
            Array.from(filterState.productTypes).forEach((type) => trackFilterApplied('productType', type));
            Array.from(filterState.materials).forEach((material) => trackFilterApplied('material', material));
            if (filterState.onlyFavorites) trackFilterApplied('favorite', 'onlyFavorites');
            if (filterState.sortFavoritesFirst) trackFilterApplied('filter_option', 'sortFavoritesFirst');
            applyProductFilters({ preservePage: false });
            closeProductFilterOverlay();
        });
    }

    if (onlyFavBtn) {
        onlyFavBtn.addEventListener('click', () => {
            onlyFavBtn.classList.toggle('active');
            const active = onlyFavBtn.classList.contains('active');
            onlyFavBtn.setAttribute('aria-pressed', String(active));
        });
    }

    if (sortFavBtn) {
        sortFavBtn.addEventListener('click', () => {
            sortFavBtn.classList.toggle('active');
            const active = sortFavBtn.classList.contains('active');
            sortFavBtn.setAttribute('aria-pressed', String(active));
        });
    }
}

function handleKeydown(e) {
    if (isAnimating) return;
    if (e.key === 'ArrowRight') changeImage(currentImageIndex + 1);
    else if (e.key === 'ArrowLeft') changeImage(currentImageIndex - 1);
    else if (e.key === 'Escape') {
        if (isOverlayOpen()) {
            closeOverlay({ target: { id: 'overlay' } });
            return;
        }
        const filterOverlay = document.getElementById('product-filter-overlay');
        if (filterOverlay && filterOverlay.classList.contains('visible')) {
            closeProductFilterOverlay();
        }
    }
}

function handleNavPrev(e) {
    e.stopPropagation();
    if (!isAnimating) changeImage(currentImageIndex - 1);
}

function handleNavNext(e) {
    e.stopPropagation();
    if (!isAnimating) changeImage(currentImageIndex + 1);
}

let overlayTouchStartX = 0;
let overlayTouchStartY = 0;

function handleOverlayTouchStart(e) {
    if (!isMobileUiActive()) return;
    if (!e.touches || e.touches.length !== 1) return;
    overlayTouchStartX = e.touches[0].clientX;
    overlayTouchStartY = e.touches[0].clientY;
}

function handleOverlayTouchEnd(e) {
    if (!isMobileUiActive()) return;
    if (!e.changedTouches || e.changedTouches.length !== 1) return;
    if (isAnimating) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - overlayTouchStartX;
    const dy = endY - overlayTouchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < 34) return;
    if (absX <= absY * 1.2) return;

    if (dx < 0) {
        changeImage(currentImageIndex + 1);
    } else {
        changeImage(currentImageIndex - 1);
    }
}

function openOverlay(index) {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;

    if (overlay.style.display === 'flex') {
        overlay.style.display = 'none';
        document.removeEventListener('keydown', handleKeydown);
        overlay.removeEventListener('click', closeOverlay);
        document.getElementById('close-btn').removeEventListener('click', closeOverlay);
        document.getElementById('nav-prev').removeEventListener('click', handleNavPrev);
        document.getElementById('nav-next').removeEventListener('click', handleNavNext);
        document.getElementById('large-image').removeEventListener('touchstart', handleOverlayTouchStart);
        document.getElementById('large-image').removeEventListener('touchend', handleOverlayTouchEnd);
    }

    const product = filteredProducts[index];
    if (!product) return;

    const largeImage = document.getElementById('large-image');
    const indicators = document.getElementById('indicators');
    const productTitle = document.getElementById('product-title');
    const instagramBtn = document.getElementById('instagram-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const specsPanel = document.getElementById('specs-panel');
    const specsToggleBtn = document.getElementById('specs-toggle-btn');
    const specsDimensions = document.getElementById('specs-dimensions');
    const specsDescription = document.getElementById('specs-description');
    const specsTags = document.getElementById('specs-tags');
    const favoriteBtn = document.getElementById('favorite-btn');
    const mobileOverlayMode = isMobileUiActive();
    const overlayContent = document.querySelector('.overlay-content');

    currentProductIndex = index;
    trackProductView(product.id, product.title || product.name || 'Producto');
    productTitle.textContent = '';
    largeImage.src = product.images[0];
    currentImageIndex = 0;

    indicators.innerHTML = '';
    product.images.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `indicator ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            if (!isAnimating) changeImage(i);
        });
        indicators.appendChild(dot);
    });

    instagramBtn.href = product.contact && product.contact.instagram ? product.contact.instagram : 'https://instagram.com/andiworks.cl';
    whatsappBtn.href = product.contact && product.contact.whatsapp ? product.contact.whatsapp : 'https://wa.me/56953706307';
    whatsappBtn.onclick = () => {
        trackWhatsAppClick(product.id, 'single');
    };
    updateBulkQuoteButton();

    product.images.forEach((img, i) => {
        if (i > 0) {
            const preload = new Image();
            preload.src = img.src || img;
        }
    });

    const syncMobileOverlayStack = () => {
        if (!mobileOverlayMode || !overlayContent) return;
        const specsOpen = specsPanel.classList.contains('mobile-open');
        const feedbackOpen = feedbackContainer.classList.contains('mobile-open');
        const feedbackTooltip = feedbackContainer.querySelector('.feedback-tooltip-box');
        const specsHeight = specsOpen ? Math.ceil(specsPanel.getBoundingClientRect().height) : 0;
        const feedbackHeight = feedbackOpen && feedbackTooltip ? Math.ceil(feedbackTooltip.getBoundingClientRect().height) : 0;

        const feedbackOffset = specsOpen ? specsHeight + 10 : 0;
        const stackHeight = specsHeight + (feedbackOpen ? feedbackHeight : 0);
        const navShiftFromStack = stackHeight > 0 ? Math.min(120, Math.round(stackHeight * 0.22)) : 0;

        overlayContent.style.setProperty('--mobile-feedback-offset', `${feedbackOffset}px`);
        overlayContent.style.setProperty('--mobile-nav-shift', `${navShiftFromStack}px`);
    };

    specsPanel.classList.remove('visible');
    specsPanel.classList.remove('mobile-open');

    if (specsToggleBtn) {
        specsToggleBtn.classList.remove('active');
        specsToggleBtn.setAttribute('aria-pressed', 'false');
        specsToggleBtn.style.display = 'none';
    }

    const feedbackContainer = document.getElementById('client-feedback');
    const feedbackIconBtn = document.getElementById('feedback-icon-btn');
    const feedbackTooltipText = document.getElementById('feedback-tooltip-text');

    if (product.specs) {
        const dims = product.specs.dimensions || {};
        const dimLabels = dims.labels || {};
        const dimensionItems = [
            { label: dimLabels.ancho || 'Ancho', value: dims.ancho },
            { label: dimLabels.alto || 'Alto', value: dims.alto },
            { label: dimLabels.largo || 'Largo', value: dims.largo }
        ].filter((item) => item.value && item.value !== '-');
        const dimensionsMarkup = dimensionItems.length
            ? dimensionItems.map((item, index) => `${index ? '<span class="dim-sep"> · </span>' : ''}<span class="dim-item">${item.label}: ${item.value}</span>`).join('')
            : '<span class="dim-item">Sin dimensiones registradas</span>';
        specsDimensions.innerHTML = `<strong class="specs-title-main">${String(product.title).toUpperCase()}</strong><strong class="specs-subtitle">Dimensiones:</strong>${dimensionsMarkup}`;
        specsDescription.innerHTML = `<strong class="specs-subtitle">Descripción:</strong>${product.specs.description}`;
        specsTags.innerHTML = `<strong class="specs-subtitle">Etiquetas:</strong><span class="specs-tags-wrap">${renderProductTags(product)}</span>`;

        if (!mobileOverlayMode) {
            specsPanel.classList.add('visible');
            if (specsToggleBtn) {
                specsToggleBtn.classList.add('active');
                specsToggleBtn.setAttribute('aria-pressed', 'true');
            }
        }

        if (specsToggleBtn) {
            specsToggleBtn.style.display = 'flex';
            specsToggleBtn.onclick = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                const currentlyVisible = specsPanel.classList.contains('visible');
                const nextState = !currentlyVisible;
                specsPanel.classList.toggle('visible', nextState);
                specsPanel.classList.toggle('mobile-open', mobileOverlayMode ? nextState : false);
                specsToggleBtn.classList.toggle('active', nextState);
                specsToggleBtn.setAttribute('aria-pressed', String(nextState));
                syncMobileOverlayStack();
            };
        }
    } else {
        specsDimensions.textContent = '';
        specsDescription.textContent = '';
        specsTags.textContent = '';
        if (specsToggleBtn) {
            specsToggleBtn.onclick = null;
            specsToggleBtn.classList.remove('active');
            specsToggleBtn.setAttribute('aria-pressed', 'false');
        }
    }

    if (product.feedback) {
        feedbackTooltipText.textContent = `"${product.feedback}"`;
        feedbackContainer.classList.add('visible');
        feedbackContainer.classList.remove('mobile-open');
        if (feedbackIconBtn) {
            feedbackIconBtn.classList.remove('active');
            feedbackIconBtn.setAttribute('aria-pressed', 'false');
        }

        if (feedbackIconBtn) {
            feedbackIconBtn.onclick = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                if (!mobileOverlayMode) return;
                const nextOpen = !feedbackContainer.classList.contains('mobile-open');
                feedbackContainer.classList.toggle('mobile-open', nextOpen);
                feedbackIconBtn.classList.toggle('active', nextOpen);
                feedbackIconBtn.setAttribute('aria-pressed', String(nextOpen));
                syncMobileOverlayStack();
            };
        }
    } else {
        feedbackTooltipText.textContent = '';
        feedbackContainer.classList.remove('visible');
        feedbackContainer.classList.remove('mobile-open');
        if (feedbackIconBtn) {
            feedbackIconBtn.onclick = null;
            feedbackIconBtn.classList.remove('active');
            feedbackIconBtn.setAttribute('aria-pressed', 'false');
        }
    }

    syncMobileOverlayStack();

    if (favoriteBtn) {
        setFavoriteButtonState(product);
        favoriteBtn.onclick = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            toggleFavorite(product.id);
            setFavoriteButtonState(product);

            // Evita re-render del cilindro cuando el favorito no altera el conjunto visible.
            if (filterState.onlyFavorites || filterState.sortFavoritesFirst) {
                applyProductFilters({ preservePage: true });
            } else {
                updateBulkQuoteButton();
            }
        };
    }

    overlay.style.display = 'flex';
    anime({
        targets: overlay,
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
    });

    if (window.matchMedia('(max-width: 768px)').matches) {
        const logoContainer = document.querySelector('.logo-3d-container');
        if (logoContainer) logoContainer.classList.add('overlay-open');
    }

    document.addEventListener('keydown', handleKeydown);
    overlay.addEventListener('click', closeOverlay);
    document.getElementById('close-btn').addEventListener('click', closeOverlay);
    document.getElementById('nav-prev').addEventListener('click', handleNavPrev);
    document.getElementById('nav-next').addEventListener('click', handleNavNext);
    largeImage.addEventListener('touchstart', handleOverlayTouchStart, { passive: true });
    largeImage.addEventListener('touchend', handleOverlayTouchEnd, { passive: true });
}

function changeImage(newIndex) {
    if (isAnimating) return;

    const product = filteredProducts[currentProductIndex];
    if (!product || !product.images || !product.images.length) return;

    if (newIndex >= product.images.length) newIndex = 0;
    if (newIndex < 0) newIndex = product.images.length - 1;
    if (newIndex === currentImageIndex) return;

    isAnimating = true;
    const largeImage = document.getElementById('large-image');
    const imageData = product.images[newIndex];
    const newSrc = imageData.src || imageData;

    const preloadImg = new Image();
    preloadImg.src = newSrc;

    anime({
        targets: largeImage,
        opacity: [1, 0],
        duration: 150,
        easing: 'easeOutQuad',
        complete: () => {
            const showImage = () => {
                currentImageIndex = newIndex;
                largeImage.src = newSrc;

                anime({
                    targets: largeImage,
                    opacity: [0, 1],
                    duration: 350,
                    easing: 'easeInOutQuad',
                    complete: () => {
                        isAnimating = false;
                    }
                });
            };

            if (preloadImg.complete) showImage();
            else {
                preloadImg.onload = showImage;
                preloadImg.onerror = showImage;
            }
        }
    });

    document.querySelectorAll('.indicator').forEach((dot, i) => {
        dot.classList.toggle('active', i === newIndex);
    });
}

function closeOverlay(e) {
    const isOverlayBg = e.target && e.target.id === 'overlay';
    const isCloseBtn = e.target && (e.target.id === 'close-btn' || (typeof e.target.closest === 'function' && e.target.closest('#close-btn')));
    if (isOverlayBg || isCloseBtn) {
        const overlay = document.getElementById('overlay');
        const specsPanel = document.getElementById('specs-panel');
        const specsToggleBtn = document.getElementById('specs-toggle-btn');
        const overlayContent = document.querySelector('.overlay-content');

        specsPanel.classList.remove('visible');
        specsPanel.classList.remove('mobile-open');
        if (specsToggleBtn) {
            specsToggleBtn.classList.remove('active');
            specsToggleBtn.setAttribute('aria-pressed', 'false');
            specsToggleBtn.onclick = null;
        }

        const feedbackContainer = document.getElementById('client-feedback');
        const feedbackIconBtn = document.getElementById('feedback-icon-btn');
        const feedbackTooltipText = document.getElementById('feedback-tooltip-text');
        if (feedbackContainer) feedbackContainer.classList.remove('mobile-open');
        if (feedbackContainer) feedbackContainer.classList.remove('visible');
        if (feedbackIconBtn) feedbackIconBtn.onclick = null;
        if (feedbackIconBtn) feedbackIconBtn.classList.remove('active');
        if (feedbackIconBtn) feedbackIconBtn.setAttribute('aria-pressed', 'false');
        if (feedbackTooltipText) feedbackTooltipText.textContent = '';
        if (overlayContent) {
            overlayContent.style.removeProperty('--mobile-feedback-offset');
            overlayContent.style.removeProperty('--mobile-nav-shift');
        }

        anime({
            targets: overlay,
            opacity: [1, 0],
            duration: 300,
            easing: 'easeOutQuad',
            complete: () => {
                overlay.style.display = 'none';
            }
        });

        const logoContainer = document.querySelector('.logo-3d-container');
        if (logoContainer) logoContainer.classList.remove('overlay-open');

        document.removeEventListener('keydown', handleKeydown);
        overlay.removeEventListener('click', closeOverlay);
        document.getElementById('close-btn').removeEventListener('click', closeOverlay);
        document.getElementById('nav-prev').removeEventListener('click', handleNavPrev);
        document.getElementById('nav-next').removeEventListener('click', handleNavNext);
        document.getElementById('large-image').removeEventListener('touchstart', handleOverlayTouchStart);
        document.getElementById('large-image').removeEventListener('touchend', handleOverlayTouchEnd);
    }
}

const CYLINDER_COLS = 10;
const CYLINDER_ROWS = 5;
const CYLINDER_PAGE_SIZE = CYLINDER_COLS * CYLINDER_ROWS;
let cylinderPage = 0;
let cylinderAngle = 0;
let cylinderIsDragging = false;
let cylinderIsPinching = false;
let cylinderDragMoved = false;
let cylinderDragStartX = 0;
let cylinderDragStartAngle = 0;
let cylinderPinchStartDistance = 0;
let cylinderPinchStartSliderValue = CYL_RADIUS_DEFAULT;
let cylinderVelocity = 0;
let cylinderLastDragX = 0;
let cylinderLastDragTime = 0;
let cylinderRafId = null;
let cylinderPointerX = 0;
let cylinderPointerY = 0;
let cylinderCameraX = 0;
let cylinderCameraY = 0;
let cylinderCameraRafId = null;
let cylinderRingRadius = 0;
let cylinderCameraDepth = 0;
let cylinderCameraDepthTarget = 0;
let cylinderRadiusMultiplier = CYL_RADIUS_DEFAULT;
let cylinderTargetRadiusMultiplier = CYL_RADIUS_DEFAULT;
let cylinderSliderValue = CYL_RADIUS_DEFAULT;
let cylinderDragTargetAngle = 0;
let cylinderCurrentPageCount = 0;
let cylinderCameraZoomOut = 0;
let cylinderCameraZoomOutTarget = 0;
let cylinderInputMode = 'mouse';
let cylinderTouchDragOriginY = 0;
let cylinderTouchCameraOffsetStart = 0;
let cylinderTouchGestureAxis = 'pending';
let cylinderCameraOffsetY = 0;
let cylinderCameraOffsetYTarget = 0;

const CYL_CARD_WIDTH = 96;
const CYL_CARD_HEIGHT = 128;
const CYL_GAP_X = 26;
const CYL_GAP_Y = 18;
const CYL_PERSPECTIVE = 760;
const CYL_RING_VIEW_OFFSET_DEG = 180;
let cylinderCameraTiltX = 6.8;
let cylinderCameraTiltY = 4.9;
let cylinderCameraLerp = 0.036;
const CYL_DRAG_ROT_FACTOR = 0.098;
const CYL_VELOCITY_FACTOR = 4.2;
const CYL_INERTIA = 0.968;
const CYL_DRAG_LERP = 0.42;
const CYL_TOUCH_DRAG_ROT_FACTOR = 0.086;
const CYL_TOUCH_VELOCITY_FACTOR = 5.5;
const CYL_TOUCH_INERTIA = 0.978;
const CYL_TOUCH_DRAG_LERP = 0.31;
const CYL_TOUCH_ROT_NEAR_MIN_BOOST = 0.42;
const CYL_TOUCH_VERTICAL_SENSITIVITY = 0.76;
const CYL_TOUCH_VERTICAL_TOP_LIMIT = 160;
const CYL_TOUCH_VERTICAL_BOTTOM_LIMIT = 120;
const CYL_TOUCH_AXIS_LOCK_THRESHOLD_PX = 12;
const CYL_TOUCH_AXIS_LOCK_RATIO = 1.15;
const CYL_TOUCH_VERTICAL_ROTATION_ATTENUATION = 0.18;
const CYL_TOUCH_HORIZONTAL_VERTICAL_ATTENUATION = 0.28;
const CYL_RADIUS_LERP = 0.2;
const CYL_AUTO_ROT_DELAY_MS = 10000;
const CYL_AUTO_ROT_SPEED = 0.03;
const CYL_AUTO_ROT_BLEND_LERP = 0.028;
const CYL_PINCH_RADIUS_SENSITIVITY = 0.006;
let cylinderPointerEdgeExp = 0.78;
let cylinderPointedCard = null;
let cylinderLastPointedCheckAt = 0;
let cylinderLastInteractionAt = performance.now();
let cylinderAutoRotateBlend = 0;

const CYL_CAMERA_CENTER_TUNING = { tiltX: 6.8, tiltY: 4.9, lerp: 0.036, edgeExp: 0.78 };
const CYL_CAMERA_EDGE_TUNING = { tiltX: 26.0, tiltY: 15.0, lerp: 0.016, edgeExp: 0.20 };

function clampTouchCameraOffsetY(value) {
    return Math.max(-CYL_TOUCH_VERTICAL_TOP_LIMIT, Math.min(CYL_TOUCH_VERTICAL_BOTTOM_LIMIT, value));
}

function isOverlayOpen() {
    const overlay = document.getElementById('overlay');
    return !!overlay && overlay.style.display === 'flex';
}

function isMobileUiActive() {
    return document.body.classList.contains('mobile-ui');
}

function getRadiusSliderBounds() {
    if (window.matchMedia('(max-width: 768px)').matches) {
        return { min: CYL_RADIUS_SLIDER_MIN_MOBILE, max: CYL_RADIUS_SLIDER_MAX_MOBILE };
    }
    return { min: CYL_RADIUS_SLIDER_MIN_DESKTOP, max: CYL_RADIUS_SLIDER_MAX_DESKTOP };
}

function getTouchRotationFactor() {
    const bounds = getRadiusSliderBounds();
    const range = Math.max(bounds.max - bounds.min, 0.0001);
    const normalized = Math.max(0, Math.min(1, (cylinderSliderValue - bounds.min) / range));
    const nearMin = 1 - normalized;
    return CYL_TOUCH_DRAG_ROT_FACTOR * (1 + (nearMin * CYL_TOUCH_ROT_NEAR_MIN_BOOST));
}

function clearPointedCard() {
    if (cylinderPointedCard) {
        cylinderPointedCard.classList.remove('is-pointed');
        cylinderPointedCard = null;
    }
}

function getTouchDistance(touchA, touchB) {
    const dx = touchA.clientX - touchB.clientX;
    const dy = touchA.clientY - touchB.clientY;
    return Math.hypot(dx, dy);
}

function applyCylinderRadiusFromSliderValue(sliderVal) {
    const slider = document.getElementById('cyl-radius-slider');
    const valueLabel = document.getElementById('cyl-radius-value');
    const bounds = getRadiusSliderBounds();
    const nextValue = Math.max(bounds.min, Math.min(bounds.max, Number(sliderVal)));
    cylinderSliderValue = nextValue;

    if (slider) {
        slider.min = String(bounds.min);
        slider.max = String(bounds.max);
        slider.value = String(nextValue);
    }

    if (nextValue < CYL_RADIUS_PHYSICAL_MIN) {
        cylinderTargetRadiusMultiplier = CYL_RADIUS_PHYSICAL_MIN;
        cylinderCameraZoomOutTarget = (CYL_RADIUS_PHYSICAL_MIN - nextValue) * CYL_CAMERA_ZOOM_OUT_MAX;
    } else {
        cylinderTargetRadiusMultiplier = nextValue;
        cylinderCameraZoomOutTarget = 0;
    }

    saveStoredRadiusMultiplier(nextValue);
    if (valueLabel) valueLabel.textContent = `${nextValue.toFixed(2)}x`;
}

function markCylinderInteraction() {
    cylinderLastInteractionAt = performance.now();
}

function applyCameraProfile() {
    // Edge+ is fixed profile; center behavior is blended dynamically in RAF.
    cylinderCameraTiltX = CYL_CAMERA_EDGE_TUNING.tiltX;
    cylinderCameraTiltY = CYL_CAMERA_EDGE_TUNING.tiltY;
    cylinderCameraLerp = CYL_CAMERA_EDGE_TUNING.lerp;
    cylinderPointerEdgeExp = CYL_CAMERA_EDGE_TUNING.edgeExp;
}

function animateCylinderCardsIn() {
    if (typeof anime === 'undefined') return;
    const cards = Array.from(document.querySelectorAll('.cylinder-card'));
    if (!cards.length) return;

    anime({
        targets: cards,
        opacity: [0, 1],
        duration: 170,
        delay: anime.stagger(5),
        easing: 'easeOutQuad'
    });
}

function updateNoResultsState() {
    const noResults = document.getElementById('cyl-no-results');
    if (!noResults) return;
    noResults.classList.toggle('visible', filteredProducts.length === 0);
}

function getCenteredSlots(count) {
    const centerRow = Math.floor((CYLINDER_ROWS - 1) / 2);
    const angleStep = 360 / CYLINDER_COLS;
    const normalizedOffset = ((CYL_RING_VIEW_OFFSET_DEG % 360) + 360) % 360;
    const frontAngle = (180 - normalizedOffset + 360) % 360;
    const frontCol = Math.round(frontAngle / angleStep) % CYLINDER_COLS;
    const centeredSlots = [];

    for (let row = 0; row < CYLINDER_ROWS; row += 1) {
        for (let col = 0; col < CYLINDER_COLS; col += 1) {
            const rowDist = Math.abs(row - centerRow);
            const rawColDist = Math.abs(col - frontCol);
            const colDist = Math.min(rawColDist, CYLINDER_COLS - rawColDist);
            centeredSlots.push({ row, col, rowDist, colDist });
        }
    }

    centeredSlots.sort((a, b) => {
        const scoreA = a.rowDist * 100 + a.colDist;
        const scoreB = b.rowDist * 100 + b.colDist;
        if (scoreA !== scoreB) return scoreA - scoreB;
        if (a.rowDist !== b.rowDist) return a.rowDist - b.rowDist;
        if (a.colDist !== b.colDist) return a.colDist - b.colDist;
        if (a.col !== b.col) return a.col - b.col;
        return a.row - b.row;
    });

    return centeredSlots.slice(0, count);
}

function updateCylinderCardTransforms() {
    const ring = document.getElementById('cylinder-ring');
    if (!ring || cylinderCurrentPageCount <= 0) return;

    const n = cylinderCurrentPageCount;
    const cards = Array.from(ring.querySelectorAll('.cylinder-card'));
    if (!cards.length) return;

    const angleStep = 360 / CYLINDER_COLS;
    cylinderRingRadius = (((CYL_CARD_WIDTH + CYL_GAP_X) * CYLINDER_COLS) / (2 * Math.PI)) * cylinderRadiusMultiplier;
    cylinderCameraDepthTarget = Math.min(CYL_PERSPECTIVE - 140, cylinderRingRadius + 220) - cylinderCameraZoomOut;
    if (!cylinderCameraDepth) {
        cylinderCameraDepth = cylinderCameraDepthTarget;
    }

    const rowsInUse = Math.max(CYLINDER_ROWS, Math.ceil(n / CYLINDER_COLS));
    const totalHeight = rowsInUse * CYL_CARD_HEIGHT + (rowsInUse - 1) * CYL_GAP_Y;
    const slots = getCenteredSlots(n);

    cards.forEach((card, i) => {
        const slot = slots[i];
        if (!slot) return;
        const angle = slot.col * angleStep;
        const y = slot.row * (CYL_CARD_HEIGHT + CYL_GAP_Y) - totalHeight / 2 + CYL_CARD_HEIGHT / 2;
        card.style.transform = `translateY(${y}px) rotateY(${angle}deg) translateZ(${cylinderRingRadius}px) rotateY(180deg)`;
    });
}

function buildCylinder(options = {}) {
    const { animateIn = true, preserveRotation = false } = options;
    const ring = document.getElementById('cylinder-ring');
    if (!ring) return;
    ring.innerHTML = '';

    const start = cylinderPage * CYLINDER_PAGE_SIZE;
    const pageProducts = filteredProducts.slice(start, start + CYLINDER_PAGE_SIZE);
    const n = pageProducts.length;
    cylinderCurrentPageCount = n;

    updateNoResultsState();

    if (n === 0) {
        updateCylinderPagination();
        return;
    }

    const slots = getCenteredSlots(n);

    pageProducts.forEach((product, i) => {
        const filteredIdx = start + i;
        const slot = slots[i] || { row: 0, col: 0 };

        const card = document.createElement('div');
        card.className = 'cylinder-card';
        card.dataset.index = String(filteredIdx);
        card.innerHTML = `<img src="${product.images[0]}" alt="${product.name}" draggable="false" loading="eager" decoding="async">`;
        card.style.opacity = animateIn ? '0' : '1';
        card.style.transform = `translateY(0px) rotateY(${slot.col * (360 / CYLINDER_COLS)}deg) translateZ(0px) rotateY(180deg)`;
        card.addEventListener('click', () => {
            if (cylinderDragMoved) return;
            openOverlay(parseInt(card.dataset.index, 10));
        });
        ring.appendChild(card);
    });

    updateCylinderCardTransforms();

    if (!preserveRotation) {
        cylinderAngle = 0;
        cylinderDragTargetAngle = 0;
        cylinderVelocity = 0;
    }

    applyRingRotation();
    updateCylinderPagination();
    if (animateIn) animateCylinderCardsIn();
}

function changeCylinderPage(nextPage) {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / CYLINDER_PAGE_SIZE));
    const clampedPage = Math.max(0, Math.min(totalPages - 1, nextPage));
    if (clampedPage === cylinderPage) return;
    markCylinderInteraction();

    const ring = document.getElementById('cylinder-ring');
    if (!ring || typeof anime === 'undefined') {
        cylinderPage = clampedPage;
        buildCylinder({ animateIn: true });
        return;
    }

    const cards = ring.querySelectorAll('.cylinder-card');
    anime({
        targets: cards,
        opacity: [1, 0],
        duration: 130,
        delay: anime.stagger(4),
        easing: 'easeInQuad',
        complete: () => {
            cylinderPage = clampedPage;
            buildCylinder({ animateIn: true });
        }
    });
}

function applyRingRotation() {
    const ring = document.getElementById('cylinder-ring');
    if (ring) ring.style.transform = `rotateY(${-cylinderAngle + CYL_RING_VIEW_OFFSET_DEG}deg)`;
}

function updateCylinderPointer(clientX, clientY) {
    if (!document.body.classList.contains('cylinder-mode')) return;
    if (isMobileUiActive()) {
        cylinderPointerX = 0;
        cylinderPointerY = 0;
        return;
    }
    if (isOverlayOpen() || isProductFilterOverlayOpen() || cylinderIsDragging) return;
    const nx = clientX / window.innerWidth;
    const ny = clientY / window.innerHeight;
    cylinderPointerX = (nx - 0.5) * 2;
    cylinderPointerY = (ny - 0.5) * 2;
}

function updatePointedCard(clientX, clientY) {
    if (!document.body.classList.contains('cylinder-mode')) return;
    if (isMobileUiActive()) {
        clearPointedCard();
        return;
    }
    if (isOverlayOpen() || isProductFilterOverlayOpen() || cylinderIsDragging) return;
    const now = performance.now();
    if (now - cylinderLastPointedCheckAt < 16) return;
    cylinderLastPointedCheckAt = now;

    const offsets = [[0, 0], [8, 0], [-8, 0], [0, 8], [0, -8]];
    let card = null;
    for (const [ox, oy] of offsets) {
        const el = document.elementFromPoint(clientX + ox, clientY + oy);
        if (!el) continue;
        const found = el.closest('.cylinder-card');
        if (found) {
            card = found;
            break;
        }
    }

    if (cylinderPointedCard === card) return;
    clearPointedCard();
    cylinderPointedCard = card;
    if (cylinderPointedCard) cylinderPointedCard.classList.add('is-pointed');
}

function applyCylinderCameraTransform() {
    const camera = document.getElementById('cylinder-camera');
    if (!camera) return;

    let effectiveTiltX = cylinderCameraTiltX;
    let effectiveTiltY = cylinderCameraTiltY;
    let effectiveLerp = cylinderCameraLerp;
    let effectiveEdgeExp = cylinderPointerEdgeExp;

    const r = Math.sqrt(cylinderPointerX * cylinderPointerX + cylinderPointerY * cylinderPointerY);
    const nr = Math.min(r / Math.SQRT2, 1); // 0=center, 1=corner
    // Smoothstep: center behaves like Normal, edges like Edge+.
    const t0 = 0.28;
    const t1 = 0.72;
    const raw = Math.max(0, Math.min(1, (nr - t0) / (t1 - t0)));
    const t = raw * raw * (3 - 2 * raw);

    effectiveTiltX = CYL_CAMERA_CENTER_TUNING.tiltX + (CYL_CAMERA_EDGE_TUNING.tiltX - CYL_CAMERA_CENTER_TUNING.tiltX) * t;
    effectiveTiltY = CYL_CAMERA_CENTER_TUNING.tiltY + (CYL_CAMERA_EDGE_TUNING.tiltY - CYL_CAMERA_CENTER_TUNING.tiltY) * t;
    effectiveLerp = CYL_CAMERA_CENTER_TUNING.lerp + (CYL_CAMERA_EDGE_TUNING.lerp - CYL_CAMERA_CENTER_TUNING.lerp) * t;
    effectiveEdgeExp = CYL_CAMERA_CENTER_TUNING.edgeExp + (CYL_CAMERA_EDGE_TUNING.edgeExp - CYL_CAMERA_CENTER_TUNING.edgeExp) * t;

    const pointerX = Math.sign(cylinderPointerX) * Math.pow(Math.abs(cylinderPointerX), effectiveEdgeExp);
    const pointerY = Math.sign(cylinderPointerY) * Math.pow(Math.abs(cylinderPointerY), effectiveEdgeExp);
    const targetX = -pointerY * effectiveTiltX;
    const targetY = pointerX * effectiveTiltY;
    cylinderCameraDepth += (cylinderCameraDepthTarget - cylinderCameraDepth) * 0.16;
    cylinderCameraOffsetY += (cylinderCameraOffsetYTarget - cylinderCameraOffsetY) * 0.14;
    cylinderCameraX += (targetX - cylinderCameraX) * effectiveLerp;
    cylinderCameraY += (targetY - cylinderCameraY) * effectiveLerp;
    camera.style.transform = `translateY(${cylinderCameraOffsetY}px) translateZ(${cylinderCameraDepth}px) rotateX(${cylinderCameraX}deg) rotateY(${cylinderCameraY}deg)`;
    cylinderCameraRafId = requestAnimationFrame(applyCylinderCameraTransform);
}

function cylinderAnimLoop() {
    cylinderRadiusMultiplier += (cylinderTargetRadiusMultiplier - cylinderRadiusMultiplier) * CYL_RADIUS_LERP;
    const zoomDelta = cylinderCameraZoomOutTarget - cylinderCameraZoomOut;
    cylinderCameraZoomOut += zoomDelta * 0.06;
    const needsRadiusUpdate = Math.abs(cylinderTargetRadiusMultiplier - cylinderRadiusMultiplier) > 0.0004;
    const needsZoomUpdate = Math.abs(zoomDelta) > 0.4;
    if (needsRadiusUpdate || needsZoomUpdate) {
        updateCylinderCardTransforms();
    }

    if (cylinderIsDragging) {
        const dragLerp = cylinderInputMode === 'touch' ? CYL_TOUCH_DRAG_LERP : CYL_DRAG_LERP;
        cylinderAngle += (cylinderDragTargetAngle - cylinderAngle) * dragLerp;
        applyRingRotation();
        cylinderRafId = requestAnimationFrame(cylinderAnimLoop);
        return;
    }

    const now = performance.now();
    const idleMs = now - cylinderLastInteractionAt;
    const shouldAutoRotate = !isOverlayOpen() && idleMs >= CYL_AUTO_ROT_DELAY_MS;
    const autoTarget = shouldAutoRotate ? 1 : 0;
    cylinderAutoRotateBlend += (autoTarget - cylinderAutoRotateBlend) * CYL_AUTO_ROT_BLEND_LERP;

    cylinderAngle += cylinderVelocity + (CYL_AUTO_ROT_SPEED * cylinderAutoRotateBlend);
    const inertia = cylinderInputMode === 'touch' ? CYL_TOUCH_INERTIA : CYL_INERTIA;
    cylinderVelocity *= inertia;
    if (Math.abs(cylinderVelocity) < 0.0005) {
        cylinderVelocity = 0;
    }
    applyRingRotation();
    cylinderRafId = requestAnimationFrame(cylinderAnimLoop);
}

function initCylinderDrag() {
    const scene = document.querySelector('.cylinder-scene');
    if (!scene) return;

    window.addEventListener('mousemove', (e) => {
        markCylinderInteraction();
        updateCylinderPointer(e.clientX, e.clientY);
        updatePointedCard(e.clientX, e.clientY);
    });

    window.addEventListener('mouseleave', () => {
        cylinderPointerX = 0;
        cylinderPointerY = 0;
        clearPointedCard();
    });

    scene.addEventListener('mousedown', (e) => {
        markCylinderInteraction();
        cylinderInputMode = 'mouse';
        cylinderIsDragging = true;
        cylinderDragMoved = false;
        cylinderDragStartX = e.clientX;
        cylinderDragStartAngle = cylinderAngle;
        cylinderDragTargetAngle = cylinderAngle;
        cylinderPointerX = 0;
        cylinderPointerY = 0;
        cylinderLastDragX = e.clientX;
        cylinderLastDragTime = Date.now();
        cylinderVelocity = 0;
        scene.classList.add('dragging');
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!cylinderIsDragging) return;
        markCylinderInteraction();
        const rotFactor = cylinderInputMode === 'touch' ? CYL_TOUCH_DRAG_ROT_FACTOR : CYL_DRAG_ROT_FACTOR;
        const velFactor = cylinderInputMode === 'touch' ? CYL_TOUCH_VELOCITY_FACTOR : CYL_VELOCITY_FACTOR;
        const dx = e.clientX - cylinderDragStartX;
        if (Math.abs(dx) > 4) cylinderDragMoved = true;
        const targetAngle = cylinderDragStartAngle + dx * rotFactor;
        const now = Date.now();
        const dt = Math.max(now - cylinderLastDragTime, 1);
        const targetVelocity = (targetAngle - cylinderDragTargetAngle) / dt * velFactor;
        cylinderVelocity = cylinderVelocity * 0.72 + targetVelocity * 0.28;
        cylinderDragTargetAngle = targetAngle;
        cylinderLastDragX = e.clientX;
        cylinderLastDragTime = now;
    });

    window.addEventListener('mouseup', () => {
        if (!cylinderIsDragging) return;
        markCylinderInteraction();
        cylinderIsDragging = false;
        setTimeout(() => {
            cylinderDragMoved = false;
        }, 0);
        scene.classList.remove('dragging');
    });

    scene.addEventListener('touchstart', (e) => {
        markCylinderInteraction();
        cylinderInputMode = 'touch';

        if (e.touches.length >= 2) {
            cylinderIsPinching = true;
            cylinderIsDragging = false;
            cylinderDragMoved = true;
            cylinderVelocity = 0;
            cylinderPointerX = 0;
            cylinderPointerY = 0;
            clearPointedCard();
            cylinderPinchStartDistance = getTouchDistance(e.touches[0], e.touches[1]);
            cylinderPinchStartSliderValue = cylinderSliderValue;
            return;
        }

        const touch = e.touches[0];
        cylinderIsDragging = true;
        cylinderIsPinching = false;
        cylinderDragMoved = false;
        cylinderDragStartX = touch.clientX;
        cylinderDragStartAngle = cylinderAngle;
        cylinderDragTargetAngle = cylinderAngle;
        cylinderTouchDragOriginY = touch.clientY;
        cylinderTouchCameraOffsetStart = cylinderCameraOffsetYTarget;
        cylinderTouchGestureAxis = 'pending';
        cylinderPointerX = 0;
        cylinderPointerY = 0;
        cylinderLastDragX = touch.clientX;
        cylinderLastDragTime = Date.now();
        cylinderVelocity = 0;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        markCylinderInteraction();

        if (e.touches.length >= 2 && !cylinderIsPinching) {
            cylinderIsPinching = true;
            cylinderIsDragging = false;
            cylinderDragMoved = true;
            cylinderVelocity = 0;
            cylinderPointerX = 0;
            cylinderPointerY = 0;
            clearPointedCard();
            cylinderPinchStartDistance = getTouchDistance(e.touches[0], e.touches[1]);
            cylinderPinchStartSliderValue = cylinderSliderValue;
        }

        if (cylinderIsPinching) {
            if (e.touches.length < 2) {
                cylinderIsPinching = false;
                return;
            }

            const distance = getTouchDistance(e.touches[0], e.touches[1]);
            const delta = (distance - cylinderPinchStartDistance) * CYL_PINCH_RADIUS_SENSITIVITY;
            const next = cylinderPinchStartSliderValue + delta;
            applyCylinderRadiusFromSliderValue(next);
            e.preventDefault();
            return;
        }

        const touch = e.touches[0];
        updateCylinderPointer(touch.clientX, touch.clientY);
        updatePointedCard(touch.clientX, touch.clientY);
        if (!cylinderIsDragging) return;
        const rotFactor = getTouchRotationFactor();
        const velFactor = CYL_TOUCH_VELOCITY_FACTOR;
        const dx = touch.clientX - cylinderDragStartX;
        const dy = touch.clientY - cylinderTouchDragOriginY;

        if (cylinderTouchGestureAxis === 'pending') {
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (absDx > CYL_TOUCH_AXIS_LOCK_THRESHOLD_PX || absDy > CYL_TOUCH_AXIS_LOCK_THRESHOLD_PX) {
                if (absDy > absDx * CYL_TOUCH_AXIS_LOCK_RATIO) {
                    cylinderTouchGestureAxis = 'vertical';
                } else if (absDx > absDy * CYL_TOUCH_AXIS_LOCK_RATIO) {
                    cylinderTouchGestureAxis = 'horizontal';
                } else {
                    cylinderTouchGestureAxis = 'free';
                }
            }
        }

        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) cylinderDragMoved = true;

        let effectiveDx = dx;
        let effectiveDy = dy;

        if (cylinderTouchGestureAxis === 'vertical') {
            effectiveDx = dx * CYL_TOUCH_VERTICAL_ROTATION_ATTENUATION;
        } else if (cylinderTouchGestureAxis === 'horizontal') {
            effectiveDy = dy * CYL_TOUCH_HORIZONTAL_VERTICAL_ATTENUATION;
        }

        const targetAngle = cylinderDragStartAngle + effectiveDx * rotFactor;
        const now = Date.now();
        const dt = Math.max(now - cylinderLastDragTime, 1);
        const targetVelocity = (targetAngle - cylinderDragTargetAngle) / dt * velFactor;
        cylinderVelocity = cylinderVelocity * 0.72 + targetVelocity * 0.28;
        cylinderDragTargetAngle = targetAngle;
        cylinderCameraOffsetYTarget = clampTouchCameraOffsetY(cylinderTouchCameraOffsetStart + (effectiveDy * CYL_TOUCH_VERTICAL_SENSITIVITY));
        cylinderLastDragX = touch.clientX;
        cylinderLastDragTime = now;
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        markCylinderInteraction();

        if (e.touches.length < 2) {
            cylinderIsPinching = false;
        }

        if (e.touches.length > 0 || !cylinderIsDragging) return;
        cylinderIsDragging = false;
        cylinderTouchGestureAxis = 'pending';
        cylinderCameraOffsetYTarget = clampTouchCameraOffsetY(cylinderCameraOffsetYTarget);
        setTimeout(() => {
            cylinderDragMoved = false;
        }, 0);
    });

    window.addEventListener('touchcancel', () => {
        cylinderIsDragging = false;
        cylinderIsPinching = false;
        cylinderTouchGestureAxis = 'pending';
        cylinderCameraOffsetYTarget = clampTouchCameraOffsetY(cylinderCameraOffsetYTarget);
    });
}

function updateCylinderPagination() {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / CYLINDER_PAGE_SIZE));
    const info = document.getElementById('cyl-page-info');
    const prevBtn = document.getElementById('cyl-prev-page');
    const nextBtn = document.getElementById('cyl-next-page');
    if (info) info.textContent = `${totalPages === 1 && filteredProducts.length === 0 ? 0 : cylinderPage + 1} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = cylinderPage <= 0 || filteredProducts.length === 0;
    if (nextBtn) nextBtn.disabled = cylinderPage >= totalPages - 1 || filteredProducts.length === 0;
}

function initCylinderControls() {
    const slider = document.getElementById('cyl-radius-slider');
    const valueLabel = document.getElementById('cyl-radius-value');
    const scene = document.querySelector('.cylinder-scene');
    if (!slider || !valueLabel) return;

    const bounds = getRadiusSliderBounds();
    slider.min = String(bounds.min);
    slider.max = String(bounds.max);
    cylinderSliderValue = Math.max(bounds.min, Math.min(bounds.max, cylinderSliderValue));

    slider.value = String(cylinderSliderValue);
    valueLabel.textContent = `${cylinderSliderValue.toFixed(2)}x`;
    applyCylinderRadiusFromSliderValue(cylinderSliderValue);
    applyCameraProfile();

    slider.addEventListener('input', () => {
        markCylinderInteraction();
        applyCylinderRadiusFromSliderValue(parseFloat(slider.value));
    });

    if (scene) {
        scene.addEventListener('wheel', (event) => {
            if (isOverlayOpen() || isProductFilterOverlayOpen()) return;

            let deltaPx = event.deltaY;
            if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
                deltaPx *= CYL_WHEEL_LINE_PX;
            } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
                deltaPx *= window.innerHeight;
            }

            const deltaSlider = -deltaPx * CYL_WHEEL_RADIUS_SENSITIVITY;
            if (!Number.isFinite(deltaSlider) || deltaSlider === 0) return;

            const current = parseFloat(slider.value);
            const wheelBounds = getRadiusSliderBounds();
            const next = Math.max(wheelBounds.min, Math.min(wheelBounds.max, current + deltaSlider));
            if (Math.abs(next - current) < 0.0001) return;

            event.preventDefault();
            markCylinderInteraction();
            applyCylinderRadiusFromSliderValue(next);
        }, { passive: false });
    }
}

function initCylinderView() {
    cylinderPage = 0;
    markCylinderInteraction();
    buildCylinder({ animateIn: true });
    initCylinderDrag();
    initCylinderControls();
    if (!cylinderRafId) {
        cylinderRafId = requestAnimationFrame(cylinderAnimLoop);
    }
    if (!cylinderCameraRafId) {
        cylinderCameraRafId = requestAnimationFrame(applyCylinderCameraTransform);
    }

    document.getElementById('cyl-prev-page').addEventListener('click', () => {
        changeCylinderPage(cylinderPage - 1);
    });
    document.getElementById('cyl-next-page').addEventListener('click', () => {
        changeCylinderPage(cylinderPage + 1);
    });
}

function applyDarkMode(dark) {
    document.body.classList.toggle('dark-mode', dark);
    const moon = document.getElementById('dm-moon');
    const sun  = document.getElementById('dm-sun');
    const btn  = document.getElementById('dark-mode-btn');
    if (moon) moon.style.display = dark ? 'none' : '';
    if (sun)  sun.style.display  = dark ? '' : 'none';
    if (btn)  btn.setAttribute('aria-label', dark ? 'Modo claro' : 'Modo oscuro');
}

function initDarkMode() {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    // Default = dark mode; respect device's explicit light preference when no stored choice
    const isDark = stored !== null
        ? stored === 'true'
        : !window.matchMedia('(prefers-color-scheme: light)').matches;
    applyDarkMode(isDark);
    const btn = document.getElementById('dark-mode-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            const nowDark = !document.body.classList.contains('dark-mode');
            applyDarkMode(nowDark);
            localStorage.setItem(DARK_MODE_KEY, String(nowDark));
        });
    }
}

function initMobileUiScaffold() {
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    const syncMobileClass = () => {
        document.body.classList.toggle('mobile-ui', mobileQuery.matches);
    };

    syncMobileClass();

    if (typeof mobileQuery.addEventListener === 'function') {
        mobileQuery.addEventListener('change', syncMobileClass);
    } else if (typeof mobileQuery.addListener === 'function') {
        mobileQuery.addListener(syncMobileClass);
    }
}

function initIndependentTapToggles() {
    const selectors = [
        '.social-buttons .social-btn',
        '#whatsapp-btn',
        '#instagram-btn',
        '#bulk-whatsapp-btn'
    ];

    const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
    nodes.forEach((node) => {
        node.addEventListener('click', () => {
            if (!isMobileUiActive()) return;
            node.classList.toggle('tap-active');
        });

        if (node.matches('.social-buttons .whatsapp-btn')) {
            node.addEventListener('click', () => {
                trackWhatsAppClick('header', 'cta');
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileUiScaffold();
    favoriteProductIds = loadFavoriteIds();
    const storedRadius = loadStoredRadiusMultiplier();
    cylinderSliderValue = storedRadius;

    if (storedRadius < CYL_RADIUS_PHYSICAL_MIN) {
        cylinderRadiusMultiplier = CYL_RADIUS_PHYSICAL_MIN;
        cylinderTargetRadiusMultiplier = CYL_RADIUS_PHYSICAL_MIN;
        cylinderCameraZoomOut = (CYL_RADIUS_PHYSICAL_MIN - storedRadius) * CYL_CAMERA_ZOOM_OUT_MAX;
        cylinderCameraZoomOutTarget = cylinderCameraZoomOut;
    } else {
        cylinderRadiusMultiplier = storedRadius;
        cylinderTargetRadiusMultiplier = storedRadius;
    }
    allProducts = products.map(normalizeProduct);
    shuffledProducts = shuffleArray([...allProducts]);

    document.body.classList.add('cylinder-mode');
    clearAllFilters();
    applyProductFilters({ preservePage: false });

    initCylinderView();
    initProductFilterModal();
    initDarkMode();
    initIndependentTapToggles();
    renderProductFilterUI();

    const logo3D = document.querySelector('model-viewer');
    const logo3DContainer = document.querySelector('.logo-3d-container');
    if (logo3D && logo3DContainer) {
        logo3DContainer.addEventListener('mouseenter', () => {
            logo3D.autoRotate = false;
        });

        logo3DContainer.addEventListener('mouseleave', () => {
            logo3D.autoRotate = true;
        });
    }
});
