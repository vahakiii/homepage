// GitHub Gist sync UI + API (deps: state.js, storage.js mask/unmask)

let syncModalRefreshInterval = null;

function loadGitHubCredentials() {
    githubUsername = localStorage.getItem('github_username') || '';
    githubToken = localStorage.getItem('github_token') || '';
    githubGistId = localStorage.getItem('github_gist_id') || '';
    
    const lastSync = localStorage.getItem('github_last_sync');
    githubLastSync = lastSync ? parseInt(lastSync, 10) : null;
}

function getLastSyncText() {
    if (!githubLastSync) {
        return 'Never synced with GitHub';
    }
    
    const now = Date.now();
    const diffMs = now - githubLastSync;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function toggleTokenVisibility() {
    const input = document.getElementById('github-token');
    const icon = document.getElementById('token-eye-icon');
    
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function copyTokenToClipboard() {
    const input = document.getElementById('github-token');
    if (!input || !input.value.trim()) {
        alert('No token to copy.');
        return;
    }

    const tokenValue = input.value.trim();

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tokenValue).then(() => {
            const copyButtons = document.querySelectorAll('button[title="Copy token to clipboard"]');
            if (copyButtons.length > 0) {
                const btn = copyButtons[0];
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-check github-credentials-modal__copy-ok"></i>`;
                
                setTimeout(() => {
                    if (btn) btn.innerHTML = originalHTML;
                }, 1300);
            }
        }).catch(() => {
            fallbackCopy(tokenValue);
        });
    } else {
        fallbackCopy(tokenValue);
    }
}

function fallbackCopy(text) {
    const input = document.getElementById('github-token');
    if (input) {
        input.select();
        document.execCommand('copy');
        alert('Token copied to clipboard!');
    }
}

function updateGitHubCredentialsStatus() {
    const statusEl = document.getElementById('github-credentials-status');
    if (!statusEl) return;
    if (githubUsername && githubToken) {
        statusEl.innerHTML = `Connected as <span class="sync-modal__connected-name">${escapeHtml(githubUsername)}</span>`;
    } else {
        statusEl.innerHTML = 'Not configured';
    }
}

function openSyncModal() {
    const modal = document.getElementById('sync-modal');
    if (!modal) return;
    openUiModal('sync-modal');
    updateGitHubCredentialsStatus();
    
    const lastSyncEl = document.getElementById('last-sync-text');
    if (lastSyncEl) {
        lastSyncEl.textContent = getLastSyncText();
    }

    if (syncModalRefreshInterval) {
        clearInterval(syncModalRefreshInterval);
    }
    syncModalRefreshInterval = setInterval(() => {
        const el = document.getElementById('last-sync-text');
        if (el) {
            el.textContent = getLastSyncText();
        }
    }, 15000);
}

function closeSyncModal(restoreSearch) {
    closeUiModal('sync-modal');

    if (syncModalRefreshInterval) {
        clearInterval(syncModalRefreshInterval);
        syncModalRefreshInterval = null;
    }
    if (restoreSearch !== false) restoreLinkSearchFocus();
}

