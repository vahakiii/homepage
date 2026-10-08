/**
 * Google Financial Search prompt opened from the Search modal ticker field.
 * Run: node tests/google-financial-search.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PROMPT = 'For stock ticker symbol TICKER: 10 sections; (1) Provide me with the current Market Summary., Include a chart. (2) Provide me with latest news. (3) When the next earnings report is. (4) what are the earnings expectations. (5) provide me with the Bull outlook. (6) Provide me with the Bear outlook. (7) Falsifiers only: the pre-earnings numbers that kill the bull case and the numbers that kill the bear case, measured against company guidance versus the Street whisper. No restatement of sections 5 or 6. (8) Put in a table the JPMorgan, Goldman, DB and Morgan Stanley Price targets. (9) Provide insight on Institutional Ownership & Sector Positioning, and, the 13F Filing Allocations and the ETF Sector Rebalancing Vectors. (10) Insider Activity & Management Sentiments including the Form 4 Open-Market Transactions and Executive Compensation Triggers.';

function expectedPrompt(ticker) {
    return PROMPT.replace('TICKER', ticker);
}

function loadFinanceSearch() {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8')
        .replace(/^window\.\w+ = \w+;$/gm, '');
    const opened = [];
    const elements = {};

    function makeElement(id) {
        const listeners = {};
        return {
            id: id,
            value: '',
            dataset: {},
            addEventListener: function (type, fn) {
                if (!listeners[type]) listeners[type] = [];
                listeners[type].push(fn);
            },
            dispatchEvent: function (event) {
                (listeners[event.type] || []).forEach(function (fn) { fn(event); });
            }
        };
    }

    function element(id) {
        if (!elements[id]) elements[id] = makeElement(id);
        return elements[id];
    }

    const context = {
        document: {
            readyState: 'loading',
            addEventListener: function () {},
            getElementById: function (id) { return element(id); }
        },
        window: {},
        console: console,
        encodeURIComponent: encodeURIComponent,
        setTimeout: function () {},
        setInterval: function () { return 0; },
        clearTimeout: function () {},
        clearInterval: function () {},
        openExternalUrl: function (url) { opened.push(url); }
    };
    context.window.document = context.document;

    vm.createContext(context);
    vm.runInContext(src, context, { filename: 'js/app.js' });
    context.setupSearchModalForm();
    return { context: context, opened: opened, elements: elements };
}

const loaded = loadFinanceSearch();
const input = loaded.context.document.getElementById('google-stock-input');
const form = loaded.elements['google-stock-form'];

input.value = '  aapl  ';
form.dispatchEvent({ type: 'submit', preventDefault: function () {} });

assert.strictEqual(loaded.opened.length, 1);
const url = new URL(loaded.opened[0]);
assert.strictEqual(url.origin + url.pathname, 'https://www.google.com/search');
assert.strictEqual(url.searchParams.get('udm'), '50');
assert.strictEqual(url.searchParams.get('q'), expectedPrompt('AAPL'));
assert.ok(url.searchParams.get('q').indexOf('Market Summary., Include a chart.') !== -1);
assert.strictEqual(input.value, '  aapl  ', 'finance search leaves the modal field as entered');

loaded.opened.length = 0;
input.value = '   ';
form.dispatchEvent({ type: 'submit', preventDefault: function () {} });
assert.strictEqual(loaded.opened.length, 0, 'blank ticker does not open a search');

const direct = loaded.context.googleStockUrl('BRK.B');
const directUrl = new URL(direct);
assert.strictEqual(directUrl.searchParams.get('q'), expectedPrompt('BRK.B'));

console.log('google-financial-search.test.js: ok');
