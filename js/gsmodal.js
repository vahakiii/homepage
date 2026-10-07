function openSearchModal() {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-modal-input');

    if (!modal || !input) return;

    openUiModal('search-modal');

    input.value = '';
    ['yahoo-finance-input', 'finviz-input', 'google-stock-input'].forEach(function (id) {
        var field = document.getElementById(id);
        if (field) field.value = '';
    });
    setTimeout(() => {
        input.focus();
    }, 50);
}

function closeSearchModal() {
    closeUiModal('search-modal');
    restoreLinkSearchFocus();
}

function clearSearchModalField(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.value = '';
    input.focus();
}