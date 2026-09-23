# Proposed emoji additions

Review list only. `js/config.js` is unchanged.

75 glyphs that are not in `COMMON_EMOJIS` or `EMOJI_NAMES`, grouped into the category each one should join. Descriptors follow the comment at the top of the emoji block in `js/config.js`:

> Emoji picker: format Name (keywords); parens hidden in tooltips but searchable.
> Keep EMOJI_NAMES ↔ COMMON_EMOJIS in sync; categories alphabetical; General last resort; new category needs ≥5.

How to read an entry:

- The string in backticks is the `EMOJI_NAMES` value.
- Text before the parenthesis is the tooltip. The picker strips the parenthetical.
- Text inside the parenthesis is extra search material. Search matches the full string.
- Important search terms lead the keyword list.
- Each glyph is in one category. Append new glyphs to the end of the existing array so the current order stays put.
- None of the 75 are ZWJ sequences. A variation selector is included only where Unicode's fully-qualified form has one, the same way `✌️` and `⚕️` are already stored.

Counted from `js/config.js` while drafting: **25** categories, **486** `COMMON_EMOJIS` slots (**485** unique; `🔠` is in both General and Tech), **486** `EMOJI_NAMES` keys.

## Summary

| Category | Now | Add | After |
| --- | ---: | ---: | ---: |
| Animals | 27 | 4 | 31 |
| Celebration & Explosions | 6 | 2 | 8 |
| Celestial | 7 | 2 | 9 |
| Communication | 6 | 0 | 6 |
| Education & Learning | 9 | 2 | 11 |
| Faces & Emotions | 27 | 6 | 33 |
| Finance & Money | 14 | 0 | 14 |
| Food & Drink | 46 | 8 | 54 |
| Gaming & Retro | 8 | 1 | 9 |
| General | 39 | 0 | 39 |
| Hand Gestures | 17 | 3 | 20 |
| Health & Lifestyle | 31 | 4 | 35 |
| Hearts | 17 | 0 | 17 |
| Media & Entertainment | 23 | 3 | 26 |
| Parks | 2 | 5 | 7 |
| Plants & Nature | 13 | 3 | 16 |
| Playing Cards | 5 | 0 | 5 |
| Religious & Spiritual | 5 | 6 | 11 |
| Sports | 30 | 4 | 34 |
| Symbols & Signs (new) | 0 | 6 | 6 |
| Tech & Development | 31 | 4 | 35 |
| Tools & Objects | 25 | 2 | 27 |
| Travel & Transportation | 29 | 3 | 32 |
| Weather | 15 | 3 | 18 |
| Work & Productivity | 42 | 3 | 45 |
| Zodiac | 12 | 1 | 13 |
| **Total** | **486** slots / **485** unique | **75** | **561** slots / **560** unique |

The Now column is array length. General and Tech each include `🔠`, so that column sums to 486 slots and 485 unique glyphs.

Categories with nothing new in this batch: Communication, Finance & Money, General, Hearts, and Playing Cards. General stays a last resort. Hearts, finance, and the card suits are already tight sets. Communication's phone and mail glyphs already cover call and message search.

`Symbols & Signs` is the only new category (6 glyphs). `Parks` grows from 2 to 7, which clears the under-5 gap called out in the comment.

## Category order

The comment asks for alphabetical category keys. Three pairs in the current file are inverted:

- `Celebration & Explosions` belongs before `Celestial`.
- `Health & Lifestyle` belongs before `Hearts`.
- `Parks` belongs before `Plants & Nature`.

This note lists categories in alphabetical order. `Symbols & Signs` slots between `Sports` and `Tech & Development`. Moving those three existing keys can happen in the same edit as the new glyphs, or later. The new glyphs do not depend on that move.

## Catalog sync notes

The same comment says to keep `EMOJI_NAMES` and `COMMON_EMOJIS` in sync. The file already drifts in a few places. This proposal leaves that drift as it is:

- `❤️‍🩹` Mending Heart is in `EMOJI_NAMES` and in no category.
- `💆‍♀️`, `🧖‍♂️`, and `🧘‍♂️` differ between the two maps by a variation selector on the gender sign (`2640` / `2642` versus `2640 FE0F` / `2642 FE0F`). The glyphs are the woman getting a massage, the man in a steamy room, and the man in lotus position.
- `🔠` is listed under both General and Tech & Development.

When the 75 land, each glyph needs the same fully-qualified string in both places.

## The 75

### Animals

**27** now, **+4**, **31** after.

Four animals the grid does not have. Penguin carries Linux and Tux in the leading keywords and stays in Animals, the same way the snake carries Python from this category. Crab is the Rust mascot and is proposed under Tech with the other product mascots.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🐧 | `Penguin (Linux, Tux, Bird, Cold, Antarctic, Waddle, Cute, Ice)` | Linux and Tux links, kept with the animals |
| 🦉 | `Owl (Wise, Night, Knowledge, Bird, Hoot, Nocturnal, Study, Lookout)` | Wisdom, night, and study |
| 🦋 | `Butterfly (Change, Transform, Wings, Insect, Metamorphosis, Spring, Pretty, Flutter)` | Change, spring, and metamorphosis |
| 🐢 | `Turtle (Slow, Steady, Shell, Patient, Reptile, Ocean, Tortoise, Sea)` | Patience, reptiles, and the sea |