function resetTokenVisibilityUI() {
    const tokenInput = document.getElementById('github-token');
    const eyeIcon = document.getElementById('token-eye-icon');
    if (tokenInput) tokenInput.type = 'password';
    if (eyeIcon) {
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

function ensureGithubCredsLoaded() {
    githubUsername = githubUsername || localStorage.getItem('github_username') || '';
    githubToken = githubToken || localStorage.getItem('github_token') || '';
}

function openGitHubCredentialsModal() {
    closeSyncModal(false);
    const modal = document.getElementById('github-credentials-modal');
    if (!modal) return;
    
    const usernameInput = document.getElementById('github-username');
    const tokenInput = document.getElementById('github-token');
    if (usernameInput) usernameInput.value = githubUsername || '';
    if (tokenInput) tokenInput.value = githubToken || '';
    resetTokenVisibilityUI();
    
    const gistInfo = document.getElementById('github-gist-info');
    const gistIdEl = document.getElementById('current-gist-id');
    if (githubGistId && gistInfo && gistIdEl) {
        gistInfo.classList.remove('is-hidden');
        gistIdEl.textContent = githubGistId;
    } else if (gistInfo) {
        gistInfo.classList.add('is-hidden');
    }
    
    openUiModal('github-credentials-modal');
}

function closeGitHubCredentialsModal() {
    resetTokenVisibilityUI();
    openUiModal('sync-modal'); // skip openSyncModal to avoid restarting 15s refresh
    updateGitHubCredentialsStatus();
    closeUiModal('github-credentials-modal');
}

function saveGitHubCredentials() {
    const usernameInput = document.getElementById('github-username');
    const tokenInput = document.getElementById('github-token');
    
    const username = usernameInput ? usernameInput.value.trim() : '';
    const token = tokenInput ? tokenInput.value.trim() : '';

    if (!username && !token) {
        githubUsername = '';
        githubToken = '';
        localStorage.removeItem('github_username');
        localStorage.removeItem('github_token');
        
        closeGitHubCredentialsModal();
        alert('GitHub credentials cleared.');
        return;
    }

    if (!username || !token) {
        alert('Please enter both GitHub username and Personal Access Token, or clear both fields to disconnect.');
        return;
    }

    githubUsername = username;
    githubToken = token;
    
    localStorage.setItem('github_username', githubUsername);
    localStorage.setItem('github_token', githubToken);
    
    closeGitHubCredentialsModal();
    alert('GitHub credentials saved successfully!');
}

function clearGitHubGistId() {
    if (!confirm('Clear the saved Gist ID?\nYou will need to Export again to create a new one.')) return;
    githubGistId = '';
    localStorage.removeItem('github_gist_id');
    const gistInfo = document.getElementById('github-gist-info');
    if (gistInfo) gistInfo.classList.add('is-hidden');
}

async function exportToGitHub() {
    closeSyncModal(false);
    ensureGithubCredsLoaded();

    if (!githubUsername || !githubToken) {
        alert('Please configure your GitHub credentials first.');
        setTimeout(openGitHubCredentialsModal, 150);
        return;
    }

    const exportData = buildBackupPayload({
        includeLastSynced: true,
        githubUsername: githubUsername,
        githubToken: githubToken,
        githubGistId: githubGistId || ''
    });

    const gistContent = JSON.stringify(exportData, null, 2);
    const filename = 'startpage-backup.json';

    try {
        let response;
        let isUpdate = !!githubGistId;
        let action = isUpdate ? 'update' : 'create';

        if (isUpdate) {
            response = await fetch(`https://api.github.com/gists/${githubGistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: `Start Page Backup - ${githubUsername}`,
                    files: {
                        [filename]: { content: gistContent }
                    }
                })
            });
        } else {
            response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: `Start Page Backup - ${githubUsername}`,
                    public: false,
                    files: {
                        [filename]: { content: gistContent }
                    }
                })
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const msg = errorData.message || `HTTP ${response.status}`;

            if (isUpdate && (response.status === 401 || response.status === 404)) {
                console.warn(`[GitHub Sync] Update failed (${response.status}). Creating new Gist instead...`);
                
                const createResponse = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: `Start Page Backup - ${githubUsername}`,
                        public: false,
                        files: {
                            [filename]: { content: gistContent }
                        }
                    })
                });

                if (!createResponse.ok) {
                    const createError = await createResponse.json().catch(() => ({}));
                    throw new Error(createError.message || `Failed to create new Gist (${createResponse.status})`);
                }

                const newGist = await createResponse.json();
                githubGistId = newGist.id;
                localStorage.setItem('github_gist_id', githubGistId);

                githubLastSync = Date.now();
                localStorage.setItem('github_last_sync', githubLastSync);

                alert(`✅ Created a new Gist (previous one was not accessible).\n\nNew Gist ID: ${githubGistId}`);
                return;
            }

            throw new Error(`GitHub API error (${response.status}): ${msg}`);
        }

        const gistData = await response.json();
        githubGistId = gistData.id;
        localStorage.setItem('github_gist_id', githubGistId);

        githubLastSync = Date.now();
        localStorage.setItem('github_last_sync', githubLastSync);

        alert(`✅ Successfully ${action === 'update' ? 'updated' : 'created'} Gist!\n\nGist ID: ${githubGistId}`);

    } catch (err) {
        console.error('[GitHub Sync] Export error:', err);
        alert('Failed to sync with GitHub:\n\n' + err.message);
    }
}

function githubApiHeaders() {
    return {
        'Authorization': 'Bearer ' + githubToken,
        'Accept': 'application/vnd.github.v3+json'
    };
}

async function fetchGistJson(gistId) {
    const response = await fetch('https://api.github.com/gists/' + gistId, {
        headers: githubApiHeaders()
    });
    if (!response.ok) {
        throw new Error('Failed to fetch Gist (' + response.status + ')');
    }
    const gistData = await response.json();
    let jsonContent = null;
    for (const fname in gistData.files) {
        if (fname.toLowerCase().endsWith('.json')) {
            jsonContent = gistData.files[fname].content;
            break;
        }
    }
    if (!jsonContent) {
        throw new Error('No JSON file found in this Gist');
    }
    return JSON.parse(jsonContent);
}

/** Apply Gist backup; options.forceGistId | fallbackGistId for gist ID persistence. */
function applyImportedBackup(imported, options) {
    options = options || {};
    applyBackupPayload(imported, {
        mode: 'gist',
        updateUserName: true,
        forceGistId: options.forceGistId,
        fallbackGistId: options.fallbackGistId,
        touchLastSyncIfMissing: true,
        successMessage: '✅ Successfully imported from GitHub Gist!'
    });
}

async function importFromGitHub() {
    closeSyncModal(false);

    ensureGithubCredsLoaded();

    if (!githubUsername || !githubToken) {
        alert('Please configure your GitHub credentials first.');
        setTimeout(openGitHubCredentialsModal, 150);
        return;
    }

    if (!githubGistId) {
        const shouldFetch = confirm(
            'No Gist ID is saved on this device.\n\n' +
            'Would you like to see your recent Gists and pick one?'
        );
        
        if (shouldFetch) {
            showUserGistsModal();
            return;
        } else {
            const input = prompt('Enter the GitHub Gist ID manually:');
            if (!input) return;
            githubGistId = input.trim();
            localStorage.setItem('github_gist_id', githubGistId);
        }
    }

    const usedGistId = githubGistId;

    try {
        const imported = await fetchGistJson(githubGistId);

        if (!confirm(`Import from GitHub Gist?\nThis will replace your current links.`)) {
            return;
        }

        applyImportedBackup(imported, { fallbackGistId: usedGistId });

    } catch (err) {
        console.error('[GitHub Sync] Import error:', err);
        alert('Failed to import from GitHub:\n\n' + err.message);
    }
}

async function fetchUserGists() {
    ensureGithubCredsLoaded();

    if (!githubUsername || !githubToken) {
        alert('Please configure your GitHub credentials first.');
        return [];
    }

    try {
        const response = await fetch(`https://api.github.com/users/${githubUsername}/gists`, {
            headers: githubApiHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Gists (${response.status})`);
        }

        const gists = await response.json();

        return gists.filter(gist => {
            return Object.keys(gist.files || {}).some(filename => 
                filename.toLowerCase().endsWith('.json')
            );
        });

    } catch (err) {
        console.error('[GitHub Sync] Error fetching Gists:', err);
        alert('Failed to fetch your Gists:\n\n' + err.message);
        return [];
    }
}

function showUserGistsModal() {
    const modal = document.getElementById('gists-list-modal');
    const container = document.getElementById('gists-list-container');
    
    if (!modal || !container) return;

    openUiModal('gists-list-modal');
    
    container.innerHTML = `
        <div class="gists-list-modal__loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading your Gists...
        </div>
    `;

    fetchUserGists().then(gists => {
        if (gists.length === 0) {
            container.innerHTML = `
                <div class="gists-list-modal__empty">
                    <p>No Gists with JSON files found.</p>
                    <p class="gists-list-modal__empty-hint">Make sure you have exported at least once.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="gists-list-modal__items">';
        
        gists.forEach(gist => {
            const jsonFiles = Object.keys(gist.files || {}).filter(f => f.toLowerCase().endsWith('.json'));
            const description = gist.description || 'No description';
            
            const updatedDate = new Date(gist.updated_at);
            const datePart = updatedDate.toLocaleDateString();
            const timePart = updatedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const updated = `${datePart} at ${timePart}`;
            
            html += `
                <div data-gist-id="${escapeHtml(gist.id)}"
                     class="gists-list-modal__row">
                    <div class="gists-list-modal__row-inner">
                        <div class="gists-list-modal__row-main">
                            <div class="gists-list-modal__desc">${escapeHtml(description)}</div>
                            <div class="gists-list-modal__meta">
                                ${escapeHtml(jsonFiles.join(', '))} • Updated ${escapeHtml(updated)}
                            </div>
                        </div>
                        <div class="gists-list-modal__id">
                            ${escapeHtml(gist.id.substring(0, 8))}...
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        container.querySelectorAll('.gists-list-modal__row[data-gist-id]').forEach(row => {
            row.addEventListener('click', () => selectGistForImport(row.dataset.gistId));
        });
    });
}

function closeGistsListModal() {
    closeUiModal('gists-list-modal');
}

async function selectGistForImport(gistId) {
    closeGistsListModal();
    
    githubGistId = gistId;
    localStorage.setItem('github_gist_id', gistId);
    
    await importFromGitHubWithGistId(gistId);
}

async function importFromGitHubWithGistId(gistId) {
    ensureGithubCredsLoaded();

    if (!githubUsername || !githubToken || !gistId) {
        alert('Missing credentials or Gist ID.');
        return;
    }

    try {
        const imported = await fetchGistJson(gistId);

        if (!confirm(`Import from this Gist?\nThis will replace your current links.`)) {
            return;
        }

        applyImportedBackup(imported, { forceGistId: gistId });

    } catch (err) {
        console.error('[GitHub Sync] Import error:', err);
        alert('Failed to import from GitHub:\n\n' + err.message);
    }
}

function showSyncInstructions() {
    closeSyncModal(false);
    openUiModal('sync-instructions-modal');
}

function closeSyncInstructionsModal() {
    openSyncModal();
    closeUiModal('sync-instructions-modal');
}

window.openSyncModal = openSyncModal;
window.closeSyncModal = closeSyncModal;
window.exportToGitHub = exportToGitHub;
window.importFromGitHub = importFromGitHub;
window.showSyncInstructions = showSyncInstructions;
window.closeSyncInstructionsModal = closeSyncInstructionsModal;
window.openGitHubCredentialsModal = openGitHubCredentialsModal;
window.closeGitHubCredentialsModal = closeGitHubCredentialsModal;
window.saveGitHubCredentials = saveGitHubCredentials;
window.clearGitHubGistId = clearGitHubGistId;
window.toggleTokenVisibility = toggleTokenVisibility;
window.copyTokenToClipboard = copyTokenToClipboard;
window.updateGitHubCredentialsStatus = updateGitHubCredentialsStatus;
window.showUserGistsModal = showUserGistsModal;
window.closeGistsListModal = closeGistsListModal;
window.selectGistForImport = selectGistForImport;

window.importFromGitHubWithGistId = importFromGitHubWithGistId;
