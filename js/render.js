let categorySidebarObserver = null;

/** Refocus active/first category after mouse filter change. */
function focusSidebarActiveItem() {
    setTimeout(() => {
        const sidebar = document.getElementById('categories-sidebar');
        if (sidebar) {
            const activeItem = sidebar.querySelector('.sidebar-category.active') || sidebar.querySelector('.sidebar-category');
            if (activeItem) activeItem.focus();
        }
    }, 0);
}

function renderCategoriesSidebar() {
    const container = document.getElementById('categories-sidebar');
    container.innerHTML = '';

    let cats = getAllCategories();
    if (categorySearchTerm) {
        const term = categorySearchTerm.toLowerCase();
        cats = cats.filter(c => c.toLowerCase().includes(term));
    }

    const all = document.createElement('div');
    all.className = `sidebar-category sidebar-category--all${!currentFilterCategory ? ' active' : ''}`;
    all.setAttribute('tabindex', '0');
    all.innerHTML = `
        <div class="sidebar-category__main">
            <i class="fa-solid fa-list"></i>
            <span>All Links</span>
        </div>
        <span class="sidebar-category__count">${links.length}</span>
    `;
    all.onclick = () => {
        clearCategoryFilter();
        focusSidebarActiveItem();
    };
    container.appendChild(all);

    if (cats.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'sidebar-category-empty';
        empty.textContent = categorySearchTerm ? 'No matches' : 'No categories yet';
        container.appendChild(empty);
        return;
    }

    cats.forEach(cat => {
        const count = links.filter(l => Array.isArray(l.categories) && l.categories.includes(cat)).length;
        const div = document.createElement('div');
        div.className = `sidebar-category sidebar-category--item${currentFilterCategory === cat ? ' active' : ''}`;
        div.setAttribute('tabindex', '0');
        div.onclick = () => {
            filterByCategory(cat);
            focusSidebarActiveItem();
        };
        div.innerHTML = `
            <div class="sidebar-category__main">
                <i class="fa-solid fa-tag"></i>
                <span class="sidebar-category__label">${escapeHtml(cat)}</span>
            </div>
            <div class="sidebar-category__meta">
                <span class="sidebar-category__count">${count}</span>
                <div class="category-action sidebar-category__actions">
                    <button type="button" class="sidebar-category__action sidebar-category__action--rename" title="Rename"><i class="fa-solid fa-edit"></i></button>
                    <button type="button" class="sidebar-category__action sidebar-category__action--delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        div.querySelector('.sidebar-category__action--rename').addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            renameCategory(cat);
        });
        div.querySelector('.sidebar-category__action--delete').addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            deleteCategory(cat);
        });
        container.appendChild(div);
    });

    setupClearFilterLinkVisibility();
}

/** Show "clear filter" link when first category scrolls out of sidebar view. */
function setupClearFilterLinkVisibility() {
    const sidebar = document.getElementById('categories-sidebar');
    const firstItem = sidebar.querySelector('.sidebar-category');
    const linkContainer = document.getElementById('clear-filter-link-container');
    const clearLink = document.getElementById('clear-filter-link');

    if (!sidebar || !firstItem || !linkContainer || !clearLink) return;

    if (categorySidebarObserver) {
        categorySidebarObserver.disconnect();
    }

    const hasScrollableContent = sidebar.scrollHeight > sidebar.clientHeight + 10;

    if (!hasScrollableContent) {
        linkContainer.classList.add('is-hidden');
        return;
    }

    categorySidebarObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) {
            linkContainer.classList.remove('is-hidden');
        } else {
            linkContainer.classList.add('is-hidden');
        }
    }, {
        root: sidebar,
        threshold: 0.1
    });

    categorySidebarObserver.observe(firstItem);

    clearLink.onclick = () => {
        clearCategoryFilter();
        sidebar.scrollTo({ top: 0, behavior: 'smooth' });
        linkContainer.classList.add('is-hidden');
    };
}

function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, () => []);
    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}

/** Fuzzy link search: ≤4 chars substring only; ≥5 chars allow prefix Levenshtein ≤3. */
function strictSingleWordFuzzyMatch(searchTerm, targetText) {
    if (!searchTerm || !targetText) return false;

    const term = searchTerm.toLowerCase().trim();
    const text = targetText.toLowerCase();

    if (text.includes(term)) return true;

    const searchTokens = term.split(/\s+/).filter(Boolean);
    if (searchTokens.length === 0) return false;

    for (const token of searchTokens) {
        const tokenLen = token.length;

        if (tokenLen <= 4) {
            if (!text.includes(token)) {
                return false;
            }
            continue;
        }

        const prefixLen = tokenLen + 2;
        const targetWords = text.split(/\s+/).filter(w => w.length >= Math.max(5, prefixLen - 2));

        let tokenMatched = false;

        for (const targetWord of targetWords) {
            const targetPrefix = targetWord.substring(0, prefixLen);
            if (levenshteinDistance(token, targetPrefix) <= 3) {
                tokenMatched = true;
                break;
            }
        }

        if (!tokenMatched) {
            return false;
        }
    }

    return true;
}

/** ABC jump rows: first ≤13 labels, then ≤14 per row. Mobile uses one wrapping row. */
function chunkAbcJumpLabels(labels) {
    const rows = [];
    if (!labels || labels.length === 0) return rows;
    rows.push(labels.slice(0, 13));
    for (let i = 13; i < labels.length; i += 14) {
        rows.push(labels.slice(i, i + 14));
    }
    return rows;
}

var lastAbcSectionLabels = [];

function refreshAbcSectionNavLayout() {
    updateAbcSectionNav(lastAbcSectionLabels);
}

function updateAbcSectionNav(sectionLabels) {
    const nav = document.getElementById('abc-section-nav');
    if (!nav) return;

    lastAbcSectionLabels = Array.isArray(sectionLabels) ? sectionLabels.slice() : [];

    nav.innerHTML = '';

    if (sortMode !== 'abc' || lastAbcSectionLabels.length === 0) {
        nav.classList.add('is-hidden');
        return;
    }

    nav.classList.remove('is-hidden');

    const mobile = typeof isMobileBrowser === 'function' && isMobileBrowser();
    const rows = mobile ? [lastAbcSectionLabels] : chunkAbcJumpLabels(lastAbcSectionLabels);

    rows.forEach(rowLabels => {
        const row = document.createElement('div');
        row.className = 'abc-jump-row';

        rowLabels.forEach(label => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'abc-jump-link';
            btn.textContent = label;
            btn.title = 'Jump to ' + label;
            btn.setAttribute('aria-label', 'Jump to section ' + label);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(getAbcSectionElementId(label));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            row.appendChild(btn);
        });

        nav.appendChild(row);
    });
}

/** Tally section order for targetLink; tallyOverride simulates post-click rank. */
function getTallySectionOrderIds(targetLink, tallyOverride) {
    if (!targetLink) return [];

    let filtered = links;

    if (currentFilterCategory) {
        filtered = filtered.filter(l => Array.isArray(l.categories) && l.categories.includes(currentFilterCategory));
    }

    if (linkSearchTerm) {
        const term = linkSearchTerm.trim();
        filtered = filtered.filter(l => {
            const combinedText = [
                l.name || '',
                l.url || '',
                l.description || '',
                ...(Array.isArray(l.categories) ? l.categories : [])
            ].join(' ');

            return strictSingleWordFuzzyMatch(term, combinedText);
        });
    }

    const inFavorites = !!targetLink.isFavorite;
    const section = filtered.filter(l => !!l.isFavorite === inFavorites);
    const tallyOf = (l) => (l.id == targetLink.id ? coerceTally(tallyOverride) : coerceTally(l.tally));

    return [...section]
        .sort((a, b) => tallyOf(b) - tallyOf(a))
        .map(l => l.id);
}

function tallySectionOrderWouldChange(targetLink, oldTally, newTally) {
    const before = getTallySectionOrderIds(targetLink, oldTally);
    const after = getTallySectionOrderIds(targetLink, newTally);
    if (before.length !== after.length) return true;
    for (let i = 0; i < before.length; i++) {
        if (before[i] !== after[i]) return true;
    }
    return false;
}

function dismissOtherLinkCardTooltips(exceptCard) {
    document.querySelectorAll('.link-card').forEach(function (other) {
        if (exceptCard && other === exceptCard) return;
        if (other._tooltipTimeout) {
            clearTimeout(other._tooltipTimeout);
            other._tooltipTimeout = null;
        }
        if (other._tooltipLifeTimer) {
            clearTimeout(other._tooltipLifeTimer);
            other._tooltipLifeTimer = null;
        }
        if (other._tooltipEl) {
            other._tooltipEl.remove();
            other._tooltipEl = null;
        }
    });
    document.querySelectorAll('.link-card-tooltip').forEach(function (el) {
        if (exceptCard && exceptCard._tooltipEl === el) return;
        el.remove();
    });
}

function renderLinks() {
    const grid = document.getElementById('links-grid');

    document.querySelectorAll('.link-card-tooltip').forEach(el => el.remove());

    grid.innerHTML = '';

    const isCompact = (typeof viewMode !== 'undefined' && viewMode === 'compact');
    if (isCompact) {
        grid.className = 'links-grid is-compact';
    } else {
        grid.className = 'links-grid';
    }

    let filtered = links;

    if (currentFilterCategory) {
        filtered = filtered.filter(l => Array.isArray(l.categories) && l.categories.includes(currentFilterCategory));
    }

    if (linkSearchTerm) {
        const term = linkSearchTerm.trim();
        filtered = filtered.filter(l => {
            const combinedText = [
                l.name || '',
                l.url || '',
                l.description || '',
                ...(Array.isArray(l.categories) ? l.categories : [])
            ].join(' ');

            return strictSingleWordFuzzyMatch(term, combinedText);
        });
    }

    if (sortMode === 'default') {
        filtered = [...filtered].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return 0;
        });
    }

    if (sortMode === 'tally') {
        filtered = [...filtered].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return coerceTally(b.tally) - coerceTally(a.tally);
        });
    }

    if (sortMode === 'abc') {
        filtered = [...filtered].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        });
    }

    if (sortMode === 'date') {
        filtered = [...filtered].sort((a, b) => b.id - a.id);
    }

    if (filtered.length === 0) {
        updateAbcSectionNav([]);
        const emptyTitle = currentFilterCategory
            ? 'No links in "' + escapeHtml(currentFilterCategory) + '"'
            : 'No links yet';
        grid.innerHTML = `
            <div class="links-grid__empty">
                <p class="links-grid__empty-title">${emptyTitle}</p>
                <p class="links-grid__empty-hint">Click "Add Link" to get started.</p>
            </div>
        `;
        return;
    }

    const renderItems = [];
    const abcSectionLabels = [];
    if (sortMode === 'abc') {
        const favorites = filtered.filter(l => l.isFavorite);
        const nonFavorites = filtered.filter(l => !l.isFavorite);

        if (favorites.length > 0) {
            abcSectionLabels.push('Favorites');
            renderItems.push({ type: 'header', label: 'Favorites' });
            favorites.forEach(link => renderItems.push({ type: 'link', link }));
        }

        const groups = new Map();
        nonFavorites.forEach(link => {
            const key = getLinkNameSectionKey(link.name);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(link);
        });
        [...groups.keys()].sort(compareAbcSectionKeys).forEach(key => {
            abcSectionLabels.push(key);
            renderItems.push({ type: 'header', label: key });
            groups.get(key).forEach(link => renderItems.push({ type: 'link', link }));
        });
    } else if (sortMode === 'default' || sortMode === 'tally') {
        const favorites = filtered.filter(l => l.isFavorite);
        const bookmarks = filtered.filter(l => !l.isFavorite);

        if (favorites.length > 0) {
            renderItems.push({ type: 'header', label: 'Favorites' });
            favorites.forEach(link => renderItems.push({ type: 'link', link }));
        }
        if (bookmarks.length > 0) {
            renderItems.push({ type: 'header', label: 'Bookmarks' });
            bookmarks.forEach(link => renderItems.push({ type: 'link', link }));
        }
    } else {
        filtered.forEach(link => renderItems.push({ type: 'link', link }));
    }

    updateAbcSectionNav(abcSectionLabels);

    renderItems.forEach(item => {
        if (item.type === 'header') {
            const header = document.createElement('div');
            header.id = getAbcSectionElementId(item.label);
            header.className = 'abc-section-header section-header';
            header.setAttribute('role', 'heading');
            header.setAttribute('aria-level', '3');
            header.textContent = item.label;
            grid.appendChild(header);
            return;
        }

        const link = item.link;
        const card = document.createElement('div');
        card.className = `link-card${isCompact ? ' compact' : ''}`;
        card.dataset.id = link.id;
        card.draggable = !isManualSortLocked();

        if (link.accentColor) {
            card.dataset.accent = link.accentColor;
            card.style.setProperty('--accent-color', ACCENT_COLORS[link.accentColor]);
        }

        if (link.description) {
            card.dataset.description = link.description;
        }

        let catHTML = '';
        if (Array.isArray(link.categories) && link.categories.length) {
            catHTML = `<div class="link-card__cats">${[...link.categories].sort((a, b) => a.localeCompare(b)).map(c => `<span class="category-pill">${escapeHtml(c)}</span>`).join('')}</div>`;
        }

        const descHTML = link.description ? `<div class="link-card__desc">${escapeHtml(link.description)}</div>` : '';

        const formatUrlPreview = (url) => {
            if (!url) return '';
            let formatted = url
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/\/$/, '');
            
            if (formatted.length > 23) {
                formatted = formatted.substring(0, 20) + '...';
            }
            return formatted;
        };

        card.innerHTML = `
            <div class="drag-handle"><i class="fa-solid fa-grip-lines"></i></div>
            <div class="quick-link-icon">${escapeHtml(link.emoji || '🔗')}</div>
            <div class="link-card__body">
                <div class="link-card__name">${escapeHtml(link.name)}</div>
                ${descHTML}
                ${catHTML}
            </div>

            <!-- Right side: URL + Heart + Edit + Delete (right aligned with controlled gap) -->
            <div class="link-card__meta">
                
                <!-- URL -->
                <div class="link-card__url">
                    ${escapeHtml(formatUrlPreview(link.url))}
                </div>

                <!-- Favorite Heart -->
                ${link.isFavorite ? `<i class="link-card__heart fa-solid fa-heart" title="Favorite"></i>` : ''}

                <!-- Edit & Delete Buttons -->
                <div class="link-card__actions">
                    <button data-action="edit" data-id="${escapeHtml(link.id)}" class="edit-btn" title="Edit"><i class="fa-solid fa-edit"></i></button>
                    <button data-action="delete" data-id="${escapeHtml(link.id)}" class="delete-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>

            </div>
        `;

        if (!isManualSortLocked()) {
            card.addEventListener('dragstart', (e) => {
                draggedId = link.id;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';

                if (isCompact) {
                    if (card._tooltipTimeout) {
                        clearTimeout(card._tooltipTimeout);
                        card._tooltipTimeout = null;
                    }
                    if (card._tooltipLifeTimer) {
                        clearTimeout(card._tooltipLifeTimer);
                        card._tooltipLifeTimer = null;
                    }
                    if (card._tooltipEl) {
                        card._tooltipEl.remove();
                        card._tooltipEl = null;
                    }
                    document.querySelectorAll('.link-card-tooltip').forEach(el => el.remove());
                }
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.link-card').forEach(c => c.classList.remove('drag-over','drop-indicator'));
                draggedId = null;
            });
            card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; card.classList.add('drag-over','drop-indicator'); });
            card.addEventListener('dragleave', () => card.classList.remove('drag-over','drop-indicator'));
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over','drop-indicator');
                if (draggedId && draggedId !== link.id) reorderLinks(draggedId, link.id);
            });
        } else {
            const handle = card.querySelector('.drag-handle');
            if (handle) handle.style.opacity = '0.2';
            card.setAttribute('draggable', 'false');
        }

        grid.appendChild(card);

        // Compact tooltip: 1s delay, follows mouse; hide if cursor enters tooltip.
        // Only one link-card description is visible at a time.
        // Mobile: once shown, it stays for 5s, then closes. Leaving the card does not dismiss it early.
        if (isCompact && link.description) {
            card._tooltipTimeout = null;
            card._tooltipEl = null;
            let currentMouseX = 0;
            let currentMouseY = 0;
            let hideTimeout = null;

            const clampPosition = (left, top, width, height) => {
                const pad = 8;
                left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
                top = Math.max(pad, Math.min(top, window.innerHeight - height - pad));
                return { left, top };
            };

            const clearTooltipLife = () => {
                if (card._tooltipLifeTimer) {
                    clearTimeout(card._tooltipLifeTimer);
                    card._tooltipLifeTimer = null;
                }
            };

            const hideTooltipNow = () => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
                clearTooltipLife();
                if (card._tooltipEl) {
                    card._tooltipEl.remove();
                    card._tooltipEl = null;
                }
            };

            const updateTooltipPosition = () => {
                if (card._tooltipEl) {
                    const tooltipWidth = card._tooltipEl.offsetWidth;
                    const tooltipHeight = card._tooltipEl.offsetHeight;

                    let left = currentMouseX - (tooltipWidth / 2);
                    let top = currentMouseY - tooltipHeight - 5;
                    const clamped = clampPosition(left, top, tooltipWidth, tooltipHeight);

                    card._tooltipEl.style.left = `${clamped.left}px`;
                    card._tooltipEl.style.top = `${clamped.top}px`;
                }
            };

            const showTooltip = () => {
                dismissOtherLinkCardTooltips(card);
                if (card._tooltipEl) card._tooltipEl.remove();
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }

                card._tooltipEl = document.createElement('div');
                card._tooltipEl.className = 'link-card-tooltip';
                card._tooltipEl.textContent = link.description;
                card._tooltipEl.style.position = 'fixed';
                card._tooltipEl.style.zIndex = '99999';
                card._tooltipEl.style.visibility = 'hidden';
                card._tooltipEl.style.pointerEvents = 'auto';

                document.body.appendChild(card._tooltipEl);

                const tooltipWidth = card._tooltipEl.offsetWidth;
                const tooltipHeight = card._tooltipEl.offsetHeight;

                let left = currentMouseX - (tooltipWidth / 2);
                let top = currentMouseY - tooltipHeight - 5;
                const clamped = clampPosition(left, top, tooltipWidth, tooltipHeight);

                card._tooltipEl.style.left = `${clamped.left}px`;
                card._tooltipEl.style.top = `${clamped.top}px`;
                card._tooltipEl.style.visibility = 'visible';

                if (typeof isMobileBrowser === 'function' && isMobileBrowser()) {
                    clearTooltipLife();
                    card._tooltipLifeTimer = setTimeout(() => {
                        card._tooltipLifeTimer = null;
                        hideTooltipNow();
                    }, 5000);
                }

                card._tooltipEl.addEventListener('mouseenter', () => {
                    if (typeof isMobileBrowser === 'function' && isMobileBrowser()) return;
                    hideTooltipNow();
                });
            };

            card.addEventListener('mousemove', (e) => {
                currentMouseX = e.clientX;
                currentMouseY = e.clientY;

                if (card._tooltipEl) {
                    updateTooltipPosition();
                }
            });

            card.addEventListener('mouseenter', () => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
                card._tooltipTimeout = setTimeout(() => {
                    showTooltip();
                }, 1000);
            });

            card.addEventListener('mouseleave', () => {
                if (card._tooltipTimeout) {
                    clearTimeout(card._tooltipTimeout);
                    card._tooltipTimeout = null;
                }
                if (typeof isMobileBrowser === 'function' && isMobileBrowser()) return;
                if (card._tooltipEl) {
                    if (hideTimeout) clearTimeout(hideTimeout);
                    hideTimeout = setTimeout(() => {
                        if (card._tooltipEl) {
                            card._tooltipEl.remove();
                            card._tooltipEl = null;
                        }
                        hideTimeout = null;
                    }, 250);
                }
            });
        }
    });

    grid.onclick = function(e) {
        const edit = e.target.closest('[data-action="edit"]');
        const del = e.target.closest('[data-action="delete"]');
        const card = e.target.closest('[data-id]');
        
        if (edit) { e.stopImmediatePropagation(); editLink(Number(edit.dataset.id)); return; }
        if (del) { e.stopImmediatePropagation(); deleteLink(Number(del.dataset.id)); return; }
        if (card && !edit && !del) {
            if (e.target.closest('.drag-handle')) return;
            const l = links.find(x => x.id == card.dataset.id);
            if (l) openLinkAndTally(l);
        }
    };

    if (typeof window.applyLinkCardKeyboardFocus === 'function') {
        window.applyLinkCardKeyboardFocus();
    }
}

function renderModalAccentColors() {
    const container = document.getElementById('accent-color-picker');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(ACCENT_COLORS).forEach(key => {
        const color = ACCENT_COLORS[key];
        const isSelected = modalCurrentAccent === key;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `add-edit-modal__swatch${isSelected ? ' add-edit-modal__swatch--selected' : ''}`;
        btn.style.backgroundColor = color;
        btn.title = key.charAt(0).toUpperCase() + key.slice(1);
        if (isSelected) {
            btn.style.borderColor = 'var(--active-cat-color, #aa0000)';
            btn.style.boxShadow = '0 0 0 1px var(--active-cat-color, #aa0000)';
        }
        btn.onclick = () => {
            modalCurrentAccent = modalCurrentAccent === key ? null : key;
            renderModalAccentColors();
        };
        container.appendChild(btn);
    });

    const noneSelected = !modalCurrentAccent;
    const noneBtn = document.createElement('button');
    noneBtn.type = 'button';
    noneBtn.className = `add-edit-modal__accent-none accent-none-btn${noneSelected ? ' selected' : ''}`;
    noneBtn.textContent = 'None';
    if (noneSelected) {
        noneBtn.style.borderColor = 'var(--active-cat-color, #aa0000)';
        noneBtn.style.boxShadow = '0 0 0 1px var(--active-cat-color, #aa0000)';
    }
    noneBtn.onclick = () => {
        modalCurrentAccent = null;
        renderModalAccentColors();
    };
    container.appendChild(noneBtn);
}

function renderModalCategories() {
    const c = document.getElementById('modal-categories-list');
    if (!c) return;
    c.innerHTML = '';
    const sortedCats = [...modalCurrentCategories].sort((a, b) => a.localeCompare(b));
    sortedCats.forEach((cat) => {
        const p = document.createElement('div');
        p.className = 'add-edit-modal__chip category-pill';
        p.innerHTML = `<span>${escapeHtml(cat)}</span><span class="add-edit-modal__chip-remove">×</span>`;
        p.onclick = () => {
            const realIndex = modalCurrentCategories.indexOf(cat);
            if (realIndex > -1) modalCurrentCategories.splice(realIndex, 1);
            renderModalCategories();
        };
        c.appendChild(p);
    });
}