```js
// COMMON_EMOJIS["Animals"] — append
'🐧', '🦉', '🦋', '🐢'

// EMOJI_NAMES
'🐧': 'Penguin (Linux, Tux, Bird, Cold, Antarctic, Waddle, Cute, Ice)',
'🦉': 'Owl (Wise, Night, Knowledge, Bird, Hoot, Nocturnal, Study, Lookout)',
'🦋': 'Butterfly (Change, Transform, Wings, Insect, Metamorphosis, Spring, Pretty, Flutter)',
'🐢': 'Turtle (Slow, Steady, Shell, Patient, Reptile, Ocean, Tortoise, Sea)',
```

### Celebration & Explosions

**6** now, **+2**, **8** after.

Fireworks, sparkler, firecracker, party popper, confetti, and the collision burst are already here. Balloon and ribbon are the everyday party and gift shapes.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🎈 | `Balloon (Party, Birthday, Celebration, Float, Colorful, Helium, Inflated, Festive)` | Birthdays and parties |
| 🎀 | `Ribbon (Bow, Gift, Cute, Decoration, Present, Wrap, Craft, Pink)` | Gifts, bows, and crafts |

```js
// COMMON_EMOJIS["Celebration & Explosions"] — append
'🎈', '🎀'

// EMOJI_NAMES
'🎈': 'Balloon (Party, Birthday, Celebration, Float, Colorful, Helium, Inflated, Festive)',
'🎀': 'Ribbon (Bow, Gift, Cute, Decoration, Present, Wrap, Craft, Pink)',
```

### Celestial

**7** now, **+2**, **9** after.

The current row is sun, moon faces, and stars. These two add a planet and a galaxy. A plain crescent moon stayed out because moon search already hits the crescent and full-moon faces.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🪐 | `Ringed Planet (Saturn, Planet, Space, Astronomy, Orbit, Solar System, Rings, Cosmos)` | Saturn and a generic planet |
| 🌌 | `Milky Way (Galaxy, Space, Stars, Night Sky, Cosmos, Universe, Astronomy, Starfield)` | Galaxy and night-sky links |

```js
// COMMON_EMOJIS["Celestial"] — append
'🪐', '🌌'

// EMOJI_NAMES
'🪐': 'Ringed Planet (Saturn, Planet, Space, Astronomy, Orbit, Solar System, Rings, Cosmos)',
'🌌': 'Milky Way (Galaxy, Space, Stars, Night Sky, Cosmos, Universe, Astronomy, Starfield)',
```

### Education & Learning

**9** now, **+2**, **11** after.

Graduation cap, open book, pencil, the math signs, and the teacher are already here. School is the building. That same building glyph is the profession mark inside the teacher, which stays the person. This entry is the standalone campus icon.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🏫 | `School (Students, Class, Campus, Learn, Academy, Building, Classroom, Education)` | Campus and classroom building |
| 🎒 | `Backpack (School, Bag, Student, Books, Rucksack, Supplies, Carry, Daypack)` | Students and school supplies |

```js
// COMMON_EMOJIS["Education & Learning"] — append
'🏫', '🎒'

// EMOJI_NAMES
'🏫': 'School (Students, Class, Campus, Learn, Academy, Building, Classroom, Education)',
'🎒': 'Backpack (School, Bag, Student, Books, Rucksack, Supplies, Carry, Daypack)',
```

### Faces & Emotions

**27** now, **+6**, **33** after.

The category already covers basic smiles and a handful of big reactions. These six are common searches that miss today: think, eye-roll, please, nerd, hug, and ghost. Ghost is filed with faces because Unicode keeps it in Smileys & Emotion, beside the expressions already in this category. The hug glyph's Unicode name is smiling face with open hands; the tooltip says Hugging Face, and Open Hands is in the keywords.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🤔 | `Thinking Face (Think, Hmm, Consider, Ponder, Question, Curious, Wondering, Idea)` | Hmm, consider, and ponder |
| 🙄 | `Face with Rolling Eyes (Annoyed, Sarcasm, Whatever, Unimpressed, Eye Roll, Skeptical, Ugh, Bored)` | Sarcasm and whatever |
| 🥺 | `Pleading Face (Please, Puppy Eyes, Beg, Cute, Emotional, Sad, Pretty Please, Soft)` | Please and puppy eyes |
| 🤓 | `Nerd Face (Geek, Smart, Glasses, Study, Clever, Bookish, Dork, Intelligent)` | Geek, glasses, and study |
| 🤗 | `Hugging Face (Hug, Welcome, Open Hands, Care, Warm, Embrace, Friendly, Affection)` | Welcome, care, and a hug |
| 👻 | `Ghost (Halloween, Spooky, Spirit, Boo, Phantom, Haunted, Scary, October)` | Halloween and spooky links |

