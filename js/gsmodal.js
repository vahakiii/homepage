function getSearchModalPanel(modal) {
    return modal ? (modal.querySelector('.search-modal__panel') || modal.querySelector('.modal')) : null;
}

function resetSearchModalPanelStyles(content) {
    if (!content) return;
    content.style.left = '';
    content.style.top = '';
    content.style.transform = '';
    content.style.position = '';
    content.style.margin = '';
}

function openSearchModal() {
    const modal = document.getElementById('search-modal');
    const content = getSearchModalPanel(modal);
    const input = document.getElementById('search-modal-input');

    if (!modal || !input || !content) return;

    resetSearchModalPanelStyles(content);
    openUiModal('search-modal');

    input.value = '';
    setTimeout(() => {
        input.focus();
    }, 50);

    setupSearchModalDragging(modal);
}

function closeSearchModal() {
    const modal = document.getElementById('search-modal');
    closeUiModal('search-modal');
    resetSearchModalPanelStyles(getSearchModalPanel(modal));
    restoreLinkSearchFocus();
}

/** Draggable search modal with viewport clamp on release. */
function setupSearchModalDragging(modal) {
    const content = getSearchModalPanel(modal);
    if (!content || content.dataset.draggable === 'true') return;

    content.dataset.draggable = 'true';
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    content.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = content.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        content.style.transition = 'none';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        content.style.position = 'fixed';
        content.style.left = `${newLeft}px`;
        content.style.top = `${newTop}px`;
        content.style.margin = '0';
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;

        content.style.transition = '';
        document.body.style.userSelect = '';

        const rect = content.getBoundingClientRect();
        const padding = 8;

        let finalLeft = rect.left;
        let finalTop = rect.top;

        if (finalLeft < padding) finalLeft = padding;
        if (finalLeft + rect.width > window.innerWidth - padding) {
            finalLeft = window.innerWidth - rect.width - padding;
        }

        if (finalTop < padding) finalTop = padding;
        if (finalTop + rect.height > window.innerHeight - padding) {
            finalTop = window.innerHeight - rect.height - padding;
        }

        content.style.left = `${finalLeft}px`;
        content.style.top = `${finalTop}px`;
    });
}