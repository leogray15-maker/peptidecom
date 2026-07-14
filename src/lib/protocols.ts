// The Arcane Lab healing library — imported from Notion ("Arcane Lab" hub).
// Content is the member-facing healing/biohacking material, baked in at build
// time so it renders instantly with no runtime Notion dependency.
// FOR RESEARCH / EDUCATIONAL PURPOSES ONLY. Not medical advice.

export interface LibraryArticle {
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string; // lightweight markdown (see components/markdown.tsx)
}

export const LIBRARY_CATEGORIES = [
  "Biohacking Foundations",
  "Skin & Sun",
  "Gut & Microbiome",
  "Diet & Food",
  "Food Sourcing",
  "Products & Environment",
  "Rituals",
] as const;

export const LIBRARY_INTRO =
  "This is the healing wing of the Lab — the protocols for putting your body back together from the inside out. Cut the processed food, fix the gut, get the sun, ditch the endocrine disruptors. It compounds daily, with discipline. Peptides help — but only once the fundamentals below are in place.";

export const LIBRARY: LibraryArticle[] = [
  {
    slug: "your-vessel",
    title: "Your Vessel",
    category: "Biohacking Foundations",
    summary: "Your body is the one home you live in 24/7. Take care of the vessel before the house and the car.",
    body: `We all have a vessel — the body we live in. It's the one thing you never get to step out of.

# You Live In Your Vessel 24/7

Every time you look in the mirror you feel one of two things: quiet pride, or a flicker of shame. There's no in-between, and there's no getting away from it, because you are always in your vessel.

Most people pour everything into big houses and fancy cars and neglect the one home they actually live in every second of every day — their body.

# Where Do You Want To Live?

Most people have no idea how good they're capable of feeling, because they've never been metabolically flexible. Instead they live with:

- Brain fog
- Waking up tired
- No drive to work
- Stiffness
- No confidence

# A Neglected Vessel Costs You

Every successful person tells you to prioritise health for a reason. Without health there is no sustained success — and chasing anything worthwhile is far harder when you're running on:

- Low energy all day
- Dysregulated mood
- Elevated stress
- Constant low-grade anxiety

If you're dedicating your life to a mission, your vessel is the machine you'll run it from. Build it first.`,
  },
  {
    slug: "there-is-no-overnight-process",
    title: "There Is No Overnight Process",
    category: "Biohacking Foundations",
    summary: "A biohacked body can't be bought, borrowed or rushed. It's built one disciplined step at a time.",
    body: `One last warning before you start: this is not an overnight process.

# It Takes Time

Real change here requires a genuine commitment. You already said you'd sacrifice comfort for what you want — this is where that gets tested.

# It Can't Be Bought

A biohacked body cannot be bought, borrowed, inherited or fast-tracked. The only way to build it and keep it is consistent hard work. That's exactly why it conveys respect, discipline and self-mastery — because so few are willing to earn it.

# The Student's Mindset

Everyone who stays successful is always learning. Go into this with an open, student's mind rather than assuming you already know it all.

# One Step At A Time

Every large journey traces back to a series of small steps. No matter how small the step feels, progress is progress.

# If You Don't Quit, You Can't Fail

The only way to truly fail is to quit. Put your mind to anything for long enough and you will reach it — this is the closest thing to a cheat code there is.

# It Won't Be Easy

You can't build a new version of yourself without letting the old one go, and that's uncomfortable. Nothing worth having — money, a strong body, real confidence — comes without hardship. That difficulty is exactly why it's rare and valuable.

Make the promise now: you'll put the work in.`,
  },
  {
    slug: "food-is-fuel",
    title: "Food Is Fuel",
    category: "Biohacking Foundations",
    summary: "Stop eating for escape. Fuel the vessel with quality inputs and point it at a destination.",
    body: `The first law of thermodynamics: energy can't be created or destroyed, only changed from one form to another.

# This Applies To Food

When you eat, your body extracts energy and nutrients from the food and puts them to work running its functions. That's why some foods are healthy and some aren't — some are dense in usable nutrients, and others bring things your body has to fight, with little nutrition in return.

# Your Body Is A Car

Your body is a high-performance machine. What would you rather run it on — high-grade fuel, or the equivalent of used vegetable oil? The quality of your inputs shows up directly in the quality of your outputs.

We were all born with an incredible machine. The difference is that only some people maintain it — the right fuel, the right care — and that's the machine that wins the race.

# Food Was Not Made For Pleasure

Modern eating treats food as pleasure and escape. It works: you can get lost in something sweet and, for a moment, forget your real problems.

I did this myself with fruit. Because it's sweet and "healthy," I could eat endlessly and still look disciplined to everyone around me. But the intention was the same — eating to escape. And when the taste ends, the problems are still there, so you reach for more.

# See It As Fuel

Stop treating food as pleasure or escape and start treating it as fuel. And fuel needs a destination — decide what you're driving toward.`,
  },
  {
    slug: "food-pyramid-propaganda",
    title: "The Food Pyramid Propaganda",
    category: "Biohacking Foundations",
    summary: "The grain-heavy pyramid was built to sell addiction, not health. Do the opposite of the 99%.",
    body: `Time for a controversial one: the food guidance most of us were raised on.

# The Food Pyramid

The pyramid they teach in schools looks harmless — a colourful spread of foods meant to guide you to health. But look closer at what sits at the base: cereals, grains and seed oils. It's less a road to health and more a road to mediocrity.

Ask yourself whether someone operating at the top of their game is eating cereal and bread, or a good steak.

# The School System

The system conditioned us to treat the pyramid as one-size-fits-all — while serving kids pizza for breakfast, sugar-loaded snacks at break, and burgers with cookies at lunch. No one questioned it, because the parents were raised on the same message.

The lesson: look at what the majority do, and do the opposite.

# The Grain Problem

The adult pyramid recommends an enormous number of grain servings. Grains contribute to:

- Weight gain
- Inflammation
- Insulin resistance

Inflammation is why a heavy meal makes you want to sleep straight after — your body fighting what you just ate is not a sign it wanted it.

# There Is No Essential Carbohydrate

Everyone is obsessed with carbs, but there is no such thing as an essential carbohydrate. Fats and protein are non-negotiable — your brain is largely fat, and hormones like testosterone are built from cholesterol. Yet the message is always "cut the fat, it's too many calories."

# Follow The Money

Carbs are cheap, addictive and easy to sell. You can't make protein or real fats addictive, so the industry leans on refined carbs, labels them "low fat," and funds studies to keep the story going — the same playbook once used to call cigarettes harmless.

Understand the incentive, and the guidance makes a lot more sense.`,
  },
  {
    slug: "dont-eat-gluten",
    title: "Don't Eat Gluten",
    category: "Biohacking Foundations",
    summary: "Gluten inflames the gut, spikes insulin and leaks bacteria into your blood. Cut it out.",
    body: `Bread, pasta and grains — the cheap, filling foods — come with a hidden cost.

# Gluten Starts Fires

You'll find gluten in wheat, barley and rye. It's a trigger for inflammation, which can cascade into:

- Autoimmune issues
- Joint pain
- Digestive problems

# Refining Strips The Nutrients

During refining, most nutrients are stripped out of cereals, pasta and bread. Even when the label says "high fiber" or "high iron," that was true of the grain before it was processed — not after.

# It Spikes Your Insulin

Refined staples like white bread and white rice spike insulin harder than almost anything. Chronically elevated insulin drives:

- Fat storage
- Brain fog
- Type 2 diabetes
- Inflammation

# It Lets Bacteria Through

Gluten can irritate the lining of the small intestine, letting undigested food and bacteria leak into the bloodstream. This often flies under the radar as chronic fatigue, skin issues, joint pain and digestive discomfort — with most people never connecting it to the cause.

# Actionable Step

Cut out gluten.`,
  },
  {
    slug: "dont-use-vegetable-oils",
    title: "Don't Use Vegetable Oils",
    category: "Biohacking Foundations",
    summary: "Industrial seed oils are barely a century old and made with petroleum solvents. Use real fats.",
    body: `Vegetable oil, sunflower oil, canola (rapeseed) oil — you've seen them in every shop, marketed as "heart healthy." They're anything but.

# A Short, Questionable History

Unlike butter, animal fat and traditional oils, industrial seed oils only appeared in the early 1900s — under a century ago. Their rise tracks closely with the first real rise in obesity and chronic disease. The average person now consumes an enormous amount of them every year.

# How Seed Oils Are Made

Take canola/rapeseed oil as the example, since it's one of the most common. The process runs roughly:

1. Start with a genetically modified seed, heavily treated with pesticides
2. Subject it to extreme heat, causing oxidation and rancidity
3. Extract the oil using a petroleum solvent
4. Acid-treat it to strip out the solvent
5. Add chemicals to fix the colour
6. Deodorise it to remove the chemical smell

# How Butter Is Made

Take cream from milk, and shake it until it's solid. That's it.

# What To Use Instead

Go back to what people used before the industrial oils:

- Coconut oil
- Avocado oil
- Extra virgin olive oil (cold, not for high heat)
- Animal fat — beef tallow, duck fat
- Butter and ghee

Check the label: real butter has one or two ingredients — milk, maybe salt. Avoid anything "spreadable."

# Actionable Step

Cut out all seed oils.`,
  },
  {
    slug: "do-not-eat-processed-sugar",
    title: "Do Not Eat Processed Sugar",
    category: "Biohacking Foundations",
    summary: "Zero nutrients, drug-like addiction and a wrecked ability to focus. Cut all processed sugar.",
    body: `Processed sugar hides in roughly eight out of ten packaged foods — and it's doing real damage.

# Zero Nutrients

Your body pulls nutrients out of food and puts them to use. Sugar has none to give. It's pure empty energy that taxes the body rather than feeding it — despite the old line that "sugar gives you energy."

# It Behaves Like A Drug

Sugar is genuinely addictive. People get withdrawal-like symptoms — shakiness, irritability — when they go without it for too long. That makes it one of the hardest things to cut.

# It Wrecks Your Focus

Eat anything with added sugar or artificial sweeteners and your ability to concentrate takes a hit. You may not notice it until you've cut it out and feel the difference — then eat it again and watch your focus fall off.

# Long-Term Cost

Chronic high sugar intake is linked to:

1. Obesity
2. Type 2 diabetes
3. Heart disease
4. Tooth decay
5. Fatty liver disease
6. Metabolic syndrome

# Actionable Step

Cut out all processed sugar.`,
  },
  {
    slug: "clean-your-cupboards",
    title: "Clean Your Cupboards",
    category: "Biohacking Foundations",
    summary: "Every tempting wrapper in the house steals focus. Remove the battle instead of fighting it.",
    body: `Willpower is a limited resource. Don't spend it fighting the snacks in your own kitchen.

# The Craving Never Fully Leaves

You'll always see something sweet and think "that looks good." The urge doesn't vanish — and every time it fires, it's one more moment you have to resist.

# Don't Fight An Uphill Battle

If a chocolate bar or a bag of crisps is sitting an arm's reach away, at some point you'll give in. Then, the moment the taste fades, the regret arrives. Why keep it there at all if you don't intend to eat it?

# It Costs You Focus

Every time you notice that snack, your brain starts a small argument — one side for eating it, one against — and that burns real mental energy. As someone trying to do focused work, you can't afford to run that loop all day.

# Actionable Step

Clean out your cupboards. Get rid of the junk, or at minimum keep it out of sight and out of reach. If family keeps it in the house, do your best to block it from your own routine — it simply isn't an option anymore.`,
  },
  {
    slug: "you-can-mix-fuels",
    title: "You Can Mix Fuels",
    category: "Biohacking Foundations",
    summary: "The 'never mix fat and carbs' rule is a myth. Nature's most perfect foods combine both.",
    body: `There's a popular idea that the body, like a car, should run on either fat or carbs — never both. In practice, that's a myth.

# Nature Mixes Fuels

The most perfect food for a human — breast milk — contains saturated fat, sugar and protein together. And it's not alone:

- Honeycomb eaten whole: carbs from honey, plus fat and protein from larvae and royal jelly
- Whole animal, nose-to-tail: glycogen (sugar) in fresh meat, blood and organs, alongside fat and protein
- Eggs: mostly fat and protein, with a few grams of sugar in a fresh egg
- Caviar: fat, protein and some carbohydrate

# The Best Foods Combine Both

Think about the food combinations people find most satisfying — bone marrow with honey, mashed potato with butter, good ice cream. Fat and carbohydrate together. Our ancestors weren't skimming the fat off milk or discarding the royal jelly from honeycomb.

# The Takeaway

If you want less energy and lower hormones, restrict yourself to a single fuel and overeat protein. If you want to thrive — more energy, healthier hormones, better fertility — you can absolutely mix fuels. The quality of the food is what matters most.`,
  },
  {
    slug: "how-to-not-ruin-your-skin",
    title: "How To Not Ruin Your Skin",
    category: "Skin & Sun",
    summary: "Your skin is a readout of your gut. Fix the inside and the outside follows.",
    body: `How to not ruin your skin:

1. Don't consume fruit with meat (separate it, unless it is pineapple, then it goes well)
2. Eat more raw meat instead of always cooking/grilling meat. Raw meat has 707 kU/100g of AGE, cooked meat has 2–10k kU/100g of AGE. Think medium rare / rare ribeye steaks.
3. Consume more gelatin / collagen
4. Don't stress about what you eat (important, stress is a big factor)
5. Enjoy your food instead of being too rational and science-based about it
6. Have 30–90 min of direct sunlight a day
7. Daily grounding
8. Use the biomax aleppo soap we talked about in the testosterone products
9. Lamb liver
10. Beef tallow balm / coconut oil as moisturizer

And remember, if you cannot eat it, it shouldn't go on your skin. After all, your skin is your biggest organ.

I had quite a bit of eczema. I'd always look for the "topical" solution with the shitty cerave cleanser, because that is what all the other people recommended. Day in, day out, cleaning my face and doing some korean skincare routine — and my skin only got worse.

And how did it disappear? I healed my gut. Your exterior health is just showing you what is happening on your interior. If you have a healthy diet, a healthy lifestyle, and you get your hormones back to normal with optimal testosterone protocols, you will have healthy skin.

Do not trust these companies that sell you facial cleansers and special moisturizers. Simply use the biomax soap in the shower, then moisturize with beef tallow balm or coconut oil. Fix your diet, do all that is listed at the top. Your skin will thank you.`,
  },
  {
    slug: "the-importance-of-sunlight",
    title: "The Importance Of Sunlight",
    category: "Skin & Sun",
    summary: "Get 10+ minutes of direct, shirtless sunlight daily. No window, no sunscreen.",
    body: `Get plenty of sunlight — at least 1–2 hours a day. You don't need to be scared of the sun; it's essential for your testosterone and overall health.

As humans, we were designed to be outside for 12 hours a day. Now we spend 12 hours a day inside. Part of that is work, part is just not wanting to go out. But this is what I'd recommend.

# Avoid Sunscreen

Sunscreen contains chemicals that are both carcinogenic and estrogenic — octinoxate, oxybenzone, octisalate, octocrylene, homosalate, avobenzone. It seeps into your skin and, combined with the sun, works against your hormones. It's also literally blocking the sun, which is essential for human health.

Look at tribes like the Hadza — they don't wear sunscreen. If you get sunburnt easily, it's likely you're consuming too many omega-6 fatty acids and your diet needs time to adjust.

# However

Sunburns can't be avoided if you stay out too long. Put on tallow balm and stay in the sun with it. You can stay out without sunscreen for 1–2 hours depending on your phenotype. If you're a Northern European white guy in a country like Egypt, don't overdo it — use tallow balm and don't stay in the sun for too long.

# Actionable Step

Get at least 10 minutes of shirtless sunlight every day — morning or midday. Direct sunlight onto your skin, never through a window.

"What if it's cloudy? What if it's raining?" You still get sun even on cloudy days — it's still light outside, so there are still UV rays. I'm in the UK, I know the pain. You power through it.

# Make This A Habit

Right after reading this, go and get 10 minutes of shirtless sunlight. Every day from now on. Even if you stay inside the whole day after that, it still builds up. 1% better is a 37x per year increase — that's the motto.

Your brain will tell you to "leave it for another day." But that's the same brain that gets you to procrastinate work. Go do it now. Don't post it — hold it as an internal win. Stack the rocks.`,
  },
  {
    slug: "healing-your-leaky-gut",
    title: "Healing Your Leaky Gut",
    category: "Gut & Microbiome",
    summary: "The gut lining is the foundation. Rebuild it with collagen, D3, zinc, and anti-inflammatories.",
    body: `Imagine your gut lining is like the walls of your house. In a healthy gut, these walls have perfectly fitted doors that only open for the good stuff — the nutrients your body needs. In a leaky gut, it's like someone took a BB gun to your walls, creating holes everywhere. When it rains — toxins from food, stress, medications — instead of staying outside, it pours through those holes into your living room.

When your gut wall is damaged, things that should never enter your bloodstream start flooding in: undigested food particles, bacteria, toxins, inflammatory compounds. Your immune system sees these invaders and goes into full attack mode — and starts attacking everything, including your own tissues. This is why you suddenly develop random sensitivities to foods you've eaten your whole life.

**70% of your ENTIRE immune system lives in your gut lining.** When that lining is damaged, it's like having 70% of your body's security force out of commission. This is the hidden driver behind joint pain you can't shake, brain fog, skin breakouts, exhaustion after a full night's sleep, and slow recovery from workouts.

# The Building Blocks

Your gut lining needs specific raw materials to rebuild itself. Eat fatty, collagen-rich meats — pot roasts, pork shoulder, oxtail. The fattier and more gelatinous, the better. If you can't eat enough:

- Collagen peptides: 20–30g daily, best absorbed between meals
- Bone-in sardines: 3–4 cans per week for easily absorbed calcium
- Bone broth: homemade if possible, warm on an empty stomach
- Raw milk kefir: 1 cup daily — collagen precursors plus beneficial bacteria

# The Tools

Most people are deficient in the two nutrients that power gut repair: **Vitamin D** and **Zinc**. Without them you're rebuilding with a broken toolbox.

- Vitamin D3: 4,000–5,000 IU daily, take with fats (breakfast or dinner)
- Zinc L-carnosine: 75mg daily, 2 hours after meals or before bed

Source the highest quality you can find — this isn't the place to save money.

# Calm The Fire First

Your gut can't heal in an inflamed environment — it's like rebuilding a house while it's still on fire. If you wake up stiff, can't think clearly after eating, or your skin looks like connect-the-dots, deal with inflammation first:

- Curcumin: 500–1000mg daily, with black pepper or it won't absorb
- Boswellia: 300–500mg daily
- Black seed oil: 1–2 teaspoons daily

Take these with your fattiest meal.

# Protect The Lining

While healing, your gut needs protection. This is where lactoferrin comes in — it coats the damaged lining while killing harmful bacteria.

- Raw milk: 1–2 glasses daily if you can access and tolerate it
- Raw goat's milk: often better tolerated
- Lactoferrin: 500mg daily, first thing on an empty stomach
- Colostrum: 1–2g daily on an empty stomach
- Slippery Elm: 1–2g in water 20 min before meals

# Rebuild The Gates

The tight junctions are the security checkpoints between gut and bloodstream.

- L-Glutamine: 5000mg powder in water on an empty stomach
- Onions daily, raw or cooked — red have the highest quercetin
- Blueberries: at least a cup a day
- Quercetin: 300–500mg daily, 30 min before meals

Studies show quercetin can restore intestinal barrier function within 4–6 weeks of consistent use.

# What To Expect

Initially you might feel slightly worse — more tired, some digestive upset, a bit foggy. That's your body redirecting energy toward repair. Then the shift: less bloating, clearer thinking, better skin, less joint stiffness. Foods that once caused problems become tolerable again.

Your gut lining completely regenerates every 3–5 days — a fresh opportunity to rebuild it with every meal. Miss days and you're starting over. Give it 4–6 weeks of consistent effort.`,
  },
  {
    slug: "your-microbiome",
    title: "Your Microbiome Is Finished",
    category: "Gut & Microbiome",
    summary: "Break the biofilms, identify what's overgrown, then target it — in the right order.",
    body: `A damaged gut lining also damages your body's ability to regulate the microbes living inside your gut. This means an imbalanced microbiome — mood issues, chronic inflammation, endless digestive problems. And the longer you let them thrive, the harder they become to kill.

Almost everybody in the western world has both a leaky gut and dysbiosis — gut bacteria gone rogue. Western medicine's cure? Blast you with antibiotics that kill the good bacteria too, and don't even touch the bacteria that shield themselves in biofilms — bacterial safehouses that make them 1000x more resistant.

You need a smarter approach.

# Break The Biofilms

First, pierce their defenses. Two options:

- NAC on an empty stomach — dissolves the protective shields
- A spoonful of 500 MGO+ Manuka honey with high-quality cranberry extract

Manuka is selective — it kills the bad guys while feeding the good bacteria.

# Order Matters

We sealed your leaky gut first for a reason. If you killed off all these bacteria while your gut was still leaky, you'd flood your system with toxins — a herxheimer reaction that can make you feel like death. Seal first, then clear.

# Identify What You're Dealing With

*SIBO* — bloated 1–3 hours after eating, constant gas, brain fog, full after a few bites. Test: eat a banana with a slice of bread; bloated and gassy within 2 hours means SIBO.

*Candida* — sugar cravings, white coating on the tongue, random skin rashes, brain fog after carbs. Test: avoid all sugar and starch for 3 days; feeling better but craving hard means candida.

*Dysbiosis* — rotten-egg gas, alternating diarrhea and constipation, cramping, mucus in stool. Test: scrambled eggs with onions; sulfur gas and cramping within 4 hours.

*Parasites* — never satisfied after eating, itchiness around the backside, teeth grinding at night, dark circles. Look for worms in stool and night-time itching.

*H. pylori* — burning pain on an empty stomach, nausea, bad breath, pain that improves after eating.

# Target It

Berberine is the most powerful broad-spectrum antimicrobial — run it no matter what. Then get specific:

- **SIBO:** oregano oil 200mg, allicin 300mg, ginger extract 1000mg, neem 300mg
- **Candida:** undecylenic acid 250mg 3x daily, caprylic acid 500mg 3x daily, betaine HCl 500mg with meals
- **Dysbiosis:** black seed oil 1000mg, Manuka honey 20g (UMF 15+), Lactobacillus plantarum 50 billion CFU
- **Parasites:** tongkat ali 400mg, wormwood 200mg 2x daily, clove oil 100mg 2x daily, pumpkin seeds 500mg
- **H. pylori:** mastic gum 500mg 3x daily, cranberry extract 1000mg, bismuth citrate 200mg 2x daily

You only need around 4 weeks to disrupt and kill 99% of these microbes with the right protocols. Break down biofilms → identify the specific problem → target it with the right compounds. Be systematic rather than throwing supplements at the wall.`,
  },
  {
    slug: "top-5-gut-healing-superfoods",
    title: "Top 5 Gut Healing Superfoods",
    category: "Gut & Microbiome",
    summary: "Bone broth, grass-fed butter, sardines, goat products and herbs — plus the peptides that finish the job.",
    body: `I'm going to cut through the BS about superfoods and give you the five foods that actually heal your gut. Your gut lining regenerates every 3–5 days — a fresh opportunity to rebuild it or keep damaging it with every meal. These aren't just foods; they're the raw materials your body uses to construct a healthy gut lining.

# 1. Bone Broth, Gelatin, Collagen & Slow-Cooked Meats

Your gut lining is made of the same materials found in bones, cartilage and connective tissue. Stick to ruminant animals — beef, lamb, bison. Type 1 collagen is the most important for gut healing. Key amino acids: glycine (lowers inflammation), proline (collagen synthesis), hydroxyproline (needs vitamin C). One study showed a significant reduction in circulating endotoxins from regular bone broth. Bonus benefits for skin, hair and joints.

# 2. Grass-Fed Butter

High in fat-soluble vitamins that are hard to find elsewhere. Raw grass-fed is elite — pasteurization destroys many compounds. It's an incredible source of vitamin A in retinol form. Ghee is even better for some — higher in medium-chain fats, easier on the GI tract, and helps restore butyrate (the primary fuel for gut lining cells). In one study, Crohn's patients given butyric acid — 7 out of 10 went into remission.

# 3. Sardines

Probably the most nutrient-dense food on the planet. Extremely high in calcium if you eat the bones — and calcium acts like a zipper for the leaky holes in your gut wall. Eat the bones; they're soft and edible. The omega-3s protect the tight junctions between gut and bloodstream. Eat these 2–3 times per week minimum.

# 4. Goat Products

Goat whey, colostrum and raw goat milk are underrated. The amino acid ratios match human needs better than cow products for most people. High in glutathione — your master antioxidant and detoxifier. Smaller protein molecules mean your damaged gut works less hard to break them down.

# 5. Herbs & Aromatics

Not flavor enhancers — potent medicine. Parsley (kidney support), oregano (antimicrobial), thyme (respiratory), rosemary (soothing, brain-protective), mint (soothes gut inflammation), basil (liver support), ginger (motility and inflammation), radishes (clears bilirubin and uric acid). Use fresh and generous — therapeutic amounts, not a garnish.

# Advanced: Peptides

After you've run the leaky gut and antimicrobial protocols, peptides put the finishing touches on everything. A peptide is just a short chain of amino acids — the same stuff in your recovery shake.

**BPC-157** is produced in your gastric juices naturally. It heals leaky gut at the cellular level, improves recovery markers, works like a nootropic, improves sleep, and heals injuries topically. Paired with quercetin and butyrate it can completely heal a leaky gut.

**GHK-Cu** repairs virtually every tissue type, deactivates inflammatory genes, and helps rebuild the basal cells of your gut lining. It should be a royal blue color — if not, it's garbage.

Targeted gut peptides: Larazotide acetate (0.25mg 3x daily with meals) reduces permeability; KPV (200mcg 2x daily, away from food) for inflammation; TB-500 (2.5mg 2x weekly) for tissue repair.

Suggested sequence — Weeks 1–4: leaky gut protocol. Weeks 5–8: antimicrobial protocol. Weeks 9–12: BPC-157 250mcg 2x daily plus one targeted peptide.

Quality matters more than anything with peptides — third-party testing, refrigerated storage, established suppliers. Most peptides you cycle 5 days on, 2 days off. Take BPC-157 on an empty stomach, 30 minutes before meals.`,
  },
  {
    slug: "only-eat-these-things",
    title: "Only Eat These Things",
    category: "Diet & Food",
    summary: "The one-ingredient human diet: fatty meat, eggs, raw dairy, fruit as fuel. No sugar.",
    body: `# Your Normal Meals

Nothing but these things should go into your mouth:

- Fruit / honey after a workout as fuel (under 50g carbs a day if you're work-focused)
- Peanut butter / almond butter (no bs ingredients)
- Plenty of fatty meat (20% fat beef, steak, chicken thighs)
- Plenty of eggs (at least 4 a day, optimal is 10 a day)
- Cheese (only 1-ingredient real mature cheese)
- Butter (no seed oil spreadable stuff)
- Nuts (any nuts)
- Kefir, raw milk, any raw dairy
- Avocados

# This Is The Human Diet

This combines biohacking and bulking. And no, you don't need vegetables.

# Eat As Much As You Can

As long as you keep it in the healthy food bracket, your body will tell you when to stop — but only with real food that has no sugar.

Meat can taste like shit sometimes — that's your gut and brain communicating. When it tastes good, "we need these nutrients, eat more." When it tastes bad, "we don't need these, stop." That's the beauty of real food.

# Sugar Doesn't Make You Stop

When you ingest sugar it increases dopamine, so your stomach doesn't care if it's full — it keeps finding a way to eat. It blocks the hormone that says "we're full, stop eating." This is why people get fat on a bulk: they think "I need to eat a lot," then eat sugar, which removes the full signal.

# Actionable Step

- Create your own diet blueprint
- Decide what you're going to eat every day from now on
- Use the list above to help`,
  },
  {
    slug: "diet-and-lifestyle",
    title: "Diet And Lifestyle",
    category: "Diet & Food",
    summary: "Prep carbs right, cut the hidden toxins, chew properly, and support your liver and lymph.",
    body: `You're following something close to the health course — mainly meat, eggs and the good stuff. But most people get carbs wrong: it's about quality and timing, not avoidance. Add proper carbs like potatoes, sweet potatoes, oats and rice — prepared right.

Rice is loaded with arsenic. Rinse it in RO water 5–6 times until the water runs clear, then soak for 30 minutes before cooking. This removes up to 80% of the arsenic.

# The Hidden Toxins

Your gut is getting hammered from directions you haven't considered: washing-up liquid residue on plates, laundry detergent absorbing through your skin, unfiltered water, stagnant air, synthetic fragrances, non-organic fruit covered in pesticides.

The gut-destroyers to eliminate: alcohol and artificial sweeteners. They cause massive inflammation and punch holes in your gut lining.

Estrogen is terrible for gut health — it slows motility and increases inflammation. One of the cheapest ways to lower your estrogen-to-testosterone ratio is eating white button mushrooms daily.

# Eat Properly

First rule: no water with meals — it dilutes stomach acid. Keep water 15 minutes before and after eating. When you sit down to eat, that's all you're doing: no phone, no TV, preferably outside in the sun. Your nervous system needs to be in rest-and-digest mode.

Then there's chewing. Most people chew 5–10 times. Chew each bite 20–30 times until it's basically liquid.

# Detox Pathways

- Activated charcoal every few days on an empty stomach binds toxins (keep it away from supplements and medications)
- Move your lymph — it has no pump and relies on movement; even 10 minutes on a mini trampoline helps
- Sweat via sauna, hot baths or exercise — your skin is a primary elimination route
- Castor oil packs on your liver 2–3 times per week stimulate bile flow
- TUDCA or ox bile 250–500mg with fatty meals if digestion is sluggish

It's not about being perfect. It's about reducing the total toxic load so your gut has a chance to heal instead of constantly fighting fires. Your gut is either healing or being damaged with every choice you make.`,
  },
  {
    slug: "ingredients-that-tank-testosterone",
    title: "Ingredients That Tank Your Testosterone",
    category: "Diet & Food",
    summary: "Cut artificial sweeteners, refined sugar and grains. Eat one-ingredient foods.",
    body: `# Artificial Sweeteners

- Aspartame (sometimes under the name Nutrasweet)
- Acesulfame-K
- Neotame

# Refined Sugars

Avoid all forms of refined sugar — the sugars found in drinks, sweets and desserts.

# Grains

All forms of grains should be avoided — bread, pasta, cornflakes, oatmeal, you name it. Grains are well known for causing inflammation in the gut because of their gluten and phytic acid content. This is controversial since grains sit on top of the food pyramid — but use common sense: listen to advice from people who have the result you actually want, not from the food pyramid.

# The Easiest Way To Fix Your Diet

Only eat foods that have one ingredient. Red meat has one ingredient. A banana has one ingredient. Only eat things humans were designed to eat — if it doesn't grow from the ground or come from an animal, don't consume it.

Companies pay experts millions to split-test ingredients to make food maximally addictive. That's not natural, and it will tank your testosterone.`,
  },
  {
    slug: "fats-and-oils",
    title: "The Fats And Oils You Should Use",
    category: "Diet & Food",
    summary: "Stick to animal fats and coconut oil for cooking. Keep olive oil off the heat.",
    body: `The fats and oils you should use:

- Grass-fed, raw milk butter (if you don't have grass-fed, normal is fine)
- Organic, cold-pressed coconut oil
- Beef fat (tallow)

Olive oil should be avoided for frying — it doesn't have a high smoke point, so when heated it distributes harsh chemicals that can lower testosterone and harm your health. Olive oil is good added onto meals cold.

A lot of olive oils are cut with seed oils. Check the back: if it says it originated from more than one country, it's likely cut with seed oil.

Stick to animal fats — that's what we've used from the beginning of time, and the ones listed have a high smoke point, so they can fry without distributing harsh chemicals.`,
  },
  {
    slug: "common-mistakes",
    title: "Common Mistakes To Avoid",
    category: "Diet & Food",
    summary: "Go easy on fish and chicken, buy pasture-raised eggs, skip grains and table salt.",
    body: `# Don't Eat Too Much Fish

Fish nowadays contains a lot of microplastics — eating too much does more harm than good.

# Don't Eat Too Much Chicken

Chicken is high in omega-6 fats. If you love it, get organic birds that aren't fed soy.

# Buy Free-Range Or Pasture-Raised Eggs

The chickens should not be fed corn and soy, which makes their eggs high in inflammatory omega-6 fatty acids. I'll eat eggs but not chicken — your choice.

# Do Not Eat Grains

No bread, no pasta, no form of dough.

# Vegetables — Only Organic And/Or Fermented

A lot of pesticides are sprayed on vegetables. They also contain anti-nutrients that prevent absorption of vitamins and minerals and cause inflammation. Fermenting largely breaks these down — sauerkraut is a good example.

# Do Not Use Table Salt

Table salt contains no minerals, while sea salt such as Himalayan and Celtic contains more than 80 essential minerals. Salt isn't bad for you — only table salt is.

# Final Point

You can occasionally eat boiled potatoes, sweet potatoes or white rice — but don't make them your main daily source of carbohydrates.`,
  },
  {
    slug: "raw-milk-dos-and-donts",
    title: "Do's & Don'ts With Raw Milk",
    category: "Diet & Food",
    summary: "Never drink it straight from the fridge. Around 1L a day is the sweet spot.",
    body: `# Don't Drink It Cold

Leave it outside for a couple of hours — do it like they did back in the day, before fridges. Personally I'd leave it out for about an hour because time is precious, but don't drink it straight out of the fridge.

# Amount To Drink

1L per day is a perfect amount. I wouldn't go over 2L.`,
  },
  {
    slug: "sea-salt-vs-table-salt",
    title: "Sea Salt vs Table Salt",
    category: "Diet & Food",
    summary: "Table salt has no minerals. Sea salt has 80+ — and minerals drive testosterone.",
    body: `Do not use table salt. Table salt contains no minerals at all, while sea salt such as Himalayan and Celtic sea salt contain more than 80 minerals that are essential.

Your body needs these micronutrients. Being deficient in even one — such as zinc — can lower your testosterone dramatically. Now imagine being deficient in magnesium, selenium, boron and more.

Cover your food with sea salt, don't be shy — but avoid table salt at all costs.`,
  },
  {
    slug: "never-frozen-meat",
    title: "Never Frozen Meat",
    category: "Food Sourcing",
    summary: "Meat should be fresh, not frozen. Conventional grocery meat is fine — freezer meat isn't.",
    body: `Meat should always be fresh. Frozen meat isn't the goal — save it for genuine emergencies.

# Keep It Fresh

Frozen meat isn't ideal unless you're in a survival situation. If you already have a freezer full of it, don't panic — leave it for emergencies, or pass it on to someone else, and buy fresh going forward so you can actually make progress.

# Conventional Is Fine

You don't need anything exotic. Ordinary fresh meat from the grocery store is perfectly acceptable — fresh matters more than fancy.`,
  },
  {
    slug: "sourcing-beef",
    title: "Sourcing Beef",
    category: "Food Sourcing",
    summary: "Buy meat cut fresh by the store butcher, not vacuum-sealed branded packs.",
    body: `Grass-fed beef has more nutrients and is preferable, but for muscle meat it doesn't have to be grass-fed. What matters most is that it's fresh.

# Buy From The Butcher Counter

The best grocery meat comes from stores with an in-house butcher. They deal with a farm, receive sections of the animal, and cut it fresh in the back. If you ask whether it's fresh and they say yes, it almost always is.

Buy the meat that's cut and wrapped in the back — the cuts on a paper tray under plastic wrap. Avoid the vacuum-sealed, branded packs produced off-site, where there's less transparency about what's added.

# If You're Concerned

Some regions have stricter handling that can involve chemical rinses. If that worries you, ask the butcher to cut you a fresh section and to rinse the table and knife with water first — you can watch them do it — or buy a larger cut still in its original packaging from the cooler.

If packaged meat is all you can get, it's still a solid second-best. Don't stress too much.`,
  },
  {
    slug: "sourcing-chicken",
    title: "Sourcing Chicken",
    category: "Food Sourcing",
    summary: "If you eat chicken, make it pasture-raised and soy-free — but most of the time, choose beef.",
    body: `If you eat chicken, source it well — but most of the time, beef is the better choice.

# Aim For Pasture-Raised

Ideally the birds are non-GMO and fed no soy. Look for pasture-raised rather than free-range: "free-range" can still mean a crowded barn with token outdoor access, while pasture-raised means the birds are mainly outdoors. Many larger health-focused stores carry a pasture-raised source.

# But Usually, Choose Beef

Nine times out of ten, skip the chicken and eat beef instead.`,
  },
  {
    slug: "raw-dairy",
    title: "Raw Dairy",
    category: "Food Sourcing",
    summary: "Raw goat's milk edges out raw cow's milk. Never drink homogenised milk — it raises estrogen.",
    body: `# Goat Milk Edges It

Raw goat's milk beats raw cow's milk. Raw cow's milk is still an excellent food, but goat's milk has:

- Higher vitamin C
- Higher lactoferrin
- A better amino acid balance
- More inositol
- A closer resemblance to breast milk

Raw cow's milk arguably tastes better — either way, both are excellent.

# Sourcing It

If you're lucky enough to live somewhere with easy access, great. If not, you may need to hunt for a farm, or organise with others who want raw dairy — a group can even contract a farmer to produce for them. Start with the online directories that map where to buy raw dairy.

If you can't get raw milk at all, Parmigiano Reggiano — found in most shops — is made from raw cow's milk and is a good stand-in.

# One Rule

Do not drink homogenised milk. It will raise estrogen.`,
  },
  {
    slug: "sourcing-honey",
    title: "Sourcing Honey",
    category: "Food Sourcing",
    summary: "Real raw honey is never heated above body temperature and the bees are never fed sugar.",
    body: `Real raw honey is easy to fake on a label. Here's how to tell.

# The Two Rules

For honey to be genuinely raw:

- It must never be heated above roughly body temperature (about 93°F)
- The bees must be fed nothing but honey — not sugar or corn syrup in the off-season

Many beekeepers feed sugar and heat their honey, and it can still legally be labelled "raw."

# How To Check

Ask whether the honey is ever heated. Many will say no — then admit they warm it "just to pour it." Ask how hot: if the answer is around 100°F or more, the honey is already compromised, no matter what the label says. Check the back of any store-bought "raw" honey.

# Better Still

If you can get local honey — some farm shops carry it — even better.`,
  },
  {
    slug: "red-meat-as-the-base",
    title: "Red Meat As The Base",
    category: "Food Sourcing",
    summary: "Red meat should be the base of the diet — but mind what you pair it with and when you eat it.",
    body: `Red meat should be the main part of the diet. It builds energy, glands, muscle and hormones.

# Mind The Combinations

Don't mix fruit or honey with red meat — it pushes the body to convert the protein into fuel instead of using it to heal. You want the fat to be the fuel and the protein to do the repair work.

The exceptions are pineapple, papaya and maple syrup. Red meat is acidic, and so are these, so they can be combined without turning the protein into "protein sugar." The problem is mixing acidic foods with alkaline ones.

# Timing Notes

- Don't leave red meat sitting in sauce for longer than a few hours — it drives the same fuel conversion and blunts the healing benefit.
- Red meat close to bedtime can keep you awake. It's stimulating, so give yourself a buffer before sleep.`,
  },
  {
    slug: "water",
    title: "Water",
    category: "Food Sourcing",
    summary: "Naturally carbonated mineral water is superior. If not that, RO water with electrolytes added.",
    body: `# Naturally Carbonated Water Is Superior

The CO2 in carbonated water has been linked to lower histamine, improved blood flow and more cellular energy — which can ease nervousness and low mood. Natural spring water also tends to be high in magnesium, supporting GABA, the calming neurotransmitter. CO2 has also been associated with more stomach acid and faster gastric emptying.

# Get The Natural Kind

You want naturally carbonated mineral water. If the label doesn't say "natural," the carbonation is synthetic. The reason natural carbonation matters: it lets the water pass inspection without added chemicals. Other waters are often dosed with chemicals to reduce bacteria and pass bacterial testing — natural carbonation is antibacterial on its own, and it won't disrupt the bacteria in your body.

# Alternatives

There may be local springs worth accessing — websites exist to help you find them. Otherwise, reverse osmosis water works, but because RO strips everything out, you'll need to add electrolytes back in.`,
  },
  {
    slug: "food-combining-rule",
    title: "A Rule Of Thumb: Food Combining",
    category: "Food Sourcing",
    summary: "Don't mix alkaline and acidic foods in one meal — indigestion and gas are the warning signs.",
    body: `A simple rule of thumb: don't mix alkaline foods with acidic foods in the same meal.

Doing so can cause indigestion — and symptoms like excess gas are a sign that digestion isn't going smoothly. Keep meals simple and combine foods that sit on the same side of that line.`,
  },
  {
    slug: "pineapple-for-bones",
    title: "Pineapple For Bones",
    category: "Food Sourcing",
    summary: "Pineapple aids protein digestion, clears lymph and stimulates bone regeneration. Pairs with red meat.",
    body: `Pineapple mostly aids protein digestion, and helps with fats too. It can be eaten with red meat, helps build bone, and breaks down lymphatic congestion.

# It Regenerates Bone

Pineapple appears to stimulate bone regeneration. Under a microscope, bone grows as a web that then fills in — and pineapple seems to encourage exactly that process.

# The Pairing

Raw red meat with pineapple is a strong combination — and it doesn't have to be raw if you're not eating raw foods yet. A rare cooked steak or burger works just as well.`,
  },
  {
    slug: "when-you-eat-beef-and-rice",
    title: "When You Eat Beef + Rice",
    category: "Food Sourcing",
    summary: "Fruit and honey are the main fuel, but the occasional rice-and-beef plate done right works.",
    body: `As covered elsewhere, your main fuel should come from fruit and honey. But once in a while, boiled potatoes or white rice are fine — and they can help gym performance.

# A Note On Grains

Grains do reduce brain function, so if your focus is on demanding work, fruit is the better fuel. Save the rice for training days.

# How To Make Beef And Rice

Plain rice with chopped beef in a pan tends to be dehydrating. This version isn't:

1. Rinse 200g of raw rice at least five times, until the water runs clear
2. Cook it in a stainless steel bowl with about 400ml of boiling water — use stainless steel, never a non-stick-coated rice cooker
3. Split 300g of fatty ground beef into two patties, seasoned with nothing but salt — quality meat doesn't need more
4. Cook the patties rare inside, never overcooked, in a cast iron or stainless steel pan greased with animal fat (pork lard or beef tallow) for its high smoke point
5. Separate the yolks from the whites and add a few raw yolks on top of the rice

Done right, this meal should leave you hydrated and full of energy.`,
  },
  {
    slug: "daily-products-to-avoid",
    title: "Daily Products To Avoid",
    category: "Products & Environment",
    summary: "The everyday endocrine disruptors quietly tanking your hormones.",
    body: `These are the endocrine disruptors in your daily life that reduce testosterone — they're everywhere. Here's how to spot them.

# 1. Teflon / Non-Stick Pans

The non-stick coating contains PTFE, which has been linked to lowered testosterone.

# 2. Plastic Kitchen Utensils

All plastics are hormone disruptors — microplastics leach into your system and mimic estrogen. Avoid plastic utensils and cutting boards.

# 3. Toothbrushes With Nylon Bristles

Every brush deposits microplastics into your saliva, which you swallow.

# 4. Toothpaste (Especially With Fluoride)

Contains microplastics and artificial sweeteners, plus fluoride. Avoid it — alternatives are in the next section.

# 5. Shaving Foam And Gel

Contains hormone disruptors and sinks into your skin as you shave.

# 6. Razors With Gel Strips (e.g. Gillette)

The gel contains disruptors that get into your skin while shaving.

# 7. Shampoos, Soaps And Detergents

Full of hormone disruptors. Warm water opens your pores, letting chemicals into your bloodstream.

# 8. Polyester Clothing

Polyester is plastic — it mimics estrogen, and you sweat into it at the gym.

# 9. Plastic Bottles And Cups

Microplastics leach in, especially when heated by the sun. Avoid plastic packaging too.

# 10. Unfiltered Tap Water

Contains heavy metals, fluoride, recycled hormones and other disruptors.

# 11. Receipts

Coated in BPA, a disruptor easily absorbed through the skin. Avoid touching them.

# 12. Deodorants

Blocking sweat isn't natural, and antiperspirants are a big endocrine disruptor.

# 13. Sunscreen

Contains carcinogenic and estrogenic chemicals — octinoxate, oxybenzone, octisalate, octocrylene, homosalate, avobenzone.`,
  },
  {
    slug: "daily-products-to-use-instead",
    title: "Daily Products To Use Instead",
    category: "Products & Environment",
    summary: "The clean swaps: cast iron, wood, natural soap, RO water, tallow balm.",
    body: `Time to make your shopping list.

# 1. Stainless Steel Or Cast Iron Pans

An investment worth making if you don't want your testosterone to crater.

# 2. Wooden / Steel Kitchen Utensils

No microplastics in your food.

# 3. Wooden Cutting Board

Same reason.

# 4. Miswak Or Bamboo Toothbrush (Sterilized Boar Hair Bristles)

No microplastics to start your day.

# 5. Coconut Oil And Baking Soda For Toothpaste

Baking soda is a natural stain remover, so your teeth stay white. Oil-pull with coconut oil, and get a tongue scraper.

# 6. Replace Shaving Foam With Soap

The best is Biomax Aleppo soap. It also delivers vitamin E topically — a deficiency in vitamin E is linked to drops in LH, FSH and testosterone.

# 7. Use A Safety Razor

No sticky gel strip, which is an endocrine disruptor.

# 8. Natural Soap For Body / Hair / Face

Biomax Aleppo soap again.

# 9. Baking Soda And White Vinegar As Detergent

Baking soda for dishes, white vinegar for clothes — natural alternatives to hormone-disrupting detergents.

# 10. 100% Cotton Or Organic Cotton Clothing

Especially for gym clothes — skip the polyester.

# 11. Glass Bottles And Cups

Plastic heats up and leaches microplastics.

# 12. Move Food Into Glass Jars At Home

You can't always avoid plastic bags at the shop — transfer to glass as soon as you get home.

# 13. Filter Tap Water With A 5-Stage Reverse Osmosis Filter

RO is the only filter that removes recycled estrogen, plastics and heavy metals.

# 14. Filter Your Shower Water Too

Your skin absorbs like your mouth does — a shower-head filter helps.

# 15. Replace Deodorant With Baking Soda

Mix baking soda with water and apply. If you think you smell, it's your diet — which we fix elsewhere.

# 16. Tallow Balm Instead Of Sunscreen

Made from beef tallow, rich in saturated fat and nutrients for skin health, and it works as sunscreen. Coconut oil is a decent alternative.`,
  },
  {
    slug: "fluoride-in-your-water",
    title: "Fluoride In Your Water",
    category: "Products & Environment",
    summary: "Fluoride is added to most tap water. Filter it out — reverse osmosis removes it, and skip fluoride toothpaste.",
    body: `Most tap water has fluoride added to it. It's worth understanding what it is and filtering it out.

# Why Filter It

Fluoride is one more thing your body has to deal with in water you drink every day. Alongside heavy metals, recycled hormones and chlorine, it adds to your total toxic load — and the goal is always to reduce that load so the body can spend its energy healing rather than firefighting.

# How To Remove It

Standard carbon filters don't remove fluoride. A 5-stage reverse osmosis filter does, along with heavy metals, plastics and recycled estrogens. Filter your drinking water — and ideally your shower water too, since your skin absorbs readily.

# Toothpaste Too

Most conventional toothpaste contains fluoride. Swap it for a natural alternative — coconut oil and baking soda work well, with a tongue scraper.`,
  },
  {
    slug: "creating-potions",
    title: "Creating Potions",
    category: "Rituals",
    summary: "Loose-leaf tea in a gourd — mix and match herbs for a daily healing ritual.",
    body: `This one was interesting to research. We're going to be creating potions — mixing and brewing.

# Tea Is Magic

Tea has been around for thousands of years, not just for taste but for health. It's been used as medicine. When you put a tea leaf into warm water, the nourishing and healing properties of the leaf get released.

# The Bitter Taste

The bitterness comes from polyphenols — antioxidants that:

- Combat oxidative stress
- Increase cardiovascular health
- Improve cognitive function
- Relieve stress

# Never Use A Teabag

Unless it's organic. Tea bags are often nylon plastic or bleached paper sealed with chemicals — so you're boiling microplastics and chemicals into your tea, which disrupt your endocrine system. There can be billions of microplastics in a single cup.

# Use A Gourd

With a gourd you can mix and match. You put ingredients in and pour boiling water over them, making infused water.

# Potion Ingredients

- Yerba mate
- Green tea
- Black tea
- Nettle leaf
- Cinnamon sticks
- Fresh ginger
- Cloves
- Fresh rosemary
- Fresh mint
- Dried fruits
- Honey

There are far more you can use. Mix and match and create your own — the benefits range from energy and focus to anti-inflammatory, digestive and immune support.

# Actionable Step

- Buy a gourd
- Create your potions
- Biohack to success`,
  },
  {
    slug: "sleep-and-recovery",
    title: "Sleep / Recovery",
    category: "Rituals",
    summary: "Recovery is a necessity, not an objective. Fine-tune the habits that own your sleep.",
    body: `Sleep and recovery is a lost art. If you want to thrive, you must master recovering.

# Just Like A Vehicle

Your body needs maintenance and repair. No matter how powerful the vehicle, it breaks down without maintenance.

# Rest Is A Necessity, Not An Objective

You need rest — but the moment you make rest the objective, you fall into a hole.

# What Happens In Sleep?

Your body works overtime:

- Torn muscles are repaired
- Nutrients from meals are delivered to cells
- Growth-inducing hormones are released
- Your mind makes sense of the day's experience
- Knowledge cements into your brain

Insufficient sleep isn't just a lack of hours — it's a lack of quality. It leads to stress, loss of focus, and loss of growth, physical and mental.

# Actionable Step — Own Your Sleep

Habits:

- Stretch before bed (alleviate tension)
- No blue light (stops melatonin)
- No notifications (raises dopamine)
- Gratitude journal (stress release)
- Micropore tape on your mouth
- Sleep mask
- Earplugs
- Cold temperatures
- Red light only before sleep
- Lock the doors (safety helps sleep)
- Set up the room for tomorrow
- Plan tomorrow

Use wisdom to incorporate whatever else works for you. Take action.`,
  },
];

export function getArticle(slug: string): LibraryArticle | undefined {
  return LIBRARY.find((a) => a.slug === slug);
}

export function articlesByCategory(): { category: string; articles: LibraryArticle[] }[] {
  return LIBRARY_CATEGORIES.map((category) => ({
    category,
    articles: LIBRARY.filter((a) => a.category === category),
  })).filter((g) => g.articles.length > 0);
}