```js
// COMMON_EMOJIS["Faces & Emotions"] — append
'🤔', '🙄', '🥺', '🤓', '🤗', '👻'

// EMOJI_NAMES
'🤔': 'Thinking Face (Think, Hmm, Consider, Ponder, Question, Curious, Wondering, Idea)',
'🙄': 'Face with Rolling Eyes (Annoyed, Sarcasm, Whatever, Unimpressed, Eye Roll, Skeptical, Ugh, Bored)',
'🥺': 'Pleading Face (Please, Puppy Eyes, Beg, Cute, Emotional, Sad, Pretty Please, Soft)',
'🤓': 'Nerd Face (Geek, Smart, Glasses, Study, Clever, Bookish, Dork, Intelligent)',
'🤗': 'Hugging Face (Hug, Welcome, Open Hands, Care, Warm, Embrace, Friendly, Affection)',
'👻': 'Ghost (Halloween, Spooky, Spirit, Boo, Phantom, Haunted, Scary, October)',
```

### Food & Drink

**46** now, **+8**, **54** after.

This is already the largest category, and it still has no skillet, ramen, sushi, taco, popcorn, donut, tea, or boba. Coffee already lives in Work as the hot beverage glyph, so tea is the pair.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🍳 | `Cooking (Frying Pan, Breakfast, Egg, Skillet, Fried, Cook, Pan, Sunny Side Up)` | Frying pan and breakfast |
| 🍜 | `Steaming Bowl (Ramen, Noodles, Soup, Hot, Asian, Tasty, Pho, Noodle Soup)` | Ramen, pho, and noodle soup |
| 🍣 | `Sushi (Japanese, Fish, Rice, Roll, Seafood, Fresh, Sashimi, Nigiri)` | Japanese food |
| 🌮 | `Taco (Mexican, Tortilla, Spicy, Shell, Crispy, Tasty, Street Food, Salsa)` | Mexican and street food |
| 🍿 | `Popcorn (Movie, Snack, Cinema, Salty, Corn, Butter, Theater, Film Night)` | Movies and snacks |
| 🍩 | `Doughnut (Donut, Sweet, Dessert, Sprinkles, Soft, Round, Pastry, Glaze)` | Donut shops and sweet treats |
| 🍵 | `Teacup (Tea, Hot, Drink, Calm, Cup, Green, Kettle, Steep)` | Tea, paired with the coffee cup in Work |
| 🧋 | `Bubble Tea (Boba, Milk Tea, Sweet, Drink, Straw, Tapioca, Pearl, Taiwan)` | Boba and milk tea |

```js
// COMMON_EMOJIS["Food & Drink"] — append
'🍳', '🍜', '🍣', '🌮', '🍿', '🍩', '🍵', '🧋'

// EMOJI_NAMES
'🍳': 'Cooking (Frying Pan, Breakfast, Egg, Skillet, Fried, Cook, Pan, Sunny Side Up)',
'🍜': 'Steaming Bowl (Ramen, Noodles, Soup, Hot, Asian, Tasty, Pho, Noodle Soup)',
'🍣': 'Sushi (Japanese, Fish, Rice, Roll, Seafood, Fresh, Sashimi, Nigiri)',
'🌮': 'Taco (Mexican, Tortilla, Spicy, Shell, Crispy, Tasty, Street Food, Salsa)',
'🍿': 'Popcorn (Movie, Snack, Cinema, Salty, Corn, Butter, Theater, Film Night)',
'🍩': 'Doughnut (Donut, Sweet, Dessert, Sprinkles, Soft, Round, Pastry, Glaze)',
'🍵': 'Teacup (Tea, Hot, Drink, Calm, Cup, Green, Kettle, Steep)',
'🧋': 'Bubble Tea (Boba, Milk Tea, Sweet, Drink, Straw, Tapioca, Pearl, Taiwan)',
```

### Gaming & Retro

**8** now, **+1**, **9** after.

Controller, joystick, alien monster, dice, and cards are covered. Casino was the hole.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🎰 | `Slot Machine (Casino, Gamble, Jackpot, Luck, Vegas, Betting, Slots, Cherry)` | Casino, jackpot, and betting |

```js
// COMMON_EMOJIS["Gaming & Retro"] — append
'🎰'

// EMOJI_NAMES
'🎰': 'Slot Machine (Casino, Gamble, Jackpot, Luck, Vegas, Betting, Slots, Cherry)',
```

### Hand Gestures

**17** now, **+3**, **20** after.

Thumbs, pointing, pinch, horns, and the love-you gesture are already here. These three add luck, stop, and shaka.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🤞 | `Crossed Fingers (Luck, Hope, Wish, Good Luck, Fingers Crossed, Hoping, Anxious, Please)` | Luck and hope |
| ✋ | `Raised Hand (Stop, Wait, High Five, Halt, Pause, Hold, Hand Up, Attention)` | Stop, wait, and high five |
| 🤙 | `Call Me Hand (Shaka, Hang Loose, Call, Surf, Cool, Aloha, Phone, Relax)` | Shaka and hang loose |

