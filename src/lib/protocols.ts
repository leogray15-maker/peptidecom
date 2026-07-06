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
  "Skin & Sun",
  "Gut & Microbiome",
  "Diet & Food",
  "Products & Environment",
  "Rituals",
] as const;

export const LIBRARY_INTRO =
  "This is the healing wing of the Lab — the protocols for putting your body back together from the inside out. Cut the processed food, fix the gut, get the sun, ditch the endocrine disruptors. It compounds daily, with discipline. Peptides help — but only once the fundamentals below are in place.";

export const LIBRARY: LibraryArticle[] = [
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
