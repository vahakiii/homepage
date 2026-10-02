/**
 * Behavior of the Android home-screen link opener in js/storage.js.
 * Run: node tests/android-chrome-intent.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

function loadStorage(options) {
    options = options || {};
    const clicks = [];
    const listeners = { document: {}, window: {} };
    const timers = [];
    const opened = [];
    const displayModes = options.displayModes || {};

    function addListener(store, type, fn) {
        if (!store[type]) store[type] = [];
        store[type].push(fn);
    }
    function removeListener(store, type, fn) {
        if (!store[type]) return;
        store[type] = store[type].filter(function (item) { return item !== fn; });
    }

    const body = {
        appendChild: function () {},
        removeChild: function () {}
    };

    const document = {
        body: body,
        visibilityState: options.visibilityState || 'visible',
        addEventListener: function (type, fn) { addListener(listeners.document, type, fn); },
        removeEventListener: function (type, fn) { removeListener(listeners.document, type, fn); },
        createElement: function () {
            const el = {
                href: '',
                target: '',
                rel: '',
                download: '',
                _attrs: {},
                setAttribute: function (name, value) { this._attrs[name] = String(value); },
                getAttribute: function (name) { return Object.prototype.hasOwnProperty.call(this._attrs, name) ? this._attrs[name] : null; },
                hasAttribute: function (name) { return Object.prototype.hasOwnProperty.call(this._attrs, name); },
                click: function () { clicks.push({ href: this.href, target: this.target, rel: this.rel }); },
                remove: function () {},
                closest: function () { return null; }
            };
            body.appendChild = function (node) { el._attached = node === el || true; };
            return el;
        }
    };

    const location = { href: options.href || 'https://start.example/index.html' };
    const window = {
        location: location,
        matchMedia: function (query) {
            const mode = String(query).replace('(display-mode: ', '').replace(')', '').trim();
            return { matches: !!displayModes[mode] };
        },
        addEventListener: function (type, fn) { addListener(listeners.window, type, fn); },
        removeEventListener: function (type, fn) { removeListener(listeners.window, type, fn); },
        setTimeout: function (fn, delay) {
            timers.push({ fn: fn, delay: delay });
            return timers.length;
        },
        open: function (url, target, features) {
            opened.push({ url: url, target: target, features: features });
            return { closed: false };
        }
    };

    const context = {
        console: console,
        URL: URL,
        navigator: { userAgent: options.userAgent || DESKTOP_UA },
        document: document,
        window: window,
        location: location,
        setTimeout: window.setTimeout,
        localStorage: { getItem: function () { return null; }, setItem: function () {} }
    };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/storage.js'), 'utf8'), context, { filename: 'js/storage.js' });

    return {
        context: context,
        clicks: clicks,
        timers: timers,
        opened: opened,
        listeners: listeners,
        location: location,
        document: document,
        flushTimers: function () {
            const pending = timers.splice(0, timers.length);
            pending.forEach(function (timer) { timer.fn(); });
        }
    };
}

let failed = 0;
function assert(cond, message) {
    if (!cond) {
        failed += 1;
        console.error('FAIL: ' + message);
    } else {
        console.log('ok: ' + message);
    }
}

function intentFor(url) {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(':', '');
    const rest = url.slice(parsed.protocol.length + 2);
    return 'intent://' + rest
        + '#Intent;scheme=' + scheme
        + ';package=com.android.chrome'
        + ';action=android.intent.action.VIEW'
        + ';category=android.intent.category.BROWSABLE'
        + ';end';
}

// Desktop browser tab keeps window.open and does not build an intent navigation.
{
    const env = loadStorage({ userAgent: DESKTOP_UA, displayModes: { standalone: true } });
    assert(env.context.isAndroidHomeScreenApp() === false, 'desktop UA is not the Android home-screen app');
    const popup = env.context.openExternalUrl('https://example.com/docs');
    assert(popup && env.opened.length === 1 && env.opened[0].url === 'https://example.com/docs' && env.opened[0].target === '_blank', 'desktop openExternalUrl uses window.open');
    assert(env.clicks.length === 0, 'desktop open does not click an intent anchor');
    assert(env.context.openExternalUrl('https://example.com/a', 'popup=yes,width=1100') && env.opened[1].features === 'popup=yes,width=1100', 'desktop passes window features through');
}

// Android phone in a normal browser tab is unchanged.
{
    const env = loadStorage({ userAgent: ANDROID_UA, displayModes: { browser: true } });
    assert(env.context.isAndroidHomeScreenApp() === false, 'Android browser tab is not standalone');
    env.context.openExternalUrl('https://example.com/');
    assert(env.opened.length === 1 && env.clicks.length === 0, 'Android browser tab still uses window.open');
}

// Installed Android app addresses Chrome and does not call window.open up front.
{
    const env = loadStorage({ userAgent: ANDROID_UA, displayModes: { standalone: true } });
    assert(env.context.isAndroidHomeScreenApp() === true, 'Android standalone is the home-screen app');
    const result = env.context.openExternalUrl('https://example.com/path?q=1');
    assert(result === null, 'Android home-screen openExternalUrl does not return a popup');
    assert(env.opened.length === 0, 'Android home-screen does not window.open immediately');
    assert(env.clicks.length === 1, 'Android home-screen clicks one intent anchor');
    const expected = intentFor('https://example.com/path?q=1');
    assert(env.clicks[0].href === expected, 'intent URL names the Chrome package and keeps the path');
    assert(env.clicks[0].href.indexOf('browser_fallback_url') === -1, 'intent has no in-app fallback URL');
    assert(env.clicks[0].target === '', 'intent navigation is top-level, not another in-app window');
    assert(env.timers.length === 0, 'Chrome handoff stays inside the tap, with no delayed second open');
}

// Hash survives so Android still sees the trailing #Intent marker.
{
    const env = loadStorage({ userAgent: ANDROID_UA, displayModes: { fullscreen: true } });
    assert(env.context.isAndroidHomeScreenApp() === true, 'fullscreen counts as an installed app window');
    const httpUrl = env.context.toHttpUrl('https://example.com/path#section');
    const intent = env.context.toAndroidChromeIntentUrl(httpUrl);
    assert(intent.indexOf('intent://example.com/path#section#Intent;') === 0, 'page hash stays in front of #Intent');
    assert(intent.indexOf('scheme=https') !== -1, 'https scheme is declared on the intent');
    const parsed = new URL(intent);
    assert(parsed.hash.indexOf('#Intent;') !== -1, 'URL parser keeps the #Intent fragment');
}

// One tap produces one Chrome intent, including minimal-ui installs.
{
    const env = loadStorage({ userAgent: ANDROID_UA, displayModes: { 'minimal-ui': true } });
    assert(env.context.isAndroidHomeScreenApp() === true, 'minimal-ui counts as an installed app window');
    env.context.launchAndroidChromeIntent('https://example.com/stay');
    assert(env.clicks.length === 1 && env.clicks[0].href.indexOf('intent://example.com/stay') === 0, 'one tap launches one Chrome intent');
    assert(env.opened.length === 0, 'the home-screen window is not also sent the https URL');
}

// Schemeless links are normalized only for the Android handoff.
{
    const env = loadStorage({ userAgent: ANDROID_UA, displayModes: { standalone: true } });
    env.context.openExternalUrl('example.com/hello');
    assert(env.clicks[0].href.indexOf('intent://example.com/hello') === 0, 'schemeless link becomes an https Chrome intent');
    assert(env.context.toHttpUrl('mailto:a@b.c') === '', 'mailto is not sent to Chrome');
    assert(env.context.toHttpUrl('#top') === '', 'in-page hash is not sent to Chrome');
}

// Anchor taps in the installed app are captured; desktop anchors are not.
{
    const env = loadStorage({ userAgent: ANDROID_UA, displayModes: { standalone: true } });
    let prevented = false;
    const anchor = {
        href: 'https://github.com/settings/tokens/new',
        target: '_blank',
        getAttribute: function (name) { return name === 'href' ? 'https://github.com/settings/tokens/new' : null; },
        hasAttribute: function (name) { return name === 'download' ? false : false; },
        closest: function () { return anchor; }
    };
    const event = {
        button: 0,
        target: { closest: function () { return anchor; } },
        preventDefault: function () { prevented = true; },
        stopPropagation: function () {}
    };
    env.context.onAndroidHomeScreenLinkClick(event);
    assert(prevented === true, 'installed-app anchor click is cancelled');
    assert(env.clicks.length === 1 && env.clicks[0].href.indexOf('intent://github.com/settings/tokens/new') === 0, 'modal link becomes a Chrome intent');

    const desktop = loadStorage({ userAgent: DESKTOP_UA });
    let desktopPrevented = false;
    desktop.context.onAndroidHomeScreenLinkClick({
        button: 0,
        target: { closest: function () { return anchor; } },
        preventDefault: function () { desktopPrevented = true; },
        stopPropagation: function () {}
    });
    assert(desktopPrevented === false && desktop.clicks.length === 0, 'desktop anchor clicks stay with the browser');
}

// Download and modified clicks are left alone.
{
    const env = loadStorage({ userAgent: ANDROID_UA, displayModes: { standalone: true } });
    const download = {
        href: 'blob:https://start.example/id',
        getAttribute: function () { return 'blob:https://start.example/id'; },
        hasAttribute: function (name) { return name === 'download'; },
        closest: function () { return download; }
    };
    env.context.onAndroidHomeScreenLinkClick({
        button: 0,
        target: { closest: function () { return download; } },
        preventDefault: function () { throw new Error('download should not be intercepted'); },
        stopPropagation: function () {}
    });
    env.context.onAndroidHomeScreenLinkClick({
        button: 0,
        metaKey: true,
        target: { closest: function () { return { href: 'https://example.com/', getAttribute: function () { return 'https://example.com/'; }, hasAttribute: function () { return false; } }; } },
        preventDefault: function () { throw new Error('modified click should not be intercepted'); },
        stopPropagation: function () {}
    });
    assert(env.clicks.length === 0, 'downloads and modified clicks are not rewritten');
}

// Opening a card still counts the tally and, on desktop, opens a tab.
{
    const env = loadStorage({ userAgent: DESKTOP_UA });
    env.context.links = [];
    env.context.sortMode = 'name';
    env.context.saveLinks = function () { env.context.saved = true; };
    const link = { url: 'https://example.com/card', tally: 2 };
    env.context.openLinkAndTally(link);
    assert(link.tally === 3 && env.context.saved === true, 'opening a card increments tally and saves');
    assert(env.opened.length === 1 && env.opened[0].url === 'https://example.com/card', 'desktop card open uses window.open');
}

{
    const env = loadStorage({ userAgent: ANDROID_UA, displayModes: { standalone: true } });
    env.context.saveLinks = function () {};
    env.context.sortMode = 'name';
    const link = { url: 'https://example.com/card', tally: 0 };
    env.context.openLinkAndTally(link);
    assert(link.tally === 1, 'Android card open still increments tally');
    assert(env.opened.length === 0 && env.clicks[0].href.indexOf('package=com.android.chrome') !== -1, 'Android card open targets the Chrome app');
}

if (failed) {
    console.error(failed + ' assertion(s) failed');
    process.exit(1);
}
console.log('all assertions passed');