```js
// COMMON_EMOJIS["Hand Gestures"] — append
'🤞', '✋', '🤙'

// EMOJI_NAMES
'🤞': 'Crossed Fingers (Luck, Hope, Wish, Good Luck, Fingers Crossed, Hoping, Anxious, Please)',
'✋': 'Raised Hand (Stop, Wait, High Five, Halt, Pause, Hold, Hand Up, Attention)',
'🤙': 'Call Me Hand (Shaka, Hang Loose, Call, Surf, Cool, Aloha, Phone, Relax)',
```

### Health & Lifestyle

**31** now, **+4**, **35** after.

Hospital, medicine, fitness, and spa glyphs are in good shape. Dentist, injections, vision, and accessibility were missing. The wheelchair entry is the single symbol, with no skin tone and no gender.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🦷 | `Tooth (Dental, Dentist, Teeth, Hygiene, Toothbrush, Enamel, Smile, Oral)` | Dentist and teeth |
| 💉 | `Syringe (Vaccine, Shot, Injection, Needle, Medical, Immunization, Dose, Booster)` | Vaccines, shots, and injections |
| 👁️ | `Eye (Vision, See, Sight, Look, Optometry, Gaze, Eyeball, Iris)` | Vision and optometry |
| ♿ | `Wheelchair Symbol (Accessibility, Accessible, Disability, Inclusive, Mobility, Access, Wheelchair, Ramp)` | Accessibility |

```js
// COMMON_EMOJIS["Health & Lifestyle"] — append
'🦷', '💉', '👁️', '♿'

// EMOJI_NAMES
'🦷': 'Tooth (Dental, Dentist, Teeth, Hygiene, Toothbrush, Enamel, Smile, Oral)',
'💉': 'Syringe (Vaccine, Shot, Injection, Needle, Medical, Immunization, Dose, Booster)',
'👁️': 'Eye (Vision, See, Sight, Look, Optometry, Gaze, Eyeball, Iris)',
'♿': 'Wheelchair Symbol (Accessibility, Accessible, Disability, Inclusive, Mobility, Access, Wheelchair, Ramp)',
```

### Media & Entertainment

**23** now, **+3**, **26** after.

Guitar, drum, headphones, and a music note are already here. Microphone covers singing, karaoke, and podcasts in one glyph. Piano and the theater masks are the other gaps. A separate studio microphone is in the alternates if podcasts should have their own icon.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🎤 | `Microphone (Sing, Podcast, Karaoke, Voice, Audio, Mic, Vocal, Speak)` | Singing, karaoke, and podcasts |
| 🎹 | `Musical Keyboard (Piano, Keys, Music, Instrument, Melody, Synth, Organ, Play)` | Piano and keys |
| 🎭 | `Performing Arts (Theater, Drama, Masks, Acting, Stage, Broadway, Comedy, Tragedy)` | Theater, drama, and the masks |

```js
// COMMON_EMOJIS["Media & Entertainment"] — append
'🎤', '🎹', '🎭'

// EMOJI_NAMES
'🎤': 'Microphone (Sing, Podcast, Karaoke, Voice, Audio, Mic, Vocal, Speak)',
'🎹': 'Musical Keyboard (Piano, Keys, Music, Instrument, Melody, Synth, Organ, Play)',
'🎭': 'Performing Arts (Theater, Drama, Masks, Acting, Stage, Broadway, Comedy, Tragedy)',
```

### Parks

**2** now, **+5**, **7** after.

Parks holds tent and camping only, two glyphs, under the comment's minimum of 5. These five bring it to 7. Ferris wheel, carousel, and fountain match the category name. Castle and the Statue of Liberty are landmarks. If Parks should stay on outdoor recreation, swap those two for the deer and canoe in the alternates. In config.js this key currently sits after Plants & Nature; alphabetical order puts Parks first. See Category order above.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🎡 | `Ferris Wheel (Amusement Park, Fair, Carnival, Ride, Funfair, Wheel, Theme Park, County Fair)` | Amusement park and fair |
| 🎠 | `Carousel Horse (Merry-Go-Round, Carousel, Amusement, Ride, Fair, Park, Carnival, Horse)` | Merry-go-round |
| ⛲ | `Fountain (Park, Water, Plaza, Spray, Landmark, Garden, Wish, Courtyard)` | Park plaza and water |
| 🏰 | `Castle (Fortress, Fairy Tale, Kingdom, Historic, Landmark, Medieval, Palace, Royalty)` | Fairy tale and historic landmark |
| 🗽 | `Statue of Liberty (New York, NYC, Freedom, Landmark, Monument, USA, Liberty, America)` | New York and monuments |

```js
// COMMON_EMOJIS["Parks"] — append
'🎡', '🎠', '⛲', '🏰', '🗽'

// EMOJI_NAMES
'🎡': 'Ferris Wheel (Amusement Park, Fair, Carnival, Ride, Funfair, Wheel, Theme Park, County Fair)',
'🎠': 'Carousel Horse (Merry-Go-Round, Carousel, Amusement, Ride, Fair, Park, Carnival, Horse)',
'⛲': 'Fountain (Park, Water, Plaza, Spray, Landmark, Garden, Wish, Courtyard)',
'🏰': 'Castle (Fortress, Fairy Tale, Kingdom, Historic, Landmark, Medieval, Palace, Royalty)',
'🗽': 'Statue of Liberty (New York, NYC, Freedom, Landmark, Monument, USA, Liberty, America)',
```

