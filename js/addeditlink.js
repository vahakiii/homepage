function isAddEditModalMobile() {
    return typeof isMobileBrowser === 'function' && !!isMobileBrowser();
}

/** Apply the Mobile add/edit Link layout in mobile mode; desktop stays unchanged. */
function syncAddEditModalLayout() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    const mobile = isAddEditModalMobile();
    modal.classList.toggle('add-edit-modal--mobile', mobile);
    const form = modal.querySelector('.add-edit-modal__form');
    if (form) form.classList.toggle('custom-scroll', mobile);
    if (mobile) {
        modal.setAttribute('data-add-edit-layout', 'mobile');
        modal.setAttribute('aria-roledescription', 'Mobile add/edit Link');
    } else {
        modal.setAttribute('data-add-edit-layout', 'desktop');
        modal.removeAttribute('aria-roledescription');
    }
    syncEmojiPickerLayout();
}

/** Keep the mobile form scrolled to the top when Add/Edit opens. */
function resetAddEditModalScroll() {
    const form = document.getElementById('modal-form');
    if (form) form.scrollTop = 0;
}

/** Apply the Mobile Quick Pick Emojis layout in mobile mode; desktop stays unchanged. */
function syncEmojiPickerLayout() {
    const popover = document.getElementById('emoji-picker-popover');
    const grid = document.getElementById('emoji-grid');
    if (!popover) return;
    const mobile = isAddEditModalMobile();
    popover.classList.toggle('emoji-picker--mobile', mobile);
    if (mobile) {
        popover.setAttribute('data-emoji-picker-layout', 'mobile');
        popover.setAttribute('aria-roledescription', 'Mobile Quick Pick Emojis');
    } else {
        popover.setAttribute('data-emoji-picker-layout', 'desktop');
        popover.removeAttribute('aria-roledescription');
    }
    applyEmojiPickerChrome(popover, grid);
}

function applyEmojiPickerChrome(popover, grid) {
    if (!popover) return;
    const mobile = isAddEditModalMobile();
    if (mobile) {
        popover.style.maxHeight = '';
        popover.style.height = '';
        popover.style.overflow = '';
        popover.style.width = '';
        popover.style.minWidth = '';
        if (grid) {
            grid.style.minHeight = '0px';
            grid.style.maxHeight = '';
            grid.style.overflowY = 'auto';
            grid.style.padding = '';
        }
    } else {
        if (grid) {
            grid.style.minHeight = '420px';
            grid.style.maxHeight = '720px';
            grid.style.overflowY = 'auto';
            grid.style.padding = '20px 12px';
        }
        popover.style.maxHeight = '860px';
        popover.style.height = 'auto';
        popover.style.overflow = 'hidden';
        popover.style.width = '';
        popover.style.minWidth = '';
    }
}

/** Open Add Link modal (position radios; move buttons hidden). */
function openAddModal() {
    currentEditId = null;
    modalCurrentCategories = [];
    modalCurrentAccent = null;
    syncAddEditModalLayout();

    document.getElementById('modal-title').innerHTML = '＋ Add New Link';

    resetModalForm();

    const posBottom = document.getElementById('position-bottom');
    if (posBottom) posBottom.checked = true;

    const moveButtons = document.getElementById('move-buttons');
    const positionOptions = document.getElementById('position-options');
    if (moveButtons) moveButtons.classList.add('is-hidden');
    if (positionOptions) positionOptions.style.display = 'flex';

    openUiModal('modal');
    resetAddEditModalScroll();
    setTimeout(() => document.getElementById('link-name').focus(), 80);
}

/** Open Edit modal (move buttons; position radios hidden). */
function editLink(id) {
    const link = links.find(l => l.id == id);
    if (!link) return;

    currentEditId = id;
    modalCurrentCategories = [...(link.categories || [])];
    modalCurrentAccent = link.accentColor || null;
    syncAddEditModalLayout();

    document.getElementById('modal-title').innerHTML = '<i class="ui-modal__title-icon fa-solid fa-edit"></i>Edit Link';

    resetModalForm();
    document.getElementById('link-name').value = link.name || '';
    document.getElementById('link-url').value = link.url || '';
    document.getElementById('link-description').value = link.description || '';
    setModalEmoji(link.emoji || '🔗');
    document.getElementById('link-is-favorite').checked = !!link.isFavorite;
    setModalTally(link.tally);

    const positionOptions = document.getElementById('position-options');
    if (positionOptions) positionOptions.style.display = 'none';

    const moveButtons = document.getElementById('move-buttons');
    const dateWarning = document.getElementById('edit-date-warning');
    const sortLocked = isManualSortLocked();
    if (moveButtons) moveButtons.classList.toggle('is-hidden', sortLocked);
    if (dateWarning) {
        dateWarning.classList.toggle('is-hidden', !sortLocked);
        if (sortLocked) dateWarning.textContent = getManualSortLockMessage();
    }

    openUiModal('modal');
    resetAddEditModalScroll();
    setTimeout(() => document.getElementById('link-name').focus(), 60);
}

