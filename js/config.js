// UI_MODAL_IDS: Escape close order (topmost first); modals use .is-open
var UI_MODAL_IDS = [
    'github-credentials-modal',
    'attribution-modal',
    'search-modal',
    'gists-list-modal',
    'color-theme-modal',
    'sync-instructions-modal',
    'sync-modal',
    'settings-modal',
    'modal'
];

function isUiModalId(id) {
    return UI_MODAL_IDS.indexOf(id) !== -1;
}

function isUiModalOpen(id) {
    var m = document.getElementById(id);
    return !!(m && m.classList.contains('is-open'));
}

function isAnyUiModalOpen() {
    for (var i = 0; i < UI_MODAL_IDS.length; i++) {
        if (isUiModalOpen(UI_MODAL_IDS[i])) return true;
    }
    return false;
}

function openUiModal(modalId) {
    var m = document.getElementById(modalId);
    if (!m) return;
    m.classList.add('is-open');
}

function closeUiModal(modalId) {
    var m = document.getElementById(modalId);
    if (m) m.classList.remove('is-open');
    // Blur header btn to avoid :focus-visible ring after close
    var active = document.activeElement;
    if (active && active.classList && active.classList.contains('header-action-btn')) {
        active.blur();
    }
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Theme hex defaults — keep in sync with css :root tokens
var APP_THEME_HEX = {
    surfacePage: '#18181b',
    surfaceChrome: '#09090b',
    textPrimary: '#e4e4e7',
    save: '#4f46e5',
    card: '#27251f',
    activeCat: '#aa0000',
    activeCatText: '#ffcccc',
    hoverBlend: '#ffffff',
    success: '#10b981',
    caution: '#fbbf24'
};

// Accent keys are persisted on links — do not rename
var ACCENT_COLORS = {
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#22c55e',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6'
};

var COLOR_FIELDS = [
    { key: 'bg', label: 'Background', storage: 'startpage_bg_color', prefix: 'bg', dark: APP_THEME_HEX.surfacePage, light: '#c9c9c9' },
    { key: 'text', label: 'Text', storage: 'startpage_text_color', prefix: 'text', dark: APP_THEME_HEX.textPrimary, light: '#2e2e2e' },
    { key: 'card', label: 'Card', storage: 'startpage_card_color', prefix: 'card', dark: APP_THEME_HEX.card, light: '#898370' },
    { key: 'activeCat', label: 'Active & Accent', storage: 'startpage_active_cat_color', prefix: 'active-cat', dark: APP_THEME_HEX.activeCat, light: '#e14c4c' },
    { key: 'category', label: 'Pill', storage: 'startpage_category_color', prefix: 'category', dark: APP_THEME_HEX.card, light: '#97917d' },
    { key: 'textbox', label: 'Textbox', storage: 'startpage_textbox_color', prefix: 'textbox', dark: APP_THEME_HEX.surfacePage, light: '#a8a8a8', importAliases: ['search'], legacyStorage: 'startpage_search_color', saveIfSet: true },
    { key: 'activeText', label: 'Active Text', storage: 'startpage_active_text_color', prefix: 'active-text', dark: '#ffffff', light: '#000000', saveIfSet: true },
    { key: 'emojiBg', label: 'Emoji Background', storage: 'startpage_emoji_bg_color', prefix: 'emoji-bg', dark: APP_THEME_HEX.card, light: '#888686', saveIfSet: true },
    { key: 'hoverBlend', label: 'Hover Blend', storage: 'startpage_hover_blend_color', prefix: 'hover-blend', dark: APP_THEME_HEX.hoverBlend, light: '#ffffff', saveIfSet: true },
    { key: 'button', label: 'Button', storage: 'startpage_button_color', prefix: 'button', dark: APP_THEME_HEX.card, light: '#999999', saveIfSet: true },
    { key: 'saveButton', label: 'Submit Button & Links', storage: 'startpage_save_button_color', prefix: 'save-button', dark: APP_THEME_HEX.save, light: '#7973e8', saveIfSet: true },
    { key: 'success', label: 'Interfaces / Headers', storage: 'startpage_success_color', prefix: 'success', dark: APP_THEME_HEX.success, light: '#0a6647', importAliases: ['connection'], legacyStorage: 'startpage_connection_color', editorUsesLegacy: true, saveIfSet: true },
    { key: 'caution', label: 'Caution', storage: 'startpage_caution_color', prefix: 'caution', dark: APP_THEME_HEX.caution, light: '#c0911b', saveIfSet: true }
];

// Color Theme grid order (3 columns). Actions sit after Button (col 3, rows 4–5).
var COLOR_EDITOR_KEYS = ['bg', 'text', 'textbox', 'activeCat', 'activeText', 'card', 'category', 'emojiBg', 'hoverBlend', 'button', 'saveButton', 'success', 'caution'];
var COLOR_EDITOR_ACTIONS_AFTER = 'button';

var COLOR_DEFAULTS = {};
var COLOR_LIGHT_DEFAULTS = {};
COLOR_FIELDS.forEach(function (f) {
    COLOR_DEFAULTS[f.key] = f.dark;
    COLOR_LIGHT_DEFAULTS[f.key] = f.light;
});

function colorFieldByKey(key) {
    for (var i = 0; i < COLOR_FIELDS.length; i++) {
        if (COLOR_FIELDS[i].key === key) return COLOR_FIELDS[i];
    }
    return null;
}

function colorFieldPickerId(field) {
    return field.prefix + '-color-picker';
}

function colorFieldTextId(field) {
    return field.prefix + '-color-text';
}

function readStoredColors() {
    var colors = {};
    COLOR_FIELDS.forEach(function (f) {
        var stored = localStorage.getItem(f.storage);
        if (!stored && f.legacyStorage) stored = localStorage.getItem(f.legacyStorage);
        colors[f.key] = stored || f.dark;
    });
    return colors;
}

function importedColorMap(c) {
    c = c || {};
    var colors = {};
    COLOR_FIELDS.forEach(function (f) {
        var val = c[f.key];
        if (!val && f.importAliases) {
            for (var i = 0; i < f.importAliases.length; i++) {
                if (c[f.importAliases[i]]) {
                    val = c[f.importAliases[i]];
                    break;
                }
            }
        }
        colors[f.key] = val || f.dark;
    });
    return colors;
}

// Emoji picker: format Name (keywords); parens hidden in tooltips but searchable.
// Keep EMOJI_NAMES ↔ COMMON_EMOJIS in sync; categories alphabetical; General last resort; new category needs ≥5.
var COMMON_EMOJIS = {
    "Animals": [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐍',
        '🐔', '🐵', '🙈', '🙉', '🙊', '🪿', '🫎', '🐝', '🦐', '🐬', '🐳', '🐪', '🐘', '🐈', '🐾'
    ],
    "Celestial": [
        '⭐', '🌟', '🌞', '🌝', '🌛', '🌜', '🌠'
    ],
    "Celebration & Explosions": [
        '🎆', '🎇', '🧨', '🎉', '🎊', '💥'
    ],
    "Communication": [
        '📧', '💬', '☎️', '👤', '✉️', '💌'
    ],
    "Education & Learning": [
        '🎓', '📖', '✏️', '➕', '➖', '✖️', '➗', '🟰', '🧑‍🏫'
    ],
    "Faces & Emotions": [
        '😀', '😃', '😄', '😁', '😂', '🙂', '😊', '😉', '😐', '😕', '🙁',
        '😠', '😢', '😭', '😴', '😎', '🥳', '🤯', '😇', '😏', '😈',
        '🤩', '😍', '🥸', '🥶', '🫠', '🫥'
    ],
    "Finance & Money": [
        '💰', '💵', '💲', '💳', '🪙', '💎', '🏦', '🏧',
        '💴', '💶', '💷', '🤑', '💱', '₿'
    ],
    "Food & Drink": [
        '🛒', '🛍️', '🥕', '🥬', '🧀', '🥑', '🥦', '🧃', '🥩', '🍎', '🧈',
        '🍌', '🍓', '🍉', '🍇', '🍒', '🥝', '🍍', '🥭',
        '🥓', '🫙', '🌹', '🎄',
        '🍕', '🍟', '🍔', '🍗', '🥚', '🍋', '🥥', '🍤', '🥟',
        '🍦', '🍢', '🍰', '🎂', '🍼', '🍺', '🍻', '🍷', '🥂', '🍽️',
        '🍹', '🍸', '🥢', '🥡'
    ],
    "Gaming & Retro": [
        '🎮', '🕹️', '👾', '🏴‍☠️', '🗡️', '🛡️', '🎲', '♟️'
    ],
    "General": [
        '🔗', '🏠', '❤️', '🔥', '✨', '✅', '❌', '⚠️', '💡', '⏰',
        '🔄', '🏷️', '🔖', '📝', '‼️', '☢️', '❤️‍🔥', '🔱', '🫵',
        '🐉', '🐦‍🔥', '🦄', '🧜‍♀️', '👨‍🚀', '🇺🇸', '💩', '🔝', '🆓', '🆕',
        '🏆', '💍', '💤', '💦', '📬', '▶️', '🆔', '🎫', '📜', '🔠'
    ],
    "Hand Gestures": [
        '👍', '👎', '👏', '🙌', '🙏', '👋', '🤝', '👌', '✌️',
        '👈', '👉', '👆', '👇', '🤟', '🤘', '🤌', '🤏'
    ],
    "Hearts": [
        '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
        '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'
    ],
    "Health & Lifestyle": [
        '🏥', '💪', '🧘', '🥗', '🧬', '🤰', '👨‍👩‍👧‍👦', '👶', '👨', '👩',
        '⚕️', '🩹', '💊', '🏃', '🩺', '🩻', '🔬', '👨‍⚕️', '👩‍⚕️', '🧖‍♂',
        '💆‍♂️', '💆‍♀', '💇‍♂️', '🧖‍♀️', '💅', '🛌', '👗', '💄', '🧴', '🫁', '🧘‍♂'
    ],
    "Media & Entertainment": [
        '🖼️', '🖌️', '🎨', '🎵', '📺', '🎬', '🧩', '🎧', '📚',
        '🎞️', '📽️', '🎥', '📷', '🦸', '📰',
        '🎁', '🎪', '🎸', '🥁', '📀', '📱', '🤹‍♂️', '📹'
    ],
    "Plants & Nature": [
        '🌵', '🌲', '🌳', '🌴', '🌱', '🌿', '🍀', '🌸', '🏞️',
        '🪴', '🌻', '🧑‍🌾', '🪷'
    ],
    "Parks": [
        '⛺', '🏕️'
    ],
    "Playing Cards": [
        '🃏', '♠️', '♥️', '♦️', '♣️'
    ],
    "Religious & Spiritual": [
        '✝️', '☪️', '🕉️', '☸️', '🛐'
    ],
    "Sports": [
        '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🏓',
        '🏸', '🏒', '🏑', '🥊', '🥋', '🏏', '🏹', '🎱',
        '🏊', '🏄', '🚴', '🏋️', '🤺', '🧗',
        '⛳', '⛹️‍♂️', '🛝', '🥇', '🥎',
        '🏋️‍♂️', '🏃‍♂️', '🧘‍♀️'
    ],
    "Tech & Development": [
        '💻', '🖥️', '⌨️', '🖱️', '🔧', '⚙️', '🛠️', '🔌',
        '☁️', '🔒', '🔐', '🌐', '🔍', '🧠', '💾', '🧮',
        '🚀', '🐛', '🤖', '🧑‍💻', '🐙', '🦊', '📄',
        '🧪', '🧑‍🔬', '⚡', '🔠', '🪟', '📶', '🛰️', '📡'
    ],
    "Tools & Objects": [
        '🔨', '⛏️', '🪓', '🪛', '🧰', '🗃️', '🗄️',
        '⛑️', '🧯', '⛓️', '💣', '🔫', '🛟',
        '👠', '🦺', '🩴',
        '🪜', '⚔️', '🧿', '🪬', '🔭', '🛁', '🗳️', '🧷', '🖇️'
    ],
    "Travel & Transportation": [
        '✈️', '🚗', '🏖️', '🗺️', '🌍', '🚕', '🚌', '🚎', '🚲', '🛵', '🚁',
        '🚤', '🛤️', '🛣️', '🏔️', '🏟️', '🎢', '🌏', '🏝️', '🏨', '🚢', '🛫', '🛳️', '🧳', '🚚',
        '🥾', '🛴', '🚇', '🚄'
    ],
    "Weather": [
        '☀️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '❄️', '🌫️',
        '🌊', '🌋', '🌡️', '⛄'
    ],
    "Work & Productivity": [
        '💼', '📊', '📈', '📉', '📋', '🗓️', '🧾', '📅', '🗂️', '☕', '🔑', '🗒️',
        '📥', '📤', '🕒', '⏱️', '🧑‍💼', '📁', '📎', '📌', '📠', '⚖️', '⏳', '❎',
        '🗣️', '📣', '🎚️', '👥', '🏘️', '📢', '🔔',
        '🤦‍♂️', '🙋‍♂️', '🤷‍♂️', '👯‍♀️', '🧑‍🧑‍🧒‍🧒', '🗑️', '⌚', '💈', '✍️', '📍', '📦'
    ],
    "Zodiac": [
        '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'
    ]
};

var EMOJI_NAMES = {
    '‼️': 'Double Exclamation Mark (Emphasis, Surprise, Important, Wow)',
    '⚾': 'Baseball (Ball, Bat, Sport, Throw, Catch)',
    '₿': 'Bitcoin Symbol (Crypto, Cryptocurrency, BTC, Digital Currency, Blockchain, Bitcoin, Satoshi)',
    '➗': 'Divide (Math, Split, Separate)',
    '➖': 'Minus (Remove, Subtract, Negative, Math)',
    '➕': 'Plus (Add, New, Positive, Math, Create)',
    '⚽': 'Soccer (Ball, Sport, Kick, Goal, Team, Round, Football)',
    '⏰': 'Alarm Clock (Time, Wake Up, Reminder, Morning, Ring)',
    '⏳': 'Hourglass (Time, Deadline, Waiting, Progress, Timer, Patience)',
    '⏱️': 'Stopwatch (Timer, Time Tracking, Performance, Speed)',
    '⌚': 'Watch (Time, Wristwatch)',
    '⌨️': 'Keyboard (Type, Keys, Input, Computer, Click)',
    '▶️': 'Play Button (Start, Media, Video, Music, Begin, Forward, Arrow)',
    '☀️': 'Sun (Hot, Bright, Day, Warm, Yellow)',
    '☁️': 'Cloud (Storage, Online, Data, Sync, Internet)',
    '☎️': 'Telephone (Call, Voice, Classic, Old, Communication, Dial)',
    '☢️': 'Radioactive (Danger, Nuclear)',
    '☪️': 'Crescent (Islam, Muslim, Moon, Faith, Star)',
    '☸️': 'Wheel (Buddhist, Dharma, Peace, Religion, Cycle)',
    '♈': 'Aries (Ram, Zodiac, Bold, Energetic, Leader)',
    '♉': 'Taurus (Bull, Zodiac, Stable, Reliable, Strong)',
    '♊': 'Gemini (Twins, Zodiac, Versatile, Communicative, Curious)',
    '♋': 'Cancer (Crab, Zodiac, Emotional, Protective, Intuitive)',
    '♌': 'Leo (Lion, Zodiac, Charismatic, Confident, Dramatic)',
    '♍': 'Virgo (Virgin, Zodiac, Analytical, Practical, Detail-Oriented)',
    '♎': 'Libra (Scales, Zodiac, Balanced, Diplomatic, Harmonious)',
    '♏': 'Scorpio (Scorpion, Zodiac, Intense, Passionate, Mysterious)',
    '♐': 'Sagittarius (Archer, Zodiac, Adventurous, Optimistic, Philosophical)',
    '♑': 'Capricorn (Sea-Goat, Zodiac, Ambitious, Disciplined, Responsible)',
    '♒': 'Aquarius (Water Bearer, Zodiac, Innovative, Independent, Humanitarian)',
    '♓': 'Pisces (Fish, Zodiac, Compassionate, Dreamy, Intuitive)',
    '♟️': 'Chess Pawn (Strategy, Game, Small, Important, Chess)',
    '♠️': 'Spade (Card, Black, Poker, Suit, Sharp)',
    '♣️': 'Club (Card, Black, Poker, Suit, Leaf)',
    '♥️': 'Heart (Card, Red, Love, Poker, Suit)',
    '♦️': 'Diamond (Card, Red, Poker, Suit, Rich)',
    '✈️': 'Airplane (Travel, Flight, Plane, Aviation, Adventure)',
    '✉️': 'Envelope (Mail, Letter, Send, Post, Message, Communication, Paper)',
    '✌️': 'Victory Hand (Peace, Victory, Two, Success, Cool)',
    '✍️': 'Writing Hand (Write, Note, Pen, Document, Signature, Compose, Edit)',
    '✏️': 'Pencil (Writing, Drawing, School, Sharp, Eraser, Create)',
    '✖️': 'X (Multiply, Close, Wrong, Cancel, Error)',
    '✝️': 'Cross (Christian, Faith, Church, Holy, Jesus)',
    '❄️': 'Snowflake (Snow, Winter, Cold, Unique, Winter Magic)',
    '❎': 'Cross Mark Button (Cancel, Close, Wrong, Remove, Delete, No)',
    '❣️': 'Heart Exclamation (Love, Emphasis, Passion, Excitement, Strong Feeling, Intense)',
    '❤️': 'Heart (Love, Red, Warm, Feeling, Passion)',
    '❤️‍🔥': 'Heart on Fire (Passionate Love)',
    '❤️‍🩹': 'Mending Heart (Healing, Recovery, Emotional Healing, Care, Mend, Support)',
    '✅': 'Check (Done, Correct, Good, Success, Approved)',
    '✨': 'Sparkles (Shiny, Magic, Clean, New, Special)',
    '❌': 'X (Wrong, Close, Error, Cancel, Bad)',
    '☕': 'Hot Beverage (Coffee, Break, Cafe, Energy, Morning Ritual)',
    '⚠️': 'Warning (Danger, Alert, Caution, Important, Risk)',
    '⚡': 'Lightning (Fast, Power, Energy, Speed, Electric, Zap, Quick)',
    '⚔️': 'Crossed Swords (Battle, Conflict, Fantasy, War, Honor)',
    '⚕️': 'Medical (Health, Doctor, Nurse, Hospital, Care)',
    '⚖️': 'Balance Scale (Justice, Legal, Advocate, Law, Fairness)',
    '⚙️': 'Gear (Settings, Turn, Machine, Metal, Round, Mechanical)',
    '⛓️': 'Chains (Link, Connection, Restraint)',
    '⛅': 'Cloudy (Weather, Sun, Partly, Mild, Sky)',
    '⛳': 'Flag in Hole (Golf)',
    '⛏️': 'Pickaxe (Mining, Tool, Digging, Labor, Adventure)',
    '⛑️': 'Rescue Worker\'s Helmet (Safety, Emergency, Protection, Hero)',
    '⛄': 'Snowman Without Snow (Winter, Cold, Snow, Cute)',
    '⛈️': 'Storm (Rain, Thunder, Lightning, Dark, Loud)',
    '⛺': 'Tent (Camping, Shelter, Outdoor Adventure, Sleep Under Stars, Nature, Camp Site, Hiking)',
    '⛹️‍♂️': 'Man Bouncing Ball (Basketball, Sports)',
    '⭐': 'Star (Favorite, Best, Rating, Highlight, Special)',
    '🃏': 'Joker (Card, Wild, Game, Trick, Fun, Crazy)',
    '🆓': 'FREE Button (Free, No Cost, Gratis, Available)',
    '🆔': 'ID Button (Identity, Badge, Name, Card, Profile, User)',
    '🆕': 'NEW Button (New, Fresh, Latest, Update, Brand New)',
    '🇺🇸': 'Flag: United States (USA, America)',
    '🌊': 'Water Wave (Ocean, Wave, Sea, Tsunami, Powerful)',
    '🌋': 'Volcano (Eruption, Lava)',
    '🌍': 'Globe Showing Americas (World, International, Earth, Global, Planet)',
    '🌏': 'Globe Showing Asia-Australia (World, Earth, Global, International, Planet, Asia)',
    '🌐': 'Globe (World, Internet, Global, Connected, Online, Network, Web)',
    '🌛': 'Crescent Moon (Night, Growing, Hopeful, Thin, Light, Peaceful)',
    '🌜': 'Crescent Moon (Night, Waning, Calm, Thin, Quiet, Reflective)',
    '🌝': 'Full Moon (Night, Peaceful, Calm, Round, White, Quiet, Mysterious)',
    '🌞': 'Sun (Hot, Bright, Warm, Radiant, Day, Happy, Shining)',
    '🌟': 'Star (Bright, Shiny, Special, Highlight, Glow)',
    '🌠': 'Shooting Star (Fast, Bright, Wish, Rare, Magic, Quick, Beautiful)',
    '🌡️': 'Thermometer (Temperature, Fever)',
    '🌤️': 'Sun Behind Small Cloud (Partly Cloudy, Mild, Pleasant)',
    '🌥️': 'Sun Behind Large Cloud (Cloudy, Overcast, Gray)',
    '🌦️': 'Sun Behind Rain Cloud (Showers, Light Rain, Drizzle)',
    '🌧️': 'Cloud with Rain (Rainy, Shower, Wet, Stormy)',
    '🌨️': 'Cloud with Snow (Snowy, Winter, Flurries, Cold)',
    '🌩️': 'Cloud with Lightning (Thunderstorm, Storm, Dramatic, Powerful)',
    '🌫️': 'Fog (Misty, Hazy, Mysterious, Low Visibility)',
    '🌱': 'Seedling (Green, Small, Growth, New, Plant, Sprout)',
    '🌲': 'Pine Tree (Green, Tall, Forest, Needle, Christmas)',
    '🌳': 'Tree (Green, Tall, Leaf, Forest, Nature, Big)',
    '🌴': 'Palm Tree (Tropical, Beach, Coconut, Vacation, Tall)',
    '🌵': 'Cactus (Spiky, Green, Desert, Dry, Sharp, Plant)',
    '🌸': 'Flower (Pink, Petal, Bloom, Spring, Pretty)',
    '🌹': 'Rose (Flower, Love)',
    '🌻': 'Sunflower (Yellow Flower, Summer, Bright, Happy, Tall Flower, Garden, Sun, Cheerful)',
    '🌿': 'Leaf (Green, Plant, Herb, Nature, Fresh)',
    '🍀': 'Clover (Green, Lucky, Four, Leaf, Plant)',
    '🍇': 'Grapes (Purple, Sweet, Round, Bunch, Small)',
    '🍉': 'Watermelon (Big, Red, Sweet, Juicy, Summer)',
    '🍋': 'Lemon (Yellow, Sour, Citrus, Small, Fresh)',
    '🍌': 'Banana (Yellow, Fruit, Long, Sweet, Peel)',
    '🍍': 'Pineapple (Yellow, Sweet, Spiky, Tropical, Big)',
    '🍎': 'Apple (Red, Fruit, Sweet, Crunchy, Healthy)',
    '🍒': 'Cherries (Red, Sweet, Small, Pair, Fruit)',
    '🍓': 'Strawberry (Red, Sweet, Berry, Small, Juicy)',
    '🍔': 'Burger (Beef, Bun, Cheese, Juicy, Fast Food)',
    '🍕': 'Pizza (Hot, Cheesy, Slice, Round, Tasty)',
    '🍗': 'Chicken Leg (Meat, Crispy, Protein, Brown, Tasty)',
    '🍟': 'Fries (Potato, Salty, Crispy, Yellow, Fast Food)',
    '🍢': 'Skewer (Food, Stick, Warm, Street, Tasty)',
    '🍤': 'Shrimp (Pink, Curved, Seafood, Small, Tasty)',
    '🍦': 'Ice Cream (Cold, Sweet, Creamy, Cone, Dessert)',
    '🍰': 'Cake (Sweet, Slice, Dessert, Strawberry, Soft)',
    '🍷': 'Wine (Red, Glass, Drink, Alcohol, Elegant)',
    '🍸': 'Martini (Glass, Drink, Olive, Elegant, Alcohol)',
    '🍹': 'Cocktail (Drink, Colorful, Sweet, Glass, Vacation)',
    '🍺': 'Beer (Cold, Yellow, Drink, Glass, Alcohol)',
    '🍻': 'Beer Mugs (Cheers, Cold, Drink, Glass, Friends)',
    '🍼': 'Baby Bottle (Milk, Baby, Drink, White, Small)',
    '🍽️': 'Plate (Food, Eat, Fork, Knife, Meal)',
    '🎁': 'Wrapped Gift (Present, Birthday)',
    '🎂': 'Birthday Cake (Sweet, Candle, Celebration, Dessert, Big)',
    '🎄': 'Christmas Tree (Holiday, Xmas)',
    '🎆': 'Fireworks (Loud, Bright, Colorful, Explosive, Celebration, Joy, Night)',
    '🎇': 'Sparkler (Bright, Sparkling, Hot, Festive, Fun, Light, Magic)',
    '🎉': 'Party Popper (Colorful, Surprise, Celebration, Confetti, Fun, Joy, Pop)',
    '🎊': 'Confetti Ball (Round, Colorful, Celebration, Joy, Party, Festive, Bright)',
    '🎓': 'Graduation Cap (School, Success, Achievement, Degree, Smart, Proud)',
    '🎚️': 'Level Slider (Gauge, Control, Slider, Settings, Adjustment)',
    '🎞️': 'Film (Movie, Camera, Old, Strip, Cinema)',
    '🎢': 'Roller Coaster (Amusement, Thrill)',
    '🎥': 'Camera (Movie, Film, Video, Record, Cinema)',
    '🎧': 'Headphones (Music, Listen, Sound, Ear, Audio)',
    '🎨': 'Palette (Art, Color, Paint, Mix, Creative)',
    '🎪': 'Circus Tent (Entertainment, Show, Fun, Performance)',
    '🎫': 'Ticket (Event, Movie, Travel, Admission, Show, Pass, Entry)',
    '🎬': 'Clapper (Movie, Film, Video, Shoot, Cinema)',
    '🎮': 'Game Controller (Gaming, Play, Fun, Buttons, Console, Video)',
    '🎱': 'Billiards (Ball, Table, Cue, Game, Pool)',
    '🎲': 'Dice (Game, Random, Luck, Roll, Chance)',
    '🎵': 'Music Note (Song, Sound, Melody, Listen, Audio)',
    '🎸': 'Guitar (Music, Instrument)',
    '🎾': 'Tennis (Ball, Racket, Sport, Court, Hit)',
    '🏀': 'Basketball (Ball, Sport, Hoop, Dunk, Orange)',
    '🏃': 'Running (Sport, Exercise, Fast, Cardio, Healthy)',
    '🏃‍♂️': 'Man Running (Running, Jogging, Cardio, Exercise, Marathon, Sport, Fast, Healthy Lifestyle)',
    '🏄': 'Surfing (Wave, Board, Ocean, Sport, Balance)',
    '🏆': 'Trophy (Winner, Achievement, Victory, Success, Champion)',
    '🏈': 'Football (Sport, Ball, Throw, Team, American)',
    '🏉': 'Rugby Football (Ball, Sport, Tough, Team, Physical)',
    '🏊': 'Swimming (Pool, Water, Sport, Lap, Fast)',
    '🏋️': 'Weightlifting (Gym, Strong, Muscle, Training, Heavy, Lift, Barbell)',
    '🏋️‍♂️': 'Man Lifting Weights (Weightlifting, Gym, Strength Training, Fitness, Muscle Building, Workout, Barbell)',
    '🏏': 'Cricket (Bat, Ball, Sport, Wicket, Team)',
    '🏐': 'Volleyball (Ball, Sport, Net, Beach, Team)',
    '🏑': 'Hockey (Stick, Ball, Field, Sport, Team)',
    '🏒': 'Hockey (Stick, Puck, Ice, Sport, Fast)',
    '🏓': 'Ping Pong (Table, Ball, Paddle, Fast, Fun)',
    '🏔️': 'Snow-Capped Mountain (Mountain, Peak)',
    '🏕️': 'Camping (Tent, Campfire, Outdoor Adventure, Nature, Vacation, Hiking, Wilderness, Glamping)',
    '🏖️': 'Beach with Umbrella (Vacation, Holiday, Tropical, Relaxation)',
    '🏘️': 'Houses (Neighborhood, Community, HOA, Residential Area, Local)',
    '🏝️': 'Desert Island (Tropical, Vacation, Beach, Paradise, Travel, Relax)',
    '🏞️': 'National Park (Nature Reserve, Scenery, Hiking, Mountains, Landscape, Protected Area, Outdoors, Wilderness)',
    '🏟️': 'Stadium (Sports, Arena)',
    '🏠': 'House (Home, Building, Shelter, Family, Roof)',
    '🏥': 'Hospital (Health, Doctor, Nurse, Sick, Emergency, Building)',
    '🏦': 'Bank (Money, Safe, Building, Rich, Vault, Cash)',
    '🏧': 'ATM (Cash, Machine, Bank, Withdraw, Money, Pin, Transaction)',
    '🏨': 'Hotel (Accommodation, Stay, Travel, Building, Vacation, Service)',
    '🏴‍☠️': 'Pirate Flag (Adventure, Skull, Bold, Danger, Treasure)',
    '🏷️': 'Tag (Label, Price, Name, Category, Organize)',
    '🏸': 'Badminton (Shuttle, Racket, Sport, Fast, Outdoor)',
    '🏹': 'Archery (Bow, Arrow, Target, Sport, Aim)',
    '🐈': 'Cat (Independent, Graceful, Mysterious, Soft, Quiet, Agile)',
    '🐉': 'Dragon (Mythical, Fantasy)',
    '🐍': 'Snake (Python, Programming Language, Code, Development)',
    '🐔': 'Chicken (Clucking, Feathery, Farm, Loud, Protective, Round)',
    '🐘': 'Elephant (Big, Strong, Gray, Trunk, Wise, Calm)',
    '🐙': 'Octopus (GitHub, Octocat, DevOps, Flexible, Multi-tasking)',
    '🐛': 'Bug (Issue, Debug, Error, Problem, Glitch)',
    '🐝': 'Honeybee (Busy, Yellow, Flying, Sweet, Small, Important)',
    '🐦‍🔥': 'Phoenix (Rebirth, Mythical)',
    '🐨': 'Koala (Sleepy, Calm, Cute, Peaceful, Tree, Australian)',
    '🐪': 'Camel (Desert, Hump, Dry, Tough, Calm, Walking)',
    '🐬': 'Dolphin (Smart, Playful, Swimming, Friendly, Gray, Ocean)',
    '🐭': 'Mouse (Small, Curious, Quick, Resourceful, Sneaky, Tiny)',
    '🐯': 'Tiger (Fierce, Strong, Powerful, Striped, Wild, Bold)',
    '🐰': 'Rabbit (Gentle, Fast, Hopping, Cute, Soft, Peaceful)',
    '🐱': 'Cat (Independent, Graceful, Mysterious, Calm, Quiet, Curious)',
    '🐳': 'Whale (Big, Blue, Swimming, Massive, Docker, Container, DevOps, Big Data, Shipping)',
    '🐵': 'Monkey (Playful, Clever, Climbing, Curious, Loud, Hairy)',
    '🐶': 'Dog (Loyal, Playful, Protective, Energetic, Faithful, Warm)',
    '🐸': 'Frog (Green, Jumping, Wet, Slimy, Playful, Pond)',
    '🐹': 'Hamster (Fluffy, Cute, Energetic, Playful, Round, Soft)',
    '🐻': 'Bear (Strong, Powerful, Protective, Big, Wild, Calm)',
    '🐼': 'Panda (Cute, Peaceful, Gentle, Calm, Round, Rare)',
    '🐾': 'Paw Prints (Animal, Dog, Cat, Track, Footprint, Pet, Nature)',
    '👆': 'Backhand Index Pointing Up (Point Up, Look Up, Important)',
    '👇': 'Backhand Index Pointing Down (Point Down, Look Down, Important)',
    '👈': 'Backhand Index Pointing Left (Point Left, This Way, Attention)',
    '👉': 'Backhand Index Pointing Right (Point Right, This Way, Attention)',
    '👋': 'Waving Hand (Hello, Goodbye, Hi, Greeting, Farewell)',
    '👌': 'OK Hand (Perfect, Good, Okay, Approved, Excellent)',
    '👍': 'Thumbs Up (Good, Approve, Like, Positive, Support)',
    '👎': 'Thumbs Down (Bad, Disapprove, Dislike, Negative, Reject)',
    '👏': 'Clapping Hands (Applause, Good Job, Praise, Celebration)',
    '👗': 'Dress (Clothes, Fashion, Woman, Skirt, Elegant, Shopping)',
    '👠': 'High-Heeled Shoe (Fashion, Feminine, Elegant, Stylish)',
    '👤': 'Person (Human, Profile, User, Identity, Face, Individual)',
    '👥': 'Busts in Silhouette (People, Community, Meeting, Group, Team)',
    '👨': 'Man (Male, Person, Adult, Guy, Beard)',
    '👨‍⚕️': 'Doctor (Man, Medical, Health, Hospital, Care)',
    '👨‍👩‍👧‍👦': 'Family (Parents, Kids, Home, Love, Together)',
    '👨‍🚀': 'Man Astronaut (Space, NASA)',
    '👩': 'Woman (Female, Person, Adult, Lady, Hair)',
    '👩‍⚕️': 'Doctor (Woman, Medical, Health, Hospital, Care)',
    '👯‍♀️': 'Women with Bunny Ears (Dancing, Party, Fun, Celebration)',
    '👶': 'Baby (Small, Cute, Child, New, Innocent)',
    '👾': 'Alien (Gaming, Retro, Pixel, Enemy, Space)',
    '💄': 'Lipstick (Makeup, Beauty, Lips, Fashion, Red, Cosmetic)',
    '💅': 'Nail Polish (Manicure, Beauty, Self-Care, Glam)',
    '💆‍♀️': 'Woman Getting Massage (Spa Day, Relaxation, Wellness, Self-Care, Therapy, Stress Relief, Pampering)',
    '💆‍♂️': 'Man Getting Massage (Relax, Spa, Wellness, Self-Care)',
    '💇‍♂️': 'Man Getting Haircut (Barber, Hair, Grooming, Style)',
    '💈': 'Barber Pole (Haircut, Barber)',
    '💊': 'Pill (Medicine, Drug, Health, Take, Cure)',
    '💌': 'Love Letter (Heart, Romance, Message, Valentine, Send, Affection)',
    '💍': 'Ring (Marriage, Engagement, Jewelry, Commitment, Love)',
    '💎': 'Diamond (Expensive, Shiny, Rich, Rare, Hard, Luxury)',
    '💓': 'Beating Heart (Love, Alive, Pulse, Romantic, Emotional, Heartbeat, Passionate)',
    '💔': 'Broken Heart (Sadness, Heartbreak, Pain, Loss, Emotional Hurt, Grief, Separation)',
    '💕': 'Two Hearts (Love, Romance, Couple, Affection, Togetherness, Dating, Relationship)',
    '💖': 'Sparkling Heart (Love, Shiny, Magical, Special, Glitter, Cute, Sparkle, Adoration)',
    '💗': 'Growing Heart (Love, Expanding, Increasing Affection, Bigger Love, Growing Feelings)',
    '💘': 'Heart with Arrow (Love, Cupid, Romance, Struck by Love, Valentine, Affection)',
    '💙': 'Blue Heart (Trust, Loyalty, Calm, Peace, Sadness, Deep Feeling, Stability)',
    '💚': 'Green Heart (Nature, Growth, Health, Eco-Friendly, Love, Fresh, Harmony, Environment)',
    '💛': 'Yellow Heart (Happiness, Friendship, Joy, Bright, Positive, Cheerful, Optimism)',
    '💜': 'Purple Heart (Royalty, Luxury, Spirituality, Creativity, Noble, Imagination)',
    '💝': 'Heart with Ribbon (Gift of Love, Present, Special, Wrapped Heart, Affection, Generosity)',
    '💞': 'Revolving Hearts (Love, Spinning, Romance, Eternal Connection, Unity, Harmony)',
    '💡': 'Lightbulb (Idea, Bright, Smart, Thought, On)',
    '💣': 'Bomb (Explosion, Danger)',
    '💤': 'Zzz (Sleeping, Tired)',
    '💥': 'Collision (Loud, Bright, Powerful, Fast, Impact, Boom, Dramatic, Explosion, Crash)',
    '💦': 'Sweat Droplets (Water, Sweat, Splash, Liquid, Wet)',
    '💩': 'Pile of Poo (Poop, Bad, Funny, Shit, Silly)',
    '💪': 'Arm (Muscle, Strong, Gym, Fitness, Power, Training)',
    '💬': 'Chat (Talking, Message, Conversation, Text, Reply, Bubble)',
    '💰': 'Money Bag (Cash, Rich, Wealth, Dollar, Green, Full)',
    '💱': 'Currency Exchange (Money Exchange, Forex, Convert Currency, Travel, International Money, Rate)',
    '💲': 'Dollar Sign (Money, Price, Cost, Rich, Value, Cash)',
    '💳': 'Credit Card (Plastic, Pay, Buy, Money, Spend, Swipe)',
    '💴': 'Yen Banknote (Japan, Japanese Yen, Money, Currency, Cash, Asia, Travel Money)',
    '💵': 'Dollar (Money, Cash, Bill, Rich, Paper, Green)',
    '💶': 'Euro Banknote (Europe, Euro, Money, Currency, Cash, EU, European Union, Travel)',
    '💷': 'Pound Sterling Banknote (UK, British Pound, Money, Currency, Cash, England, Travel)',
    '💻': 'Laptop (Computer, Work, Screen, Portable, Type)',
    '💼': 'Briefcase (Work, Business, Job, Professional, Corporate)',
    '💾': 'Floppy Disk (Save, Backup, Old Tech, Retro, Data Storage)',
    '📀': 'DVD (Disc, Media, Movie, Old Tech)',
    '📁': 'Folder (Files, Organize, Documents, Storage, Yellow)',
    '📄': 'Page (Document, File, Paper, Content, Text)',
    '📅': 'Calendar (Date, Schedule, Event, Appointment, Planning)',
    '📈': 'Chart Increasing (Growth, Profit, Up, Success, Rising)',
    '📉': 'Chart Decreasing (Decline, Loss, Down, Falling, Negative)',
    '📊': 'Bar Chart (Data, Stats, Analytics, Performance, Metrics)',
    '📋': 'Clipboard (Tasks, Todo, Copy, Checklist, Planning)',
    '📌': 'Pin (Pushpin, Important, Location, Red, Fix)',
    '📍': 'Round Pushpin (Location, Pin, Map, Mark, Important, Place, GPS)',
    '📎': 'Paperclip (Clip, Attach, Hold, Office, Metal, Attachment, Organize, Clippy)',
    '📖': 'Book (Reading, Study, Knowledge, Learning, Pages, School)',
    '📚': 'Books (Read, Study, School, Knowledge, Pages)',
    '📜': 'Scroll (Document, Paper, Old, History, Text, Manuscript)',
    '📝': 'Memo (Note, Write, Paper, Pen, Message)',
    '📠': 'Fax Machine (Fax, Office, Document, Old Tech, Communication)',
    '📡': 'Satellite Antenna (Signal, Broadcast, Communication, Network, Tech)',
    '📢': 'Loudspeaker (Announcement, Megaphone, Alert, Important, Broadcast)',
    '📣': 'Megaphone (Announcement, Coach, Shout, Bullhorn, Attention)',
    '📤': 'Outbox Tray (Sending, Uploads, Export, Outgoing)',
    '📥': 'Inbox Tray (Downloads, Incoming, Email, Messages)',
    '📦': 'Package (Box, Delivery, Shipping, Parcel, Send, Receive, Logistics)',
    '📧': 'Email (Message, Mail, Digital, Professional, Inbox, Communication)',
    '📬': 'Open Mailbox with Raised Flag (Mail, Inbox)',
    '📰': 'Newspaper (News, Read, Paper, Daily, Information)',
    '📱': 'Mobile Phone (Smartphone, Cell, Device, Communication, Screen, Touch, Calls, Apps, Pocket, Scrolling, Connected)',
    '📶': 'Antenna Bars (Signal, WiFi, Network, Strength, Connectivity, Bars, Mobile)',
    '📷': 'Camera (Photo, Picture, Take, Lens, Memory)',
    '📹': 'Video Camera (Record, Film, Movie, Camcorder, Capture, Media)',
    '📺': 'TV (Watch, Screen, Show, Entertainment, Remote)',
    '📽️': 'Projector (Movie, Film, Screen, Old, Cinema)',
    '🔄': 'Refresh (Reload, Update, Sync, Restart, Cycle)',
    '🔌': 'Plug (Power, Electric, Connect, Cord, Energy)',
    '🔍': 'Magnifying Glass (Search, Find, Zoom, Look, Glass)',
    '🔐': 'Lock (Secure, Key, Safe, Private, Access)',
    '🔑': 'Key (Access, Password, Secure, Important, Solution)',
    '🔒': 'Lock (Secure, Safe, Key, Private, Password)',
    '🔔': 'Bell (Notification, Alert, Reminder, Ping, Alarm, Attention)',
    '🔖': 'Bookmark (Save, Favorite, Page, Read, Mark)',
    '🔗': 'Link (Chain, Connection, URL, Connect, Website)',
    '🔝': 'TOP Arrow (Top, Best, Highest, Go to Top, Up)',
    '🔠': 'Input Letters (ABC, Uppercase, Typing, Text, Keyboard, Latin)',
    '🔥': 'Fire (Hot, Heat, Blaze, Lit, Burning)',
    '🔧': 'Wrench (Tool, Fix, Repair, Mechanic, Turn)',
    '🔨': 'Hammer (Tool, Build, Repair, Construction, Powerful)',
    '🔫': 'Water Pistol (Toy Gun, Fun)',
    '🔬': 'Microscope (Science, Lab, Research, Detail, Discovery, Small, Zoom)',
    '🔭': 'Telescope (Astronomy, Space, Observation, Science, Wonder)',
    '🔱': 'Trident Emblem (Poseidon, Power)',
    '🕉️': 'Om Symbol (Hinduism, Meditation, Spirituality, Peace, Mantra, Yoga, Sound of Universe, Spirit, Hindu)',
    '🕒': 'Clock (Time, Schedule, Deadline, Punctuality)',
    '🕹️': 'Joystick (Retro, Arcade, Gaming, Classic, Old School)',
    '🖇️': 'Linked Paperclips (Chain, Connection, Office, Linked, Strong)',
    '🖌️': 'Paintbrush (Art, Paint, Color, Creative, Artist)',
    '🖤': 'Black Heart (Dark, Gothic, Strong, Serious, Edgy, Deep Love, Mystery)',
    '🖥️': 'Desktop (Computer, Monitor, Screen, Work, Big)',
    '🖱️': 'Mouse (Click, Pointer, Computer, Scroll, Cursor)',
    '🖼️': 'Picture (Photo, Art, Frame, Wall, Memory)',
    '🗂️': 'Card Index (Organization, Files, Archive, System)',
    '🗃️': 'Box (Storage, Files, Archive, Organize, Card)',
    '🗄️': 'Cabinet (Storage, Files, Office, Drawers, Organize)',
    '🗑️': 'Wastebasket (Trash, Delete)',
    '🗒️': 'Spiral Notepad (Notes, Todo, Memo, Ideas, Planning)',
    '🗓️': 'Spiral Calendar (Planning, Date, Schedule, Deadline, Time Management)',
    '🗡️': 'Dagger (Sharp, Weapon, Stealth, Fantasy, Small)',
    '🗣️': 'Speaking Head (Advocate, Talk, Communication, Speech, Voice)',
    '🗳️': 'Ballot Box (Voting, Election, Democracy, Civic Duty, Choice)',
    '🗺️': 'World Map (Location, Navigation, Travel, Exploration, Discovery)',
    '😀': 'Grinning Face (Happy, Joyful, Big Smile, Cheerful, Radiant)',
    '😁': 'Beaming Face with Smiling Eyes (Happy, Proud, Confident, Grinning)',
    '😂': 'Face with Tears of Joy (Laughing Hard, Hilarious, Comedy Gold, Emotional Release)',
    '😃': 'Grinning Face with Big Eyes (Happy, Excited, Surprised, Delighted)',
    '😄': 'Grinning Face with Smiling Eyes (Happy, Joy, Warm, Content)',
    '😇': 'Smiling Face with Halo (Innocent, Good, Angelic, Pure, Wholesome)',
    '😈': 'Smiling Face with Horns (Devil, Mischievous, Naughty, Playful Evil)',
    '😉': 'Winking Face (Playful, Flirty, Cheeky, Mischievous, Fun)',
    '😊': 'Smiling Face with Smiling Eyes (Warm, Friendly, Kind, Genuine Happiness)',
    '😍': 'Smiling Face with Heart-Eyes (Love, Adoration, Crush, Heart Eyes, Affectionate)',
    '😎': 'Smiling Face with Sunglasses (Cool, Confident, Stylish, Effortlessly Awesome)',
    '😏': 'Smirking Face (Smug, Knowing, Cocky, Playful, Suggestive)',
    '😐': 'Neutral Face (Meh, Indifferent, Blank, Unimpressed, Calm)',
    '😕': 'Confused Face (Unsure, Perplexed, Puzzled, Questioning)',
    '😠': 'Angry Face (Mad, Annoyed, Irritated, Frustrated, Heated)',
    '😢': 'Crying Face (Sad, Tearful, Emotional, Heartbroken)',
    '😭': 'Loudly Crying Face (Very Sad, Sobbing, Distraught, Overwhelmed with Emotion)',
    '😴': 'Sleeping Face (Tired, Asleep, Exhausted, Peaceful Rest)',
    '🙁': 'Slightly Frowning Face (Mild Sad, Disappointed, Concerned)',
    '🙂': 'Slightly Smiling Face (Mild Happy, Polite, Gentle, Friendly)',
    '🙈': 'See-No-Evil Monkey (Hiding, Embarrassed, Cute, Playful, Silly)',
    '🙉': 'Hear-No-Evil Monkey (Ignoring, Quiet, Peaceful, Selective, Calm)',
    '🙊': 'Speak-No-Evil Monkey (Silent, Quiet, Secret, Mysterious, Calm)',
    '🙋‍♂️': 'Man Raising Hand (Question, Volunteer, Pick Me, Attention)',
    '🙌': 'Raising Hands (Celebration, Praise, Success, Joyful)',
    '🙏': 'Folded Hands (Please, Thank You, Prayer, Hope, Respect)',
    '🚀': 'Rocket (Launch, Deploy, Startup, Space, Fast Growth)',
    '🚁': 'Helicopter (Aircraft, Travel, Aerial, Exciting, VIP)',
    '🚄': 'High-Speed Train (Bullet Train, Fast Travel, Shinkansen, Transportation)',
    '🚇': 'Metro (Subway, Underground, Train, Commute, City Transport)',
    '🚌': 'Bus (Public Transport, Travel, Commuting, Affordable)',
    '🚎': 'Trolleybus (Public Transport, Electric, City)',
    '🚕': 'Taxi (Cab, Ride, Transportation, Urban, Convenient)',
    '🚗': 'Car (Driving, Vehicle, Automobile, Road Trip, Freedom)',
    '🚚': 'Delivery Truck (Truck, Shipping, Logistics, Transport, Cargo, Van, Deliver)',
    '🚢': 'Ship (Boat, Cruise, Ocean, Travel, Sea, Vessel, Transport)',
    '🚤': 'Speedboat (Boat, Fast)',
    '🚲': 'Bicycle (Bike, Cycling, Eco-Friendly, Healthy, Fun)',
    '🚴': 'Cycling (Bike, Ride, Sport, Wheel, Fast, Exercise, Healthy)',
    '🛁': 'Bathtub (Bath, Relaxation, Hygiene, Self-Care, Soak)',
    '🛌': 'Person in Bed (Sleep, Rest)',
    '🛍️': 'Shopping Bags (Buy, Store, Shop, Carry, Retail)',
    '🛐': 'Worship (Pray, Religion, Holy, Faith, Temple)',
    '🛒': 'Shopping Cart (Groceries, Shopping, Buy, Consumer, Convenient, Store, Food, Push)',
    '🛝': 'Playground Slide (Play, Fun)',
    '🛟': 'Ring Buoy (Life Saver, Safety)',
    '🛠️': 'Tools (Fix, Repair, Hammer, Wrench, Work)',
    '🛡️': 'Shield (Protection, Insurance, Security, Safety, Defense, Strong, Armor)',
    '🛣️': 'Motorway (Highway, Road)',
    '🛤️': 'Railway Track (Train, Path)',
    '🛫': 'Airplane Departure (Flight, Travel, Airport, Takeoff, Plane, Depart)',
    '🛰️': 'Satellite (Space, Orbit, GPS, Communication, Technology, Science)',
    '🛳️': 'Cruise Ship (Boat, Vacation, Ocean, Travel, Luxury, Sea, Holiday)',
    '🛴': 'Kick Scooter (Scooter, Ride, Urban Mobility, Fun, Transportation)',
    '🛵': 'Motor Scooter (Scooter, Ride, Urban, Convenient, Fun)',
    '🟰': 'Equals (Same, Result, Total, Answer, Math)',
    '🤌': 'Pinched Fingers (Italian Gesture, Small, What Do You Want, Tiny)',
    '🤍': 'White Heart (Pure, Clean, Peace, Innocence, Sincerity, Light, Honest)',
    '🤎': 'Brown Heart (Warmth, Earthy, Stability, Comfort, Natural, Grounded, Reliable)',
    '🤏': 'Pinching Hand (Small Amount, Tiny, Little Bit, Precise)',
    '🤑': 'Money-Mouth Face (Rich, Wealthy, Greedy, Cash, Money Face, Excited about Money, Dollar Signs)',
    '🤖': 'Robot (AI, Automation, Bot, Machine, Future)',
    '🤘': 'Sign of the Horns (Rock On, Metal, Concert, Devil Horns)',
    '🤝': 'Handshake (Agreement, Deal, Partnership, Trust, Business)',
    '🤟': 'Love-You Gesture (I Love You, ILY, Affection, Rock On)',
    '🤦‍♂️': 'Man Facepalming (Frustrated, Embarrassed, Disappointed, Oh No)',
    '🤩': 'Star-Struck Face (Amazed, Excited, Celebrity Crush, Wow, Starstruck)',
    '🤯': 'Exploding Head (Mind Blown, Shocked, Overwhelmed, Speechless, Amazed)',
    '🤰': 'Pregnant (Baby, Belly, Mother, Expecting, Round)',
    '🤷‍♂️': 'Man Shrugging (Don\'t Know, Whatever, Indifferent, Who Cares)',
    '🤹‍♂️': 'Man Juggling (Multitask, Skill, Balance, Busy)',
    '🤺': 'Fencing (Sword, Sport, Fight, Elegant, Fast)',
    '🥁': 'Drum (Music, Percussion)',
    '🥂': 'Champagne (Glass, Toast, Drink, Celebration, Bubbly)',
    '🥇': '1st Place Medal (Gold, First, Winner, Champion, Best)',
    '🥊': 'Boxing (Glove, Fight, Sport, Punch, Strong)',
    '🥋': 'Karate (Uniform, Belt, Sport, Fight, Discipline)',
    '🥎': 'Softball',
    '🥑': 'Avocado (Green, Creamy, Healthy, Fruit, Soft)',
    '🥓': 'Bacon (Food, Breakfast)',
    '🥕': 'Carrot (Orange, Vegetable, Crunchy, Healthy, Long)',
    '🥗': 'Salad (Green, Healthy, Fresh, Vegetable, Food)',
    '🥚': 'Egg (White, Yellow, Round, Breakfast, Protein)',
    '🥝': 'Kiwi (Green, Brown, Sweet, Sour, Fruit)',
    '🥟': 'Dumpling (Round, Steamed, Asian, Soft, Tasty)',
    '🥡': 'Takeout Box (Food, Chinese, Box, Delivery, Container)',
    '🥢': 'Chopsticks (Asian, Eat, Wood, Pair, Food)',
    '🥥': 'Coconut (Brown, Hard, White, Tropical, Sweet)',
    '🥦': 'Broccoli (Green, Vegetable, Healthy, Tree, Crunchy)',
    '🥩': 'Steak (Meat, Juicy, Grilled, Red, Protein)',
    '🥬': 'Lettuce (Green, Leafy, Salad, Fresh, Healthy)',
    '🥭': 'Mango (Orange, Sweet, Juicy, Tropical, Fruit)',
    '🥳': 'Partying Face (Celebration, Birthday, Festive, Joyful, Party Time)',
    '🥶': 'Cold Face (Freezing, Chilly, Blue Lips, Shivering, Frosty)',
    '🥸': 'Disguised Face (Incognito, Spy, Funny Disguise, Undercover, Silly)',
    '🥾': 'Hiking Boot (Hiking, Trekking, Outdoor Adventure, Trail Walking, Sturdy Shoes, Nature, Mountain)',
    '🦁': 'Lion (Strong, Fierce, Majestic, Leader, Powerful, Proud)',
    '🦄': 'Unicorn (Mythical, Fantasy)',
    '🦊': 'Fox (Firefox, Browser, Clever, Fast, Mozilla)',
    '🦐': 'Shrimp (Small, Pink, Curved, Swimming, Soft, Edible)',
    '🦸': 'Superhero (Hero, Strong, Cape, Power, Comic)',
    '🦺': 'Safety Vest (Construction, High Visibility, Safety, Worker)',
    '🧀': 'Cheese (Yellow, Creamy, Dairy, Tasty, Slice)',
    '🧃': 'Juice Box (Drink, Sweet, Box, Kid, Liquid)',
    '🧈': 'Butter (Yellow, Creamy, Soft, Dairy, Spread)',
    '🧑‍🌾': 'Farmer (Gardener, Agriculture, Plants, Harvest, Rural Life, Growing Food, Field Work, Nature)',
    '🧑‍🏫': 'Teacher (School, Class, Learning, Smart, Help, Lesson)',
    '🧑‍💻': 'Technologist (Developer, Coder, Programmer, Tech Professional)',
    '🧑‍💼': 'Office Worker (Business, Professional, Corporate, Employee)',
    '🧑‍🔬': 'Scientist (Research, Lab, Experiment, Discovery, Innovation)',
    '🧑‍🧑‍🧒‍🧒': 'Family: Adult, Adult, Child, Child',
    '🧖‍♀️': 'Woman in Steamy Room (Sauna, Spa, Relaxation, Wellness)',
    '🧖‍♂️': 'Man in Steamy Room (Sauna, Spa, Steam Room, Relaxation, Wellness, Heat)',
    '🧗': 'Climbing (Rock, Wall, Sport, Strong, High)',
    '🧘': 'Person Sitting (Yoga, Calm, Peace, Meditation, Relax)',
    '🧘‍♀️': 'Woman in Lotus Position (Yoga, Meditation, Mindfulness, Calm, Zen, Stretch, Wellness, Inner Peace)',
    '🧘‍♂️': 'Man in Lotus Position (Yoga, Meditation, Mindfulness, Calm, Zen, Wellness)',
    '🧜‍♀️': 'Mermaid (Fantasy, Ocean)',
    '🧠': 'Brain (Smart, Think, AI, Mind, Intelligence)',
    '🧡': 'Orange Heart (Warmth, Care, Friendship, Energy, Support, Kindness, Autumn)',
    '🧨': 'Firecracker (Loud, Explosive, Red, Festive, Pop, Bang, Celebration)',
    '🧩': 'Puzzle (Game, Piece, Solve, Connect, Missing)',
    '🧪': 'Test Tube (Experiment, Test, Science, Lab, Research)',
    '🧬': 'DNA (Science, Gene, Biology, Life, Helix)',
    '🧮': 'Abacus (Calculator, Math, Count, Ancient Tech, Calculation)',
    '🧯': 'Fire Extinguisher (Safety, Emergency)',
    '🧰': 'Toolbox (Tools, Repair, Kit, Handy, Organized)',
    '🧳': 'Luggage (Baggage, Suitcase, Travel, Trip, Pack, Airport, Vacation)',
    '🧴': 'Lotion Bottle (Cream, Sunscreen, Skincare, Beauty, Liquid, Health)',
    '🧷': 'Safety Pin (Fasten, Baby, Utility, Practical, Secure)',
    '🧾': 'Receipt (Invoice, Bill, Payment, Expense, Record)',
    '🧿': 'Nazar Amulet (Evil Eye Protection, Talisman, Good Luck, Spiritual)',
    '🩴': 'Thong Sandal (Flip Flop, Beach, Casual, Summer)',
    '🩹': 'Bandage (Injury, Hurt, Heal, First Aid, Cover)',
    '🩺': 'Stethoscope (Doctor, Listen, Heart, Medical, Check)',
    '🩻': 'X-Ray (Bone, Doctor, Scan, Medical, See)',
    '🪓': 'Axe (Tool, Chop, Wood, Strong, Survival)',
    '🪙': 'Coin (Money, Round, Metal, Small, Rich, Currency)',
    '🪛': 'Screwdriver (Tool, Fix, Repair, Precision, Handy)',
    '🪜': 'Ladder (Climb, Height, Tool, Reach, Access)',
    '🪟': 'Window (App, GUI, View, Glass, Frame, Screen, Browser)',
    '🪬': 'Hamsa Hand (Protection, Good Fortune, Spiritual Shield, Luck)',
    '🪴': 'Potted Plant (Houseplant, Indoor Plant, Green Decor, Home Gardening, House Plant, Decorative Plant)',
    '🪷': 'Lotus Flower (Meditation, Peace, Buddhism, Purity, Spiritual, Calm, Enlightenment, Yoga)',
    '🪿': 'Goose (Loud, White, Protective, Silly, Aggressive, Feathery)',
    '🫁': 'Lungs (Breathing, Breath, Respiratory, Health, Wellness, Air)',
    '🫎': 'Moose (Big, Tall, Antlers, Calm, Strong, Majestic)',
    '🫙': 'Jar (Container, Glass)',
    '🫠': 'Melting Face (Embarrassed, Overwhelmed, Sarcastic, Melting Away, Flustered)',
    '🫥': 'Dotted Line Face (Invisible, Hidden, Ghosted, Fading, Disappearing)',
    '🫵': 'Index Pointing at the Viewer (You, Pointing, Direct, Attention)'

};