### Plants & Nature

**13** now, **+3**, **16** after.

Trees, flowers, clover, and the national-park scene are already here. Autumn, fungi, and the harvest crop were missing. The sheaf is also the profession mark inside the farmer glyph, which stays the person. This entry is the standalone crop.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🍁 | `Maple Leaf (Autumn, Fall, Canada, Foliage, Red, Leaf, Canadian, October)` | Autumn and Canada |
| 🍄 | `Mushroom (Fungi, Forest, Toadstool, Cap, Forage, Woodland, Fungus, Mycelium)` | Fungi and the forest floor |
| 🌾 | `Sheaf of Rice (Grain, Harvest, Farm, Wheat, Agriculture, Crop, Rice, Barley)` | Harvest, grain, and crops |

```js
// COMMON_EMOJIS["Plants & Nature"] — append
'🍁', '🍄', '🌾'

// EMOJI_NAMES
'🍁': 'Maple Leaf (Autumn, Fall, Canada, Foliage, Red, Leaf, Canadian, October)',
'🍄': 'Mushroom (Fungi, Forest, Toadstool, Cap, Forage, Woodland, Fungus, Mycelium)',
'🌾': 'Sheaf of Rice (Grain, Harvest, Farm, Wheat, Agriculture, Crop, Rice, Barley)',
```

### Religious & Spiritual

**5** now, **+6**, **11** after.

Cross, crescent, om, and the dharma wheel are already here, plus a generic worship glyph. This pass adds a Jewish symbol, yin yang, the peace symbol, and buildings for mosque, church, and Hindu temple. Synagogue, menorah, and the Kaaba are alternates if you want them in the same pass. Peace stays in this category so General can stay a last resort.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| ✡️ | `Star of David (Judaism, Jewish, Faith, Israel, Religion, Hebrew, Jewish Star, Magen David)` | Jewish faith |
| ☯️ | `Yin Yang (Balance, Taoism, Tao, Harmony, Opposite, Duality, Yang, Dao)` | Balance, Tao, and duality |
| ☮️ | `Peace Symbol (Harmony, Pacifism, Nonviolence, Calm, Hippie, Anti-War, Peaceful, Truce)` | Peace as its own sign |
| 🕌 | `Mosque (Islam, Muslim, Worship, Prayer, Masjid, Minaret, Salah, Islamic)` | Muslim place of worship |
| ⛪ | `Church (Christian, Worship, Chapel, Faith, Congregation, Steeple, Sunday, Parish)` | Christian place of worship |
| 🛕 | `Hindu Temple (Hinduism, Hindu, Mandir, Worship, Faith, Shrine, Puja, Deity)` | Hindu place of worship |

```js
// COMMON_EMOJIS["Religious & Spiritual"] — append
'✡️', '☯️', '☮️', '🕌', '⛪', '🛕'

// EMOJI_NAMES
'✡️': 'Star of David (Judaism, Jewish, Faith, Israel, Religion, Hebrew, Jewish Star, Magen David)',
'☯️': 'Yin Yang (Balance, Taoism, Tao, Harmony, Opposite, Duality, Yang, Dao)',
'☮️': 'Peace Symbol (Harmony, Pacifism, Nonviolence, Calm, Hippie, Anti-War, Peaceful, Truce)',
'🕌': 'Mosque (Islam, Muslim, Worship, Prayer, Masjid, Minaret, Salah, Islamic)',
'⛪': 'Church (Christian, Worship, Chapel, Faith, Congregation, Steeple, Sunday, Parish)',
'🛕': 'Hindu Temple (Hinduism, Hindu, Mandir, Worship, Faith, Shrine, Puja, Deity)',
```

### Sports

**30** now, **+4**, **34** after.

Balls, gym work, and the gold medal are well covered. The bullseye, bowling, and the rest of the podium were missing. Direct Hit also carries Goal, Aim, and Focus for target-style links.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🎯 | `Direct Hit (Target, Bullseye, Goal, Aim, Accuracy, Focus, Bulls Eye, On Target)` | Target, goal, and focus |
| 🎳 | `Bowling (Pins, Strike, Alley, Ball, Spare, Tenpin, Bowling Ball, Lane)` | Tenpin and the alley |
| 🥈 | `2nd Place Medal (Silver, Second, Runner-Up, Medal, Award, Podium, Second Place, Silver Medal)` | Silver, so the podium matches the gold medal |
| 🥉 | `3rd Place Medal (Bronze, Third, Medal, Award, Prize, Podium, Third Place, Bronze Medal)` | Bronze, to finish the podium |

```js
// COMMON_EMOJIS["Sports"] — append
'🎯', '🎳', '🥈', '🥉'

// EMOJI_NAMES
'🎯': 'Direct Hit (Target, Bullseye, Goal, Aim, Accuracy, Focus, Bulls Eye, On Target)',
'🎳': 'Bowling (Pins, Strike, Alley, Ball, Spare, Tenpin, Bowling Ball, Lane)',
'🥈': '2nd Place Medal (Silver, Second, Runner-Up, Medal, Award, Podium, Second Place, Silver Medal)',
'🥉': '3rd Place Medal (Bronze, Third, Medal, Award, Prize, Podium, Third Place, Bronze Medal)',
```