/** Save new or edited link (Save button only; Enter disabled on form). */
function saveCurrentLink() {
    const name = document.getElementById('link-name').value.trim();
    let url = document.getElementById('link-url').value.trim();
    const desc = document.getElementById('link-description').value.trim();
    const em = document.getElementById('link-emoji').value.trim() || '🔗';

    if (!name || !url) {
        alert("Name and URL are required");
        return;
    }
    if (!url.startsWith('http')) url = 'https://' + url;

    const cats = [...modalCurrentCategories];
    const isFavorite = document.getElementById('link-is-favorite').checked;
    const tallyInput = document.getElementById('link-tally');
    const tally = coerceTally(tallyInput ? tallyInput.value : 0);

    if (currentEditId != null) {
        const i = links.findIndex(l => l.id == currentEditId);
        if (i > -1) {
            links[i].name = name;
            links[i].url = url;
            links[i].description = desc;
            links[i].emoji = em;
            links[i].categories = cats;
            links[i].accentColor = modalCurrentAccent;
            links[i].isFavorite = isFavorite;
            links[i].tally = tally;
        }

        saveLinks();
        renderLinks();
        renderCategoriesSidebar();
        const cardsAfter = document.querySelectorAll('#links-grid .link-card');
        let editedIdx = -1;
        for (let k = 0; k < cardsAfter.length; k++) {
            if (Number(cardsAfter[k].dataset.id) == currentEditId) {
                editedIdx = k;
                break;
            }
        }

        closeModal();

        if (editedIdx !== -1) {
            keyboardFocusedIndex = editedIdx;
            applyLinkCardKeyboardFocus();
            setTimeout(() => {
                const refreshed = document.querySelectorAll('#links-grid .link-card');
                if (refreshed[editedIdx]) {
                    refreshed[editedIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 60);
        }
    } else {
        const newLink = normalizeLink({
            id: Date.now(),
            createdAt: Date.now(),
            name,
            url,
            description: desc,
            emoji: em,
            categories: cats,
            accentColor: modalCurrentAccent,
            isFavorite: isFavorite,
            tally: tally
        });

        const positionRadios = document.querySelectorAll('input[name="add-position"]');
        let addToTop = false;
        positionRadios.forEach(radio => {
            if (radio.checked && radio.value === 'top') addToTop = true;
        });
		
        if (addToTop) {
            links.unshift(newLink);
        } else {
            links.push(newLink);
        }

		clearCategoryFilter();
		saveLinks();
		closeModal();
		renderLinks();
		renderCategoriesSidebar();
	
		const cards = document.querySelectorAll('#links-grid .link-card');
		let newCardIndex = -1;

		for (let i = 0; i < cards.length; i++) {
			if (cards[i].dataset.id == newLink.id) {
				newCardIndex = i;
				break;
			}
		}

		if (newCardIndex !== -1) {
			keyboardFocusedIndex = newCardIndex;
			applyLinkCardKeyboardFocus();

			cards[newCardIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
		}

    }

}


function resetModalForm() {
    document.getElementById('link-name').value = '';
    document.getElementById('link-url').value = '';
    document.getElementById('link-description').value = '';
    setModalEmoji('🔗');
    document.getElementById('link-is-favorite').checked = false;
    setModalTally(0);

    const catInput = document.getElementById('category-input');
    if (catInput) catInput.value = '';

    renderModalCategories();
    renderModalAccentColors();
}

/** Sets the Add/Edit modal tally input (defaults missing/invalid to 0). */
function setModalTally(value) {
    const input = document.getElementById('link-tally');
    if (input) input.value = String(coerceTally(value));
}


function closeModal() {
    closeUiModal('modal');
    currentEditId = null;
    modalCurrentCategories = [];
    modalCurrentAccent = null;

    const moveButtons = document.getElementById('move-buttons');
    if (moveButtons) moveButtons.classList.add('is-hidden');

    const positionOptions = document.getElementById('position-options');
    if (positionOptions) positionOptions.style.display = 'none';

    const dateWarning = document.getElementById('edit-date-warning');
    if (dateWarning) dateWarning.classList.add('is-hidden');

    closeEmojiPopover();
    restoreLinkSearchFocus();
}


let emojiPopoverOpen = false;
function initEmojiPicker() {
    const dropdownBtn = document.getElementById('emoji-dropdown-btn');
    const popover = document.getElementById('emoji-picker-popover');
    const grid = document.getElementById('emoji-grid');
    const emojiInput = document.getElementById('link-emoji');
    const searchInput = document.getElementById('emoji-search-input');

    if (!dropdownBtn || !popover || !grid || !emojiInput) return;

    function renderEmojiGrid(filterTerm = '') {
        grid.innerHTML = '';
        grid.classList.remove('empty');
        const term = filterTerm.toLowerCase().trim();

        Object.keys(COMMON_EMOJIS).forEach(category => {
            const filtered = COMMON_EMOJIS[category].filter(emoji => {
                if (!term) return true;

                const searchWords = term.split(/\s+/).filter(Boolean);
                const name = (EMOJI_NAMES[emoji] || '').toLowerCase();
                const emojiChar = emoji.toLowerCase();

                return searchWords.every(word =>
                    name.includes(word) || emojiChar.includes(word)
                );
            });

            if (filtered.length === 0) return;

            const header = document.createElement('div');
            header.className = 'emoji-picker__cat';
            header.textContent = category.toUpperCase();
            grid.appendChild(header);

            filtered.forEach(emoji => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'emoji-picker__cell';
                btn.textContent = emoji;
                const fullName = EMOJI_NAMES[emoji] || emoji;
                const displayName = fullName.replace(/\s*\(.*?\)\s*/g, '').trim();
                btn.title = displayName;
                btn.onclick = () => {
                    emojiInput.value = emoji;
                    closeEmojiPopover();
                };
                grid.appendChild(btn);
            });
        });

        if (term && grid.children.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'emoji-picker__empty';
            noResults.textContent = 'No matching emojis';
            grid.appendChild(noResults);
            grid.classList.add('empty');
        }
    }

    renderEmojiGrid();
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderEmojiGrid(searchInput.value);
        });
    }

    dropdownBtn.onclick = (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!popover.classList.contains('is-open')) {
            syncEmojiPickerLayout();
            popover.classList.add('is-open');
            emojiPopoverOpen = true;
            setAddEditInertForEmojiPicker(true);
            if (searchInput) {
                searchInput.value = '';
                renderEmojiGrid('');
                setTimeout(() => {
                    searchInput.focus();
                }, 50);
            }
        } else {
            closeEmojiPopover();
        }
    };

    document.addEventListener('click', (e) => {
        if (!popover.contains(e.target) && !dropdownBtn.contains(e.target)) {
            closeEmojiPopover();
        }
    });

    const cancelBtn = document.getElementById('emoji-picker-cancel');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            closeEmojiPopover();
        };
    }

    // Esc closes emoji popover only, not parent Add/Edit modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popover.classList.contains('is-open')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            closeEmojiPopover();
        }
    }, { capture: true });
    syncEmojiPickerLayout();
}


