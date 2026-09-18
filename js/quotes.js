// Daily quotes via LinkedList + day-of-year index

function Node(value) {
  this.value = value;
  this.next = null;
}

function LinkedList() {
  this.head = null;
  this.size = 0;
}

LinkedList.prototype.add = function(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    console.warn('LinkedList.add() only accepts non-empty string values');
    return;
  }

  const newNode = new Node(value);

  if (!this.head) {
    this.head = newNode;
  } else {
    let current = this.head;
    while (current.next) {
      current = current.next;
    }
    current.next = newNode;
  }
  this.size++;
};

LinkedList.prototype.get = function(index) {
  if (index < 0 || index >= this.size || !this.head) {
    return null;
  }

  let current = this.head;
  for (let i = 0; i < index; i++) {
    if (current) {
      current = current.next;
    }
  }
  return current ? current.value : null;
};

function getDayOfYear() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay) + 1;
  return day;
}

function initQuotes() {
  if (window.dailyQuotes && window.dailyQuotes.size > 0) {
    return;
  }

  const quotesList = new LinkedList();

  const quotes = [
  "“Genius is eternal patience.” — Michelangelo",
  "“No great thing is created suddenly.” — Epictetus",
  "“The reward of the young scientist is the emotional thrill of being the first person in the history of the world to see something or to understand something.” — Cecilia Payne-Gaposchkin",
  "“The most courageous act is still to think for yourself. Aloud.” — Coco Chanel",
  "“Those who have a 'why' to live, can bear with almost any 'how'.” — Viktor E. Frankl",
  "“Setting goals is the first step in turning the invisible into the visible.” — Tony Robbins",
  "“The key to immortality is first living a life worth remembering.” — Bruce Lee",
  "“Great minds discuss ideas; average minds discuss events; small minds discuss people.” — Eleanor Roosevelt",
  "“The way to get started is to quit talking and begin doing.” — Walt Disney",
  "“Doubt is not a pleasant condition, but certainty is absurd.” — Voltaire",
  "“Strength does not come from physical capacity. It comes from an indomitable will.” — Mahatma Gandhi",
  "“Anyone who has never made a mistake has never tried anything new.” — Albert Einstein",
  "“To be, or not to be, that is the question.” — William Shakespeare",
  "“Whatever you are, be a good one.” — Abraham Lincoln",
  "“The greatest wealth is to live content with little.” — Plato",
  "“Wisdom equals knowledge plus courage. You have to not only know what to do and when to do it, but you have to also be brave enough to follow through.” — Jarod Kintz",
  "“To keep the body in good health is a duty… otherwise we shall not be able to keep our mind strong and clear.” — Buddha",
  "“A leader takes people where they want to go. A great leader takes people where they don’t necessarily want to go but ought to be.” — Rosalynn Carter",
  "“The only people with whom you should try to get even are those who have helped you.” — John E. Southard",
  "“Do what you can, with what you have, where you are.” — Theodore Roosevelt",
  "“There’s no way around hard work. Embrace it. You have to put in the hours because there is always something you can improve on.” — Inspirational quote",
  "“I am grateful for all my victories, but I am especially grateful for my losses, because they only made me work harder.” — Muhammad Ali",
  "“Stay hungry, stay foolish.” — Steve Jobs",
  "“The only person you are destined to become is the person you decide to be.” — Ralph Waldo Emerson",
  "“We are all of us stars, and we deserve to twinkle.” — Marilyn Monroe",
  "“Winners never quit, and quitters never win.” — Vince Lombardi",
  "“Knowing is not enough; we must apply. Willing is not enough; we must do.” — Bruce Lee",
  "“Whenever you see a successful business, someone once made a courageous decision.” — Peter F. Drucker",
  "“The only way to do great work is to love what you do.” — Steve Jobs",
  "“Love all, trust a few, do wrong to none.” — William Shakespeare",
  "“Fear is stupid. So are regrets.” — Marilyn Monroe",
  "“The successful warrior is the average man, with laser-like focus.” — Bruce Lee",
  "“If not us, who? If not now, when?” — John F. Kennedy",
  "“Obstacles don’t have to stop you. If you run into a wall, don’t turn around and give up. Figure out how to climb it, go through it, or work around it.” — Michael Jordan",
  "“Hope is a waking dream.” — Aristotle",
  "“Science is not only a disciple of reason but also one of romance and passion.” — Stephen Hawking",
  "“Remember, teamwork begins by building trust. And the only way to do that is to overcome our need for invulnerability.” — Patrick Lencioni",
  "“Not all those who wander are lost.” — J.R.R. Tolkien",
  "“When you believe in a thing, believe in it all the way, implicitly and unquestionable.” — Walt Disney",
  "“Do what you have always done and you’ll get what you have always got.” — Sue Knight",
  "“Three things cannot be long hidden: the sun, the moon, and the truth.” — Buddha",
  "“A good plan violently executed now is better than a perfect plan executed next week.” — George S. Patton",
  "“A good leader is a person who takes a little more than his share of the blame and a little less than his share of the credit.” — John C. Maxwell",
  "“I cannot give you a formula for success, but I can give you the formula for failure, which is: Try to please everybody.” — Herbert Bayard Swope",
  "“Too often we enjoy the comfort of opinion without the discomfort of thought.” — John F. Kennedy",
  "“I think, therefore I am.” — René Descartes",
  "“People buy into the leader before they buy into the vision.” — John C. Maxwell",
  "“The only real failure in life is not to be true to the best one knows.” — Buddha",
  "“You’ll never find a rainbow if you’re looking down.” — Charlie Chaplin",
  "“Power is not given to you. You have to take it.” — Beyoncé",
  "“Winning is not a sometime thing; it’s an all the time thing.” — Vince Lombardi",
  "“I hated every minute of training, but I said, ‘Don’t quit. Suffer now and live the rest of your life as a champion.’” — Muhammad Ali",
  "“Happiness is when what you think, what you say, and what you do are in harmony.” — Mahatma Gandhi",
  "“Everybody is a genius. But if you judge a fish by its ability to climb a tree, it will live its whole life believing it is stupid.” — Albert Einstein",
  "“By failing to prepare, you are preparing to fail.” — Benjamin Franklin",
  "“Have no fear of perfection, you’ll never reach it.” — Salvador Dalí",
  "“Many of life’s failures are people who did not realize how close they were to success when they gave up.” — Thomas A. Edison",
  "“Believe you can and you’re halfway there.” — Theodore Roosevelt",
  "“The future starts today, not tomorrow.” — Pope John Paul II",
  "“The whole is greater than the sum of its parts.” — Aristotle",
  "“Low self-confidence isn’t a life sentence. Self-confidence can be learned, practiced, and mastered—just like any other skill.” — Barrie Davenport",
  "“There is more to life than increasing its speed.” — Mahatma Gandhi",
  "“Simplicity is the ultimate sophistication.” — Leonardo da Vinci",
  "“It is not in the stars to hold our destiny but in ourselves.” — William Shakespeare",
  "“Better to build a bridge than a wall.” — Elton John",
  "“Family is the most important thing in the world.” — Princess Diana",
  "“The people who are crazy enough to think they can change the world are the ones who do.” — Steve Jobs",
  "“There is a difference between being a leader and being a boss. Both are based on authority. A boss demands blind obedience; a leader earns his authority through understanding and trust.” — Klaus Balkenhol",
  "“Champions keep playing until they get it right.” — Billie Jean King",
  "“Education is the most powerful weapon which you can use to change the world.” — Nelson Mandela",
  "“If you really want the key to success, start by doing the opposite of what everyone else is doing.” — Brad Szollose",
  "“Don’t blow off another’s candle for it won’t make yours shine brighter.” — Jaachynma N.E. Agu",
  "“Our greatest glory is not in never falling, but in rising every time we fall.” — Confucius",
  "“The happiness of your life depends upon the quality of your thoughts.” — Marcus Aurelius",
  "“That’s one small step for a man, one giant leap for mankind.” — Neil Armstrong",
  "“A leader is a dealer in hope.” — Napoleon Bonaparte",
  "“Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.” — Marcus Aurelius",
  "“Rarely have I seen a situation where doing less than the other guy is a good strategy.” — Jimmy Spithill",
  "“Make sure your worst enemy doesn’t live between your own two ears.” — Laird Hamilton",
  "“In a moment of decision, the best thing you can do is the right thing to do, the next best thing is the wrong thing, and the worst thing you can do is nothing.” — Theodore Roosevelt",
  "“Science without religion is lame, religion without science is blind.” — Albert Einstein",
  "“I have no special talent. I am only passionately curious.” — Albert Einstein",
  "“Turn your wounds into wisdom.” — Oprah Winfrey",
  "“Be yourself; everyone else is already taken.” — Oscar Wilde",
  "“The time is always right to do what is right.” — Martin Luther King Jr.",
  "“I am among those who think that science has great beauty.” — Marie Curie",
  "“Success is not final, failure is not fatal: it is the courage to continue that counts.” — Winston Churchill",
  "Discipline is the bridge between goals and accomplishment. — Jim Rohn",
  "“If a cluttered desk is a sign of a cluttered mind, of what, then, is an empty desk a sign?” — Albert Einstein",
  "“I would like to die on Mars. Just not on impact.” — Elon Musk",
  "“The weak can never forgive. Forgiveness is the attribute of the strong.” — Mahatma Gandhi",
  "“A man who stands for nothing will fall for anything.” — Malcolm X",
  "What you do today can improve all your tomorrows. — Ralph Marston",
  "“I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.” — Bruce Lee",
  "“Consensus: the process of abandoning all beliefs, principles, values, and policies in search of something in which no one believes, but to which no one objects.” — Margaret Thatcher",
  "“You wouldn’t worry so much about what others think of you if you realized how seldom they do.” — Eleanor Roosevelt",
  "“I love to compete. That’s the essence of who I am.” — Tiger Woods",
  "The secret of your future is hidden in your daily routine. — Mike Murdock",
  "“The journey of a thousand miles begins with one step.” — Lao Tzu",
  "“The art of leadership is saying no, not yes. It is very easy to say yes.” — Tony Blair",
  "“A fool thinks himself to be wise, but a wise man knows himself to be a fool.” — William Shakespeare",
  "“Genius is one percent inspiration, ninety-nine percent perspiration.” — Thomas A. Edison",
  "“It does not matter how slowly you go so long as you do not stop.” — Confucius",
  "“An eye for an eye will only make the whole world blind.” — Mahatma Gandhi",
  "“The two most important days in your life are the day you are born and the day you find out why.” — Mark Twain",
  "“The good thing about science is that it's true whether or not you believe in it.” — Neil deGrasse Tyson",
  "“Well done is better than well said.” — Benjamin Franklin",
  "“If you judge people, you have no time to love them.” — Mother Teresa",
  "“You are what you repeatedly do. Excellence, then, is not an act, but a habit.” — Aristotle",
  "“Whatever the mind of man can conceive and believe, it can achieve.” — Napoleon Hill",
  "“Be proud of who you are.” — Eminem",
  "“Average leaders raise the bar on themselves; good leaders raise the bar for others; great leaders inspire others to raise their own bar.” — Orrin Woodward",
  "“The battles that count aren’t the ones for gold medals. The struggles within yourself—the invisible, inevitable battles inside all of us—that’s where it’s at.” — Muhammad Ali",
  "“No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.” — Buddha",
  "Small daily improvements are the key to staggering long-term results. — Robin Sharma",
  "“Stumbling is not falling.” — Malcolm X",
  "“You can do anything, but not everything.” — Focus quote",
  "“If you don’t like something, change it. If you can’t change it, change your attitude.” — Maya Angelou",
  "“In any moment of decision, the best thing you can do is the right thing, the next best thing is the wrong thing, and the worst thing you can do is nothing.” — Theodore Roosevelt",
  "“Knowing yourself is the beginning of all wisdom.” — Aristotle",
  "“Research is to see what everybody else has seen, and to think what nobody else has thought.” — Albert Szent-Györgyi",
  "Push yourself, because no one else is going to do it for you.",
  "“All human actions have one or more of these seven causes: chance, nature, compulsion, habit, reason, passion, and desire.” — Aristotle",
  "“Don’t get bitter, get better.” — Tiger Woods",
  "“Real knowledge is to know the extent of one’s ignorance.” — Confucius",
  "“Champions aren’t made in the gyms. Champions are made from something they have deep inside them—a desire, a dream, a vision.” — Muhammad Ali",
  "“The best motivation always comes from within.” — Michael Johnson",
  "“Those who say it can’t be done are usually interrupted by others doing it.” — James Baldwin",
  "“Little by little, one travels far.” — J.R.R. Tolkien",
  "“I learned this, at least, by my experiment; that if one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.” — Henry David Thoreau",
  "“The future belongs to those who prepare for it today.” — Malcolm X",
  "“Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.” — Motivational quote",
  "“You may not control all the events that happen to you, but you can decide not to be reduced by them.” — Maya Angelou",
  "“What you are is what you have been. What you will be is what you do now.” — Buddha",
  "“You get in life what you have the courage to ask for.” — Nancy D. Solomon",
  "“The true sign of intelligence is not knowledge but imagination.” — Albert Einstein",
  "“Life is about making an impact, not making an income.” — Kevin Kruse",
  "“Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.” — Helen Keller",
  "“The only impossible journey is the one you never begin.” — Tony Robbins",
  "“Action expresses priorities.” — Mahatma Gandhi",
  "“It does not matter how slowly you go as long as you do not stop.” — Confucius",
  "“Freedom is not worth having if it does not include the freedom to make mistakes.” — Mahatma Gandhi",
  "“There is no path to happiness. Happiness is the path.” — Buddha",
  "“The roots of education are bitter, but the fruit is sweet.” — Aristotle",
  "“It’s fun to do the impossible.” — Walt Disney",
  "“Happiness is not something ready made. It comes from your own actions.” — Dalai Lama",
  "“It’s not what happens to you, but how you react to it that matters.” — Epictetus",
  "“We cannot solve problems with the same thinking we used to create them.” — Albert Einstein",
  "“The important thing is not being afraid to take a chance. Remember, the greatest failure is to not try.” — Leadership quote",
  "“The longest journey begins with a single step.” — Patanjali",
  "“I don’t think of all the misery but of the beauty that still remains.” — Anne Frank",
  "“No one can make you feel inferior without your consent.” — Eleanor Roosevelt",
  "“The energy of the mind is the essence of life.” — Aristotle",
  "“Somewhere, something incredible is waiting to be known.” — Carl Sagan",
  "“Your work is to discover your work and then with all your heart to give yourself to it.” — Buddha",
  "“Do it or not. There is no try.” — Yoda",
  "“Peace begins with a smile.” — Mother Teresa",
  "Great things never come from comfort zones.",
  "“That which does not kill us makes us stronger.” — Friedrich Nietzsche",
  "“Character cannot be developed in ease and quiet. Only through experience of trial and suffering can the soul be strengthened, ambition inspired, and success achieved.” — Helen Keller",
  "“The chief task in life is simply this: to identify and separate matters so that I can say clearly to myself which are externals not under my control, and which have to do with the choices I actually control.” — Epictetus",
  "“Don’t limit yourself. Many people limit themselves to what they think they can do.” — (Motivational business wisdom)",
  "“The unexamined life is not worth living.” — Socrates",
  "“When kids look up to great scientists the way they do musicians, actors and sports figures, civilization will jump to the next level.” — Brian Greene",
  "“Take up one idea. Make that one idea your life—think of it, dream of it, live on that idea.” — Swami Vivekananda",
  "“We don’t want to tell our dreams. We want to show them.” — Cristiano Ronaldo",
  "“Anyone who doesn’t take truth seriously in small matters cannot be trusted in large ones either.” — Albert Einstein",
  "Dream it. Wish it. Do it.",
  "Success doesn’t just find you. You have to go out and get it.",
  "“Men are disturbed not by things, but by the views which they take of them.” — Epictetus",
  "“The mind is everything. What you think you become.” — Buddha",
  "“Show me the man you honor and I will know what kind of man you are.” — Thomas John Carlisle",
  "“Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.” — Aristotle",
  "“Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else; you are the one who gets burned.” — Buddha",
  "“If you are not willing to risk the usual, you will have to settle for the ordinary.” — Jim Rohn",
  "“Your most unhappy customers are your greatest source of learning.” — Bill Gates",
  "“Focus on the journey, not the destination. Joy is found not in finishing an activity but in doing it.” — Greg Anderson",
  "“Opportunity is missed by most people because it is dressed in overalls and looks like work.” — Thomas A. Edison",
  "“The secret of success is to do the common thing uncommonly well.” — Business principle",
  "“Peace comes from within. Do not seek it without.” — Buddha",
  "“We are what we repeatedly do. Excellence, then, is not an act, but a habit.” — Aristotle",
  "“Live as if you were to die tomorrow. Learn as if you were to live forever.” — Mahatma Gandhi",
  "“Kindness is the language which the deaf can hear and the blind can see.” — Mark Twain",
  "“It’s not whether you get knocked down, it’s whether you get up.” — Vince Lombardi",
  "“The best revenge is to be unlike him who performed the injury.” — Marcus Aurelius",
  "“Quality is not an act; it is a habit.” — Aristotle",
  "“Be kind whenever possible. It is always possible.” — Dalai Lama",
  "The harder you work for something, the greater you’ll feel when you achieve it.",
  "“Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.” — Buddha",
  "“The only thing that interferes with my learning is my education.” — Albert Einstein",
  "“Everything is theoretically impossible, until it is done.” — Robert A. Heinlein",
  "“There is nothing so useless as doing efficiently that which should not be done at all.” — Peter F. Drucker",
  "“You must be the change you wish to see in the world.” — Mahatma Gandhi",
  "“Don’t be afraid to give up the good to go for the great.” — John D. Rockefeller",
  "“Above all, don't fear difficult moments. The best comes from them.” — Rita Levi-Montalcini",
  "“It is in your moments of decision that your destiny is shaped.” — Tony Robbins",
  "“I don’t care that they stole my idea… I care that they don’t have any of their own.” — Nikola Tesla",
  "“Gold medals aren’t really made of gold. They’re made of sweat, determination, and a hard-to-find alloy called guts.” — Dan Gable",
  "“Give me six hours to chop down a tree and I will spend the first four sharpening the axe.” — Abraham Lincoln",
  "“I find that the harder I work, the more luck I seem to have.” — Common success wisdom",
  "Dream bigger. Do bigger.",
  "“You have power over your mind — not outside events. Realize this, and you will find strength.” — Marcus Aurelius",
  "“Feeling gratitude and not expressing it is like wrapping a present and not giving it.” — William Arthur Ward",
  "“A goal is not always meant to be reached; it often serves simply as something to aim at.” — Bruce Lee",
  "“Two roads diverged in a wood, and I—I took the one less traveled by, And that has made all the difference.” — Robert Frost",
  "“A journey of a thousand miles must begin with a single step.” — Lao Tzu",
  "“I’ve failed over and over and over again in my life and that is why I succeed.” — Michael Jordan",
  "“If you can’t convince them, confuse them.” — Harry S. Truman",
  "Don’t stop when you’re tired. Stop when you’re done.",
  "“Drop by drop is the water pot filled. Likewise, the wise man, gathering it little by little, fills himself with good.” — Buddha",
  "“We become just by performing just actions, temperate by performing temperate actions, brave by performing brave actions.” — Aristotle",
  "“If you think you can do a thing or think you can’t do a thing, you’re right.” — Henry Ford",
  "“In a gentle way, you can shake the world.” — Mahatma Gandhi",
  "“If you spend too much time thinking about a thing, you’ll never get it done.” — Bruce Lee",
  "“I came, I saw, I conquered.” — Julius Caesar",
  "“It is not the strongest of the species that survive, nor the most intelligent, but the one most responsive to change.” — Charles Darwin",
  "“Logic will get you from A to B. Imagination will take you everywhere.” — Albert Einstein",
  "“Adapt what is useful, reject what is useless, and add what is specifically your own.” — Bruce Lee",
  "“Try not to become a person of success, but rather try to become a person of value.” — Albert Einstein",
  "“I have learned over the years that when one’s mind is made up, this diminishes fear; knowing what must be done does away with fear.” — Rosa Parks",
  "“You miss 100 percent of the shots you never take.” — Wayne Gretzky",
  "“Shyness has a strange element of narcissism, a belief that how we look, how we perform, is truly important to other people.” — Andre Dubus",
  "“I have a dream that one day little black boys and girls will be holding hands with little white boys and girls.” — Martin Luther King Jr.",
  "“Courage is resistance to fear, mastery of fear — not absence of fear.” — Mark Twain",
  "“The question isn’t who is going to let me; it’s who is going to stop me.” — Ayn Rand",
  "“Silent gratitude isn’t very much to anyone.” — Gertrude Stein",
  "“Between stimulus and response there is a space. In that space is our power to choose our response. In our response lies our growth and our freedom.” — Viktor E. Frankl",
  "“Wealth consists not in having great possessions, but in having few wants.” — Epictetus",
  "“We need fantasy to survive reality.” — Lady Gaga",
  "Wake up with determination. Go to bed with satisfaction.",
  "“May your choices reflect your hopes, not your fears.” — Nelson Mandela",
  "“As rain falls equally on the just and the unjust, do not burden your heart with judgments but rain your kindness equally on all.” — Buddha",
  "“The more we value things outside our control, the less control we have.” — Epictetus",
  "“The path to success is to take massive, determined action.” — Tony Robbins",
  "“The only limit to our realization of tomorrow will be our doubts of today.” — Franklin D. Roosevelt",
  "“Early to bed and early to rise makes a man healthy, wealthy, and wise.” — Benjamin Franklin",
  "“I never did a day’s work in my life. It was all fun.” — Thomas A. Edison",
  "“Always bear in mind that your own resolution to success is more important than any other one thing.” — Abraham Lincoln",
  "“Twenty years from now you will be more disappointed by the things that you didn’t do than by the ones you did do.” — Mark Twain",
  "“A winner is a dreamer who never gives up.” — Nelson Mandela",
  "“If you want to build a ship, don’t drum up the men to gather wood, divide the work, and give orders. Instead, teach them to yearn for the vast and endless sea.” — Antoine de Saint-Exupéry",
  "“Wise men talk because they have something to say; fools, because they have to say something.” — Plato",
  "Little things make big days.",
  "“The best way to predict your future is to create it.” — Abraham Lincoln",
  "“A man always has two reasons for doing anything: a good reason and the real reason.” — J.P. Morgan",
  "“The impediment to action advances action. What stands in the way becomes the way.” — Marcus Aurelius",
  "“Strive not to be a success, but rather to be of value.” — Albert Einstein",
  "“Twenty years from now, you will be more disappointed by the things that you didn’t do than by the ones you did do. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sails. Explore. Dream. Discover.” — Mark Twain",
  "“First say to yourself what you would be; and then do what you have to do.” — Epictetus",
  "“Success is walking from failure to failure with no loss of enthusiasm.” — Winston Churchill",
  "It’s going to be hard, but hard does not mean impossible.",
  "“The best thing about the future is that it comes one day at a time.” — Abraham Lincoln",
  "“Keep calm and carry on.” — Winston Churchill",
  "“If I have seen further than others, it is by standing upon the shoulders of giants.” — Isaac Newton",
  "Don’t wait for opportunity. Create it.",
  "“If you want to have good ideas, you must have many ideas.” — Linus Pauling",
  "“The best revenge is massive success.” — Frank Sinatra",
  "“Every morning we are born again. What we do today is what matters most.” — Gautama Buddha",
  "“The universe is not required to be in perfect harmony with human ambition.” — Carl Sagan",
  "“The greatest leader is not necessarily the one who does the greatest things. He is the one that gets people to do the greatest things.” — Ronald Reagan",
  "“Nobody can hurt me without my permission.” — Mahatma Gandhi",
  "“Accept the things to which fate binds you, and love the people with whom fate brings you together, but do so with all your heart.” — Marcus Aurelius",
  "“All I was doing was trying to get home from work.” — Rosa Parks",
  "“Resilience is knowing that you are the only one that has the power and the responsibility to pick yourself up.” — Modern leadership",
  "“Happiness depends upon ourselves.” — Aristotle",
  "“It always seems impossible until it’s done.” — Nelson Mandela",
  "“You only lose what you cling to.” — Buddha",
  "“The root of suffering is attachment.” — Buddha",
  "“Be the change that you wish to see in the world.” — Mahatma Gandhi",
  "“The secret of health for both mind and body is not to mourn for the past, nor to worry about the future, but to live the present moment wisely and earnestly.” — Buddha",
  "“It isn’t the mountains ahead to climb that wear you out; it’s the pebble in your shoe.” — Muhammad Ali",
  "“I can accept failure, everyone fails at something. But I can’t accept not trying.” — Michael Jordan",
  "“Some people want it to happen, some wish it would happen, and others make it happen.” — Michael Jordan",
  "“I am a slow walker, but I never walk back.” — Abraham Lincoln",
  "“When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.” — Marcus Aurelius",
  "“Continuous improvement is better than delayed perfection.” — Mark Twain",
  "“When something is important enough, you do it even if the odds are not in your favor.” — Elon Musk",
  "“The trouble is, you think you have time.” — Buddha",
  "“Just as a candle cannot burn without fire, men cannot live without a spiritual life.” — Buddha",
  "“Keep your eyes open and try to catch people in your company doing something right, then praise them for it.” — Tom Hopkins",
  "Sometimes we’re tested not to show our weaknesses, but to discover our strengths.",
  "“Learn to value yourself, which means: to fight for your happiness.” — Ayn Rand",
  "“The future belongs to those who believe in the beauty of their dreams.” — Eleanor Roosevelt",
  "“I attribute my success to this: I never gave or took any excuse.” — Florence Nightingale",
  "The key to success is to focus on goals, not obstacles.",
  "“The soul becomes dyed with the color of its thoughts.” — Marcus Aurelius",
  "“Thousands of candles can be lighted from a single candle, and the life of the candle will not be shortened. Happiness never decreases by being shared.” — Buddha",
  "“Educating the mind without educating the heart is no education at all.” — Aristotle",
  "Dream it. Believe it. Build it.",
  "“A man is but the product of his thoughts. What he thinks, he becomes.” — Mahatma Gandhi",
  "“If you can’t explain it simply, you don’t understand it well enough.” — Albert Einstein",
  "“The more you know, the more you realize you don’t know.” — Aristotle",
  "The only person you are destined to become is the person you decide to be. — Ralph Waldo Emerson",
  "“You can’t connect the dots looking forward; you can only connect them looking backward. So you have to trust that the dots will somehow connect in your future.” — Steve Jobs",
  "“There is only one way to happiness and that is to cease worrying about things which are beyond the power of our will.” — Epictetus",
  "“I cannot trust a man to control others who cannot control himself.” — Robert E. Lee",
  "“The best way to find yourself is to lose yourself in the service of others.” — Mahatma Gandhi",
  "“Courage is resistance to fear, mastery of fear, not absence of fear.” — Mark Twain",
  "“Once you’ve accepted your flaws, no one can use them against you.” — George R.R. Martin",
  "“Science knows no country, because knowledge belongs to humanity, and is the torch which illuminates the world.” — Louis Pasteur",
  "“God helps those that help themselves.” — Benjamin Franklin",
  "“The only thing we have to fear is fear itself.” — Franklin D. Roosevelt",
  "Everything you’ve ever wanted is sitting on the other side of fear.",
  "“The secret of getting ahead is getting started.” — Mark Twain",
  "“The future depends on what you do today.” — Mahatma Gandhi",
  "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
  "“I’ve learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.” — Maya Angelou",
  "“Pleasure in the job puts perfection in the work.” — Aristotle",
  "“It is the mark of an educated mind to be able to entertain a thought without accepting it.” — Aristotle",
  "“There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is a miracle.” — Albert Einstein",
  "“In the end, it is important to remember that we cannot become what we need to be by remaining what we are.” — Max De Pree",
  "“What you learn from a life in science is the vastness of our ignorance.” — David Eagleman",
  "“Life is like riding a bicycle. To keep your balance, you must keep moving.” — Albert Einstein",
  "“Imagination will often carry us to worlds that never were. But without it we go nowhere.” — Carl Sagan",
  "“It’s not the will to win that matters—everyone has that. It’s the will to prepare to win that matters.” — Paul “Bear” Bryant",
  "“Believe nothing, no matter where you read it, or who said it, no matter if I have said it, unless it agrees with your own reason and your own common sense.” — Buddha",
  "“Courage is not the absence of fear, but the triumph over it.” — Nelson Mandela",
  "“Wisely, and slow. They stumble that run fast.” — William Shakespeare",
  "“To be idle is a short road to death and to be diligent is a way of life; foolish people are idle, wise people are diligent.” — Buddha",
  "“You may have to fight a battle more than once to win it.” — Margaret Thatcher",
  "“Whenever you find yourself on the side of the majority, it is time to pause and reflect.” — Mark Twain",
  "“You laugh at me because I’m different; I laugh at you because you’re all the same.” — Lady Gaga",
  "“If you love life, don’t waste time, for time is what life is made up of.” — Bruce Lee",
  "“Very little is needed to make a happy life; it is all within yourself, in your way of thinking.” — Marcus Aurelius",
  "“He who conquers himself is the mightiest warrior.” — Confucius",
  "“Leadership is the art of getting someone else to do something you want done because he wants to do it.” — Dwight D. Eisenhower",
  "“Take up one idea. Make that one idea your life—think of it, dream of it, live on that idea. Let the brain, muscles, nerves, every part of your body, be full of that idea, and just leave every other idea alone. This is the way to success.” — Swami Vivekananda",
  "“I have not failed. I’ve just found 10,000 ways that won’t work.” — Thomas A. Edison",
  "“There is nothing more dreadful than the habit of doubt. Doubt separates people. It is a poison that disintegrates friendships and breaks up pleasant relations. It is a thorn that irritates and hurts; it is a sword that kills.” — Buddha",
  "“Everything can be taken from a man but one thing: the last of the human freedoms — to choose one’s attitude in any given set of circumstances, to choose one’s own way.” — Viktor E. Frankl",
  "“If it is not right do not do it; if it is not true do not say it.” — Marcus Aurelius",
  "“We are just an advanced breed of monkeys on a minor planet of a very average star. But we can understand the Universe. That makes us something very special.” — Stephen Hawking",
  "“I am the greatest, I said that even before I knew I was.” — Muhammad Ali",
  "“The mediocre teacher tells. The good teacher explains. The superior teacher demonstrates. The great teacher inspires.” — William Arthur Ward",
  "Act as if what you do makes a difference. It does. — William James",
  "“Your time is limited, so don’t waste it living someone else’s life.” — Steve Jobs",
  "“Waste no more time arguing about what a good man should be. Be one.” — Marcus Aurelius",
  "“Although the world is full of suffering, it is also full of the overcoming of it.” — Helen Keller",
  "“The important thing is to never stop questioning.” — Albert Einstein",
  "“Quality is not an act, it is a habit.” — Aristotle",
  "“Success is the sum of small efforts, repeated day in and day out.” — Robert Collier",
  "“Nonviolence is a weapon of the strong.” — Mahatma Gandhi",
  "You are never too old to set another goal or to dream a new dream. — C.S. Lewis",
  "“Everything has beauty, but not everyone sees it.” — Confucius",
  "“Surround yourself with great people; delegate authority; get out of the way.” — Ronald Reagan",
  "“Innovation distinguishes between a leader and a follower.” — Steve Jobs",
  "“Those who dare to fail miserably can achieve greatly.” — John F. Kennedy",
  "“The aim of art is to represent not the outward appearance of things, but their inward significance.” — Aristotle",
  "“All that we are is the result of what we have thought.” — Buddha",
  "“Successful people do what unsuccessful people are not willing to do. Don’t wish it were easier; wish you were better.” — Jim Rohn",
  "“First they ignore you, then they laugh at you, then they fight you, then you win.” — Mahatma Gandhi",
  "“Management is doing things right; leadership is doing the right things.” — Peter F. Drucker",
  "“For small creatures such as we the vastness is bearable only through love.” — Carl Sagan",
  "“Do not judge me by my successes, judge me by how many times I fell down and got back up again.” — Nelson Mandela",
  "“Character may almost be called the most effective means of persuasion.” — Aristotle",
  "“Much of the stress that people feel doesn’t come from having too much to do. It comes from not finishing what they’ve started.” — David Allen",
  "“You never regret being kind.” — Nicole Shepherd",
  "“When you put together deep knowledge about a subject that intensely matters to you, charisma happens.” — Jerry Porras",
  "“True humility is not thinking less of yourself; it is thinking of yourself less.” — Leadership wisdom",
  "“The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and then starting on the first one.” — Mark Twain",
  "“Leadership is an action, not a position.” — Donald McGannon",
  "The best way to predict the future is to create it. — Abraham Lincoln",
  "“The man who does not read has no advantage over the man who cannot read.” — Mark Twain",
  "“If you spend your life trying to be good at everything, you will never be great at anything.” — Tom Rath",
  "“Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.” — Marie Curie",
  "“Do something worth remembering.” — Elvis Presley",  ];

  quotes.forEach(q => {
    if (q && q.trim().length > 0) {
      quotesList.add(q.trim());
    }
  });

  window.dailyQuotes = quotesList;
}

function displayDailyQuote() {
  const quoteEl = document.getElementById('daily-quote');
  if (!quoteEl) return;

  if (!window.dailyQuotes || window.dailyQuotes.size === 0) {
    quoteEl.textContent = '';
    return;
  }

  const day = getDayOfYear();
  const index = (day - 1) % window.dailyQuotes.size;
  const quote = window.dailyQuotes.get(index);

  if (quote) {
    quoteEl.textContent = quote;
    quoteEl.title = quote;
  } else {
    quoteEl.textContent = '';
  }
}

window.displayDailyQuote = displayDailyQuote;
initQuotes();