### Symbols & Signs

New category. **6** glyphs.

Six glyphs meet the minimum of 5. These are signs people hunt for. Putting them here keeps General as a last resort. Insert the key alphabetically between Sports and Tech & Development.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| ♻️ | `Recycling Symbol (Eco, Reuse, Sustainability, Green, Environment, Waste, Recycle Bin, Conservation)` | Eco, reuse, and waste |
| ♾️ | `Infinity (Endless, Limitless, Forever, Loop, Math, Boundless, Infinite, Eternity)` | Forever, loops, and math |
| 💯 | `Hundred Points (Perfect, Score, 100, Excellent, Full Marks, Ace, One Hundred, A+)` | A perfect score and 100 |
| ❓ | `Question Mark (Help, FAQ, Ask, Unknown, Doubt, Query, Huh, Support)` | Help and FAQ |
| ©️ | `Copyright (License, Rights, Intellectual Property, Legal, Author, All Rights Reserved, Copyleft, DMCA)` | License, rights, and authorship |
| ℹ️ | `Information (Info, About, Details, Help, Notice, Reference, Info Desk, Read Me)` | About and info |

```js
// COMMON_EMOJIS — new key, between "Sports" and "Tech & Development"
"Symbols & Signs": [
    '♻️', '♾️', '💯', '❓', '©️', 'ℹ️'
],

// EMOJI_NAMES
'♻️': 'Recycling Symbol (Eco, Reuse, Sustainability, Green, Environment, Waste, Recycle Bin, Conservation)',
'♾️': 'Infinity (Endless, Limitless, Forever, Loop, Math, Boundless, Infinite, Eternity)',
'💯': 'Hundred Points (Perfect, Score, 100, Excellent, Full Marks, Ace, One Hundred, A+)',
'❓': 'Question Mark (Help, FAQ, Ask, Unknown, Doubt, Query, Huh, Support)',
'©️': 'Copyright (License, Rights, Intellectual Property, Legal, Author, All Rights Reserved, Copyleft, DMCA)',
'ℹ️': 'Information (Info, About, Details, Help, Notice, Reference, Info Desk, Read Me)',
```

### Tech & Development

**31** now, **+4**, **35** after.

Fox, octopus, and whale already live here as product mascots. Crab joins them for Rust and Cargo. Wireless is the Wi-Fi glyph; antenna bars already match the word WiFi, and this is the icon for the link. Battery and low battery are the charge pair. Low battery is Unicode 14.0 and wireless is Unicode 15.0, the same band as the melting face, the jar, the goose, and the moose already in the catalog.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🦀 | `Crab (Rust, Cargo, Programming Language, Code, Development, Claws, Shellfish, Crustacean)` | Rust and Cargo |
| 🛜 | `Wireless (Wi-Fi, WiFi, Network, Internet, Signal, Router, WLAN, Hotspot)` | The wireless glyph for a network link |
| 🔋 | `Battery (Power, Charge, Energy, Full, Device, Charged, Power Level, Cells)` | Charge and power level |
| 🪫 | `Low Battery (Drain, Empty, Recharge, Low Power, Dying, Depleted, Charge Me, Battery Low)` | Empty battery and recharge |

```js
// COMMON_EMOJIS["Tech & Development"] — append
'🦀', '🛜', '🔋', '🪫'

// EMOJI_NAMES
'🦀': 'Crab (Rust, Cargo, Programming Language, Code, Development, Claws, Shellfish, Crustacean)',
'🛜': 'Wireless (Wi-Fi, WiFi, Network, Internet, Signal, Router, WLAN, Hotspot)',
'🔋': 'Battery (Power, Charge, Energy, Full, Device, Charged, Power Level, Cells)',
'🪫': 'Low Battery (Drain, Empty, Recharge, Low Power, Dying, Depleted, Charge Me, Battery Low)',
```

### Tools & Objects

**25** now, **+2**, **27** after.

Hammer, axe, screwdriver, toolbox, and the wrench in Tech cover the workshop. Scissors and flashlight are the everyday gaps.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| ✂️ | `Scissors (Cut, Snip, Craft, Trim, Paper, Shears, Clip, Stationery)` | Cut, craft, and paper |
| 🔦 | `Flashlight (Torch, Light, Beam, Dark, Flash, Handheld, Spotlight, Headlamp)` | Torch and a handheld beam |

```js
// COMMON_EMOJIS["Tools & Objects"] — append
'✂️', '🔦'

// EMOJI_NAMES
'✂️': 'Scissors (Cut, Snip, Craft, Trim, Paper, Shears, Clip, Stationery)',
'🔦': 'Flashlight (Torch, Light, Beam, Dark, Flash, Handheld, Spotlight, Headlamp)',
```

### Travel & Transportation

**29** now, **+3**, **32** after.