function setModalEmoji(emoji) {
    const input = document.getElementById('link-emoji');
    if (input) input.value = emoji || '🔗';
}



function closeEmojiPopover() {
    const popover = document.getElementById('emoji-picker-popover');
    const searchInput = document.getElementById('emoji-search-input');
    if (popover) popover.classList.remove('is-open');
    emojiPopoverOpen = false;
    setAddEditInertForEmojiPicker(false);
    if (searchInput) {
        searchInput.value = '';
        const grid = document.getElementById('emoji-grid');
        if (grid) {
            grid.innerHTML = '';
            grid.classList.remove('empty');
        }
    }
}

/** Blur and lock Add/Edit Link while Quick Pick Emojis is open. */
function setAddEditInertForEmojiPicker(locked) {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.classList.toggle('is-emoji-picker-open', !!locked);
    const panel = modal.querySelector('.add-edit-modal__panel');
    if (!panel) return;
    if (locked) panel.setAttribute('inert', '');
    else panel.removeAttribute('inert');
}


function addCategoryToModal() {
    const inp = document.getElementById('category-input');
    if (!inp) return;

    const rawValue = inp.value.trim();
    if (!rawValue) return;

    const parts = rawValue.split(',');
    const newCategories = [];

    parts.forEach(part => {
        let v = part.trim();
        if (!v) return;

        const alreadyExists = modalCurrentCategories.some(x => 
            x.toLowerCase() === v.toLowerCase()
        ) || newCategories.some(x => x.toLowerCase() === v.toLowerCase());

        if (!alreadyExists) {
            newCategories.push(v);
        }
    });

    if (newCategories.length > 0) {
        modalCurrentCategories.push(...newCategories);
    }

    inp.value = '';
    renderModalCategories();

    if (categorySuggestionsBox) {
        categorySuggestionsBox.classList.add('is-hidden');
        currentHighlightIndex = -1;
    }
}

let categorySuggestionsBox = null;
let currentHighlightIndex = -1;

