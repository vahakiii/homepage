
function ensureDebugPanel() {
    if (debugPanel) return;
    debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.className = 'debug-panel';
        debugPanel.style.display = 'none';

        debugPanel.innerHTML = `
            <div class="debug-panel__header">
                <div class="debug-panel__brand">
                    <i class="debug-panel__brand-icon fa-solid fa-bug"></i>
                    <span class="debug-panel__label">DEBUG</span>
                </div>
                <div class="debug-panel__controls">
                    <button type="button" onclick="toggleDebugPanel()" 
                            class="debug-panel__btn debug-panel__btn--close"
                            title="Close debug panel">
                        <i class="debug-panel__btn-icon fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
            <div id="debug-content" class="debug-panel__content"></div>
        `;

        document.body.appendChild(debugPanel);

        debugPanel.style.cursor = 'grab';
        debugPanel.style.touchAction = 'none';
        debugPanel.style.msTouchAction = 'none';
        debugPanel.style.webkitUserSelect = 'none';
        debugPanel.style.userSelect = 'none';

        function debugDragPoint(e) {
            if (e.touches && e.touches.length) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            if (e.changedTouches && e.changedTouches.length) {
                return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        function startDebugDrag(e) {
            if (e.type === 'mousedown' && e.button !== 0) return;
            if (e.touches && e.touches.length > 1) return;
            if (e.target.closest('button')) return;

            const point = debugDragPoint(e);
            isDraggingDebug = true;
            const rect = debugPanel.getBoundingClientRect();
            debugDragOffsetX = point.x - rect.left;
            debugDragOffsetY = point.y - rect.top;
            debugPanel.style.transition = 'none';
            debugPanel.style.cursor = 'grabbing';
            if (!debugPanel.style.left || debugPanel.style.left === 'auto') {
                debugPanel.style.left = rect.left + 'px';
                debugPanel.style.top = rect.top + 'px';
                debugPanel.style.right = 'auto';
            }
            if (e.cancelable) e.preventDefault();
        }

        function moveDebugDrag(e) {
            if (!isDraggingDebug || !debugPanel) return;
            if (e.touches && e.touches.length > 1) return;
            if (e.cancelable) e.preventDefault();

            const point = debugDragPoint(e);
            debugPanel.style.left = (point.x - debugDragOffsetX) + 'px';
            debugPanel.style.top = (point.y - debugDragOffsetY) + 'px';
        }

        function endDebugDrag(e) {
            if (!isDraggingDebug || !debugPanel) return;
            if (e && e.touches && e.touches.length > 0) return;

            isDraggingDebug = false;
            debugPanel.style.transition = '';
            debugPanel.style.cursor = 'grab';
            const rect = debugPanel.getBoundingClientRect();
            const padding = 12;
            const maxLeft = window.innerWidth - rect.width - padding;
            const maxTop = window.innerHeight - rect.height - padding;

            let clampedLeft = Math.max(padding, Math.min(parseFloat(debugPanel.style.left) || rect.left, maxLeft));
            let clampedTop = Math.max(padding, Math.min(parseFloat(debugPanel.style.top) || rect.top, maxTop));

            debugPanel.style.left = clampedLeft + 'px';
            debugPanel.style.top = clampedTop + 'px';
        }

        debugPanel.addEventListener('mousedown', startDebugDrag);
        debugPanel.addEventListener('touchstart', startDebugDrag, { passive: false });
        document.addEventListener('mousemove', moveDebugDrag);
        document.addEventListener('touchmove', moveDebugDrag, { passive: false });
        document.addEventListener('mouseup', endDebugDrag);
        document.addEventListener('touchend', endDebugDrag);
        document.addEventListener('touchcancel', endDebugDrag);

        window.addEventListener('resize', () => {
            if (isDebugPanelOpen()) {
                updateDebugInfo();
                const rect = debugPanel.getBoundingClientRect();
                const padding = 12;
                if (rect.left < padding || rect.top < padding ||
                    rect.right > window.innerWidth - padding || rect.bottom > window.innerHeight - padding) {
                    const maxLeft = window.innerWidth - rect.width - padding;
                    const maxTop = window.innerHeight - rect.height - padding;
                    debugPanel.style.left = Math.max(padding, Math.min(rect.left, maxLeft)) + 'px';
                    debugPanel.style.top = Math.max(padding, Math.min(rect.top, maxTop)) + 'px';
                }
            }
        });
}

function toggleDebugPanel() {
    // Not a ui-modal — display + .is-open only; Esc does not close
    ensureDebugPanel();
    setDebugPanelOpen(!isDebugPanelOpen());
}

function setDebugPanelOpen(open) {
    ensureDebugPanel();

    const currentlyOpen = isDebugPanelOpen();
    if (!!open === currentlyOpen) {
        if (open) updateDebugInfo();
        if (typeof syncDebugSettingsCheckbox === 'function') syncDebugSettingsCheckbox();
        return;
    }

    if (open) {
        debugPanel.style.display = 'block';
        debugPanel.classList.add('is-open');
        updateDebugInfo();

        if (!debugUpdateInterval) {
            debugUpdateInterval = setInterval(() => {
                if (isDebugPanelOpen()) {
                    updateDebugInfo();
                }
            }, 250);
        }
    } else {
        debugPanel.style.display = 'none';
        debugPanel.classList.remove('is-open');
        if (debugUpdateInterval) {
            clearInterval(debugUpdateInterval);
            debugUpdateInterval = null;
        }
    }

    if (typeof syncDebugSettingsCheckbox === 'function') syncDebugSettingsCheckbox();
}



// --- Debug panel ---

let debugPanel = null;
let debugUpdateInterval = null;

function isDebugPanelOpen() {
    return !!(debugPanel && debugPanel.style.display !== 'none');
}

let isDraggingDebug = false;
let debugDragOffsetX = 0;
let debugDragOffsetY = 0;

function updateDebugInfo() {
    if (!debugPanel) return;
    const content = debugPanel.querySelector('#debug-content');
    if (!content) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = (typeof getDevicePixelRatio === 'function')
        ? getDevicePixelRatio()
        : (Number(window.devicePixelRatio) || 1);

    const linkCount = (typeof links !== 'undefined' && Array.isArray(links)) ? links.length : 0;
    const categoryCount = (typeof getAllCategories === 'function') ? getAllCategories().length : 0;

    let commonEmojiCount = 0;
    if (typeof COMMON_EMOJIS === 'object' && COMMON_EMOJIS !== null) {
        Object.values(COMMON_EMOJIS).forEach(arr => {
            if (Array.isArray(arr)) commonEmojiCount += arr.length;
        });
    }

    content.innerHTML = `
        <div class="debug-panel__row">
            <span class="debug-panel__key">Window Width</span>
            <span class="debug-panel__val debug-panel__val--size">${w} <span class="debug-panel__unit">px</span></span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">Window Height</span>
            <span class="debug-panel__val debug-panel__val--size">${h} <span class="debug-panel__unit">px</span></span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">DPR</span>
            <span class="debug-panel__val debug-panel__val--size">${dpr}</span>
        </div>

        <!-- Data Stats -->
        <div class="debug-panel__row debug-panel__row--group">
            <span class="debug-panel__key">Link Cards</span>
            <span class="debug-panel__val debug-panel__val--count">${linkCount}</span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">Keyboard Card Index</span>
            <span class="debug-panel__val debug-panel__val--index">${keyboardFocusedIndex}</span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">Categories</span>
            <span class="debug-panel__val debug-panel__val--count">${categoryCount}</span>
        </div>
        <div class="debug-panel__row debug-panel__row--last">
            <span class="debug-panel__key">COMMON_EMOJIS</span>
            <span class="debug-panel__val debug-panel__val--count">${commonEmojiCount}</span>
        </div>
    `;
}