Planes, cars, trains, and ships are already well covered, which is why a steam locomotive stayed off this list. Compass, fuel, and ambulance are the practical gaps. A fire engine is in the alternates beside the ambulance.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🧭 | `Compass (Navigation, Direction, North, Explore, Orienteering, Bearing, Navigate, Compass Rose)` | Navigation and which way |
| ⛽ | `Fuel Pump (Gas, Gasoline, Petrol, Diesel, Gas Station, Refuel, Fill Up, Pump)` | Gas station and fuel |
| 🚑 | `Ambulance (Emergency, Medical, Siren, Rescue, Hospital, EMS, Paramedic, First Response)` | Emergency medical transport |

```js
// COMMON_EMOJIS["Travel & Transportation"] — append
'🧭', '⛽', '🚑'

// EMOJI_NAMES
'🧭': 'Compass (Navigation, Direction, North, Explore, Orienteering, Bearing, Navigate, Compass Rose)',
'⛽': 'Fuel Pump (Gas, Gasoline, Petrol, Diesel, Gas Station, Refuel, Fill Up, Pump)',
'🚑': 'Ambulance (Emergency, Medical, Siren, Rescue, Hospital, EMS, Paramedic, First Response)',
```

### Weather

**15** now, **+3**, **18** after.

Rain clouds, snow, and the thermometer are already here. Rainbow, umbrella, and tornado were missing. Tornado carries Cyclone and Hurricane in the keywords so those searches land on one severe-storm glyph.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🌈 | `Rainbow (Colorful, Pride, LGBTQ, Hope, Sky, Arc, Spectrum, After Rain)` | Color, pride, and hope |
| ☂️ | `Umbrella (Rain, Cover, Shade, Weather, Parasol, Dry, Rainy Day, Storm)` | Rain cover |
| 🌪️ | `Tornado (Twister, Storm, Cyclone, Wind, Funnel, Severe, Hurricane, Waterspout)` | Twister, with cyclone and hurricane in the keywords |

```js
// COMMON_EMOJIS["Weather"] — append
'🌈', '☂️', '🌪️'

// EMOJI_NAMES
'🌈': 'Rainbow (Colorful, Pride, LGBTQ, Hope, Sky, Arc, Spectrum, After Rain)',
'☂️': 'Umbrella (Rain, Cover, Shade, Weather, Parasol, Dry, Rainy Day, Storm)',
'🌪️': 'Tornado (Twister, Storm, Cyclone, Wind, Funnel, Severe, Hurricane, Waterspout)',
```

### Work & Productivity

**42** now, **+3**, **45** after.

The office set is already deep: briefcase, charts, calendar, trays, bell. Printer, necktie, and the slashed bell (mute, the pair to the bell) were the gaps.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| 🖨️ | `Printer (Document, Paper, Office, Inkjet, Hardware, Hard Copy, Laser Printer, Printout)` | Hard copy and office print |
| 👔 | `Necktie (Business, Formal, Suit, Professional, Corporate, Dress Code, Interview, White Collar)` | Formal work and dress code |
| 🔕 | `Bell with Slash (Mute, Silent, Notifications Off, Quiet, Do Not Disturb, DND, No Bell, Silence)` | Mute and do not disturb |

```js
// COMMON_EMOJIS["Work & Productivity"] — append
'🖨️', '👔', '🔕'

// EMOJI_NAMES
'🖨️': 'Printer (Document, Paper, Office, Inkjet, Hardware, Hard Copy, Laser Printer, Printout)',
'👔': 'Necktie (Business, Formal, Suit, Professional, Corporate, Dress Code, Interview, White Collar)',
'🔕': 'Bell with Slash (Mute, Silent, Notifications Off, Quiet, Do Not Disturb, DND, No Bell, Silence)',
```

### Zodiac

**12** now, **+1**, **13** after.

The twelve signs are complete and stay in Aries-to-Pisces order. Ophiuchus appends after Pisces. It is the thirteenth sign. The keywords use serpent bearer and skip the word snake, so a snake search stays on the animal glyph that carries Python.

| Emoji | `EMOJI_NAMES` | Why this one |
| --- | --- | --- |
| ⛎ | `Ophiuchus (Serpent Bearer, Zodiac, Astrology, Thirteenth Sign, Constellation, 13th Sign, Horoscope, Star Sign)` | The thirteenth sign, appended after Pisces |

```js
// COMMON_EMOJIS["Zodiac"] — append after Pisces
'⛎'

// EMOJI_NAMES
'⛎': 'Ophiuchus (Serpent Bearer, Zodiac, Astrology, Thirteenth Sign, Constellation, 13th Sign, Horoscope, Star Sign)',
```

## Alternates

These 12 are ready in the same format and are **not** part of the 75. They are the closest swaps if a category above should shift.