function initCategoryAutocomplete() {
    const input = document.getElementById('category-input');
    if (!input) return;

    const addButton = input.nextElementSibling;

    const wrapper = document.createElement('div');
    wrapper.className = 'add-edit-modal__cat-wrap category-input-wrapper';

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    if (addButton && (addButton.tagName === 'BUTTON' || addButton.onclick)) {
        wrapper.appendChild(addButton);
        addButton.style.height = '42px';
    }

    if (!categorySuggestionsBox) {
        categorySuggestionsBox = document.createElement('div');
        categorySuggestionsBox.id = 'category-suggestions-box';
        categorySuggestionsBox.className = 'add-edit-modal__suggest is-hidden';
        categorySuggestionsBox.style.top = '100%';
        categorySuggestionsBox.style.left = '0';
        categorySuggestionsBox.style.marginTop = '4px';
        wrapper.appendChild(categorySuggestionsBox);
    }
		function hideCategorySuggestions() {
			if (categorySuggestionsBox) {
				categorySuggestionsBox.classList.add('is-hidden');
				currentHighlightIndex = -1;
			}
		}
		
	    function updateCustomSuggestions() {
        if (input.value.includes(',')) {
            hideCategorySuggestions();
            return;
        }

        const term = input.value.trim().toLowerCase();
        
        if (term.length === 0) {
            hideCategorySuggestions();
            return;
        }

        let allCats = getAllCategories();
        allCats = allCats.filter(cat => !modalCurrentCategories.includes(cat));

        let matches = allCats.filter(cat => cat.toLowerCase().includes(term));
        matches.sort((a, b) => a.localeCompare(b));
        matches = matches.slice(0, 10);

        categorySuggestionsBox.innerHTML = '';
        currentHighlightIndex = -1;

        if (matches.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'add-edit-modal__suggest-empty';
            empty.textContent = 'No matching categories';
            categorySuggestionsBox.appendChild(empty);
        } else {
            matches.forEach((cat, index) => {
                const item = document.createElement('div');
                item.className = 'add-edit-modal__suggest-item';
                item.setAttribute('tabindex', '0');

                const lowerCat = cat.toLowerCase();
                const idx = lowerCat.indexOf(term);
               
                if (idx !== -1) {
                    let before = cat.substring(0, idx);
                    let match = cat.substring(idx, idx + term.length);
                    let after = cat.substring(idx + term.length);

                    before = escapeHtml(before).replace(/^ /, '&nbsp;').replace(/ $/, '&nbsp;');
                    after = escapeHtml(after).replace(/^ /, '&nbsp;').replace(/ $/, '&nbsp;');
                    match = escapeHtml(match);

                    item.innerHTML =
                        before +
                        '<span class="add-edit-modal__suggest-match">' + match + '</span>' +
                        after;
                } else {
                    item.textContent = cat;
                }

                item.onclick = () => {
                    input.value = cat;
                    addCategoryToModal();
                    hideCategorySuggestions();
                    setTimeout(() => input.focus(), 10);
                };

                item.addEventListener('keydown', (e) => {
                    const allItems = Array.from(categorySuggestionsBox.querySelectorAll('div[tabindex="0"]'));
                    const currentIdx = allItems.indexOf(item);

                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (currentIdx < allItems.length - 1) {
                            allItems[currentIdx + 1].focus();
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (currentIdx === 0) {
                            input.focus();
                            currentHighlightIndex = -1;
                            updateCustomSuggestions();
                        } else if (currentIdx > 0) {
                            allItems[currentIdx - 1].focus();
                        }
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        item.click();
                    } else if (e.key === 'Escape') {
                        hideCategorySuggestions();
                        input.focus();
                    }
                });

                item.addEventListener('focus', () => {
                    input.value = cat;
                    currentHighlightIndex = Array.from(categorySuggestionsBox.children).indexOf(item);
                });

                categorySuggestionsBox.appendChild(item);
            });
        }

        categorySuggestionsBox.classList.remove('is-hidden');
    }

    input.addEventListener('input', () => {
        currentHighlightIndex = -1;
        updateCustomSuggestions();
    });

    input.addEventListener('keydown', (e) => {
        const items = Array.from(categorySuggestionsBox.querySelectorAll('div[tabindex="0"]'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (categorySuggestionsBox.classList.contains('is-hidden') || items.length === 0) {
                updateCustomSuggestions();
            }
            if (items.length > 0) {
                items[0].focus();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            if (currentHighlightIndex >= 0 && items.length > 0) {
                const selected = items[currentHighlightIndex];
                if (selected) selected.click();
            } else if (input.value.trim()) {
                addCategoryToModal();
                hideCategorySuggestions();
            }
        } else if (e.key === 'Escape') {
            hideCategorySuggestions();
        }
    });

    document.addEventListener('click', (e) => {
        if (categorySuggestionsBox && !wrapper.contains(e.target)) {
            hideCategorySuggestions();
        }
    });

    const modal = document.getElementById('modal');
    if (modal) {
        const observer = new MutationObserver(() => {
            if (!modal.classList.contains('is-open')) hideCategorySuggestions();
        });
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
}