| Emoji | Category | `EMOJI_NAMES` | Use it if |
| --- | --- | --- | --- |
| ☄️ | Celestial | `Comet (Space, Astronomy, Tail, Meteor, Night, Fast, Halley, Ice Ball)` | A third celestial glyph, distinct from the shooting star |
| 💭 | Communication | `Thought Balloon (Think, Idea, Daydream, Consider, Bubble, Wonder, Brainstorm, Inner Voice)` | Ideas and daydreams. The lightbulb already means the bright idea |
| 🚒 | Travel & Transportation | `Fire Engine (Firetruck, Firefighter, Emergency, Rescue, Siren, Fire, Engine, Ladder Truck)` | The pair to the ambulance |
| 🕍 | Religious & Spiritual | `Synagogue (Judaism, Jewish, Worship, Temple, Shul, Building, Congregation, Shabbat)` | Jewish place of worship |
| 🕎 | Religious & Spiritual | `Menorah (Hanukkah, Judaism, Jewish, Candles, Holiday, Festival, Chanukah, Lights)` | Hanukkah, with both spellings |
| 🕋 | Religious & Spiritual | `Kaaba (Islam, Mecca, Hajj, Muslim, Pilgrimage, Sacred, Umrah, Qibla)` | Mecca and the pilgrimage |
| 🦌 | Parks | `Deer (Buck, Forest, Wildlife, Antlers, Nature, Gentle, Doe, Stag)` | Outdoor swap if the castle should leave Parks |
| 🛶 | Parks | `Canoe (Paddle, Boat, Lake, River, Camping, Outdoor, Canoeing, Portage)` | Outdoor swap if the Statue of Liberty should leave Parks |
| 🧲 | Tech & Development | `Magnet (Attract, Magnetic, Pull, Physics, Science, Fridge, Magnetism, Snap)` | Swap for wireless if a Unicode 15 glyph is too new |
| 🎙️ | Media & Entertainment | `Studio Microphone (Podcast, Broadcast, Record, Studio, Voice, Interview, Mic, On Air)` | Split podcasts off the handheld microphone |
| 💸 | Finance & Money | `Money with Wings (Spend, Expense, Cost, Payment, Flying Cash, Outflow, Burn Rate, Loss)` | Spending and burn rate |
| 📻 | Media & Entertainment | `Radio (Broadcast, FM, Listen, Music, Station, Audio, AM, Tuner)` | Broadcast radio |

```js
// Alternates — not in the 75
'☄️': 'Comet (Space, Astronomy, Tail, Meteor, Night, Fast, Halley, Ice Ball)', // Celestial
'💭': 'Thought Balloon (Think, Idea, Daydream, Consider, Bubble, Wonder, Brainstorm, Inner Voice)', // Communication
'🚒': 'Fire Engine (Firetruck, Firefighter, Emergency, Rescue, Siren, Fire, Engine, Ladder Truck)', // Travel & Transportation
'🕍': 'Synagogue (Judaism, Jewish, Worship, Temple, Shul, Building, Congregation, Shabbat)', // Religious & Spiritual
'🕎': 'Menorah (Hanukkah, Judaism, Jewish, Candles, Holiday, Festival, Chanukah, Lights)', // Religious & Spiritual
'🕋': 'Kaaba (Islam, Mecca, Hajj, Muslim, Pilgrimage, Sacred, Umrah, Qibla)', // Religious & Spiritual
'🦌': 'Deer (Buck, Forest, Wildlife, Antlers, Nature, Gentle, Doe, Stag)', // Parks
'🛶': 'Canoe (Paddle, Boat, Lake, River, Camping, Outdoor, Canoeing, Portage)', // Parks
'🧲': 'Magnet (Attract, Magnetic, Pull, Physics, Science, Fridge, Magnetism, Snap)', // Tech & Development
'🎙️': 'Studio Microphone (Podcast, Broadcast, Record, Studio, Voice, Interview, Mic, On Air)', // Media & Entertainment
'💸': 'Money with Wings (Spend, Expense, Cost, Payment, Flying Cash, Outflow, Burn Rate, Loss)', // Finance & Money
'📻': 'Radio (Broadcast, FM, Listen, Music, Station, Audio, AM, Tuner)', // Media & Entertainment
```

## Left out on purpose

A few familiar glyphs stayed off the list because search already hits a glyph that is in the catalog:

| Glyph | Search already hits |
| --- | --- |
| 🌙 crescent moon | 🌛, 🌜, and 🌝, all described as moons |
| 🚂 locomotive | 🚄 High-Speed Train and 🚇 Metro, both described with Train |
| 📞 telephone receiver | ☎️ Telephone and 📱 Mobile Phone |
| 🖊️ pen | ✍️ Writing Hand, which already lists Pen |
| 📕 📗 📘 colored books | 📖 Book and 📚 Books |
| 👽 alien | 👾 Alien in Gaming & Retro |

Skin-tone variants and gender pairs were skipped. Where the catalog already has one gender or a neutral person, this list does not add the other.

## Check

Checked against `js/config.js` when this note was written:

- 75 proposed glyphs, 0 overlaps with `COMMON_EMOJIS` or `EMOJI_NAMES`, including a compare that ignores variation selectors.
- 12 alternates, also absent from both maps, and absent from the 75.
- Every descriptor matches `Name (Keyword, Keyword, …)`.
- Descriptor length runs from 57 to 110 characters (the picker spec prefers about 30–150).
- `Symbols & Signs` has 6 glyphs. `Parks` would have 7.
- No proposed glyph is a ZWJ sequence.
