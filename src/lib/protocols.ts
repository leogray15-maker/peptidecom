// The Arcane Lab healing library — imported verbatim from the Notion "Arcane
// Lab" hub (every page and subpage). Content is the member-facing
// healing/biohacking material, baked in at build time so it renders instantly
// with no runtime Notion dependency.
// FOR RESEARCH / EDUCATIONAL PURPOSES ONLY. Not medical advice.
//
// Images: hotlinked from their original Skool / external CDN URLs. A handful
// of images that lived on Notion's temporary (expiring) S3 URLs could not be
// rehosted and are omitted — the surrounding text is unchanged.

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
  "The Food Deep-Dive",
  "Biohacking",
  "Products & Environment",
  "Rituals & Recovery",
] as const;

export const LIBRARY_INTRO =
  "This is the healing wing of the Lab — the protocols for putting your body back together from the inside out. Cut the processed food, fix the gut, get the sun, ditch the endocrine disruptors. It compounds daily, with discipline. Peptides help — but only once the fundamentals below are in place.";

export const LIBRARY: LibraryArticle[] = [
  // ─── Skin & Sun ────────────────────────────────────────────────────────────
  {
    slug: "how-to-not-fuck-up-your-skin",
    title: "How To Not Fuck Up Your Skin.",
    category: "Skin & Sun",
    summary: "Your skin is a readout of your gut. Fix the inside and the outside follows.",
    body: `How to not Fuck up your skin:

1. Don't consume fruit with meat (seperate it, unless it is pineapple, then it goes well)
2. Eat more raw meat instead of always cooking/grilling meat. Raw meat has 707 kU/100g of AGE, cooked meat has 2-10k kU/100g of AGE, think medium rare/rare ribeye steaks.
3. Consume more gelatin/collagen
4. Don't stress about what you eat (important, stress is big factor)
5. Enjoy your food instead of being too rational and science based about it
6. Have 30-90 min of direct sunlight a day
7. Daily grounding
8. Use the biomax aleppo soap we talked about in the testosterone products.
9. Lamb liver
10. Beef tallow balm/Coconut oil as moisturizer.

and remember, if you cannot eat it, it shouldn't go on your skin.
after all, your skin is your biggest organ.
you know, I had quite a bit… of eczema.
I'd always look for the "topical" solution with the shitty cerave cleanser, because that is what all the other people recommended.
I was day in day out, cleaning my face and doing some korean skincare routine, and my skin only got worse.
I spent all day just thinking about my skin, because it was just shitty having bad skin.
and how did it disappear? I healed my gut.
since your exterior health is just showing you what is happening on your interior.
if you have a healthy diet, healthy lifestyle, make your hormones go back to normal with optimal testosterone protocols, you will have healthy skin.
do not trust these bullshit companies that sell you facial cleansers, and special facial moisturizers.
simply use the biomax soap that I gave you, use it in the shower.
and then you can moisturize with beef tallow balm or coconut oil.
fix your diet, do all that is listed up at the top.
your skin will thank you, fuck all of the shitty products you're using rn, stop using them.`,
  },
  {
    slug: "the-importance-of-sunlight",
    title: "The Importance Of Sunlight.",
    category: "Skin & Sun",
    summary: "Get 10+ minutes of direct, shirtless sunlight daily. No window, no sunscreen.",
    body: `get plenty of sunlight, at least 1-2 hours of sunlight a day.
You don't need to be scared of the sun, the sun is something essential for your testosterone and overall health.
- Hitman. (the testosterone guy)

***this is Arcane speaking now.***
*this is literally all hitman said about sunlight, that's it.*
*there's no need to overcomplicate it, or do any study research.*
*as humans, we was literally designed to be outside for 12 hours a day.*
*but now we spend 12 hours a day inside.*
*part of that is due to working, part of that is just due to not wanting to go out.*
*but this is what i'd recommend to do.*
*this is what hitman said also...*

# AVOID SUNSCREEN AT ALL COSTS.
Sunscreen should be avoided.
Sunscreen contains many chemicals that are both carcinogenic and estrogenic such as octinoxate, oxybenzone, octisalate, octocrylene, homosalate, avobenzone.
sunscreen is literally estrogenic, meaning it will mimic estrogenic, and COMBINED with the sun.
it is seeping into your skin, and making you more of a female.
decreasing your testosterone.
and not to mention, it's literally blocking the sun, which is essential for human health.
but everyone has been convinced by things even like "skincare" that you need sunscreen.
if you look at the tribes like the hadza, they will never have any pimples or spots or whatever.
we have never wore sunscreen, it is pure stupidity to block out the sun.
if you get sunburnt, it is likely that you are consuming too many omega 6 fatty acids.
you need to wait some time for your diet to adjust.

# HOWEVER...
Sunburns can't be avoided if you stay too long under the sun.
You can just put on tallow balm and stay in the sun with it.
You can stay under the sun without sunscreen for like at least 1-2 hours depending on your phenotype as well.
If you're a Northern European white guy then you obviously don't want to stay in the sun for too long in a country like Egypt for example.
but there is a solution to this.
which is simply use tallow balm.
and don't stay in the sun for TOO long, especially if you're very light coloured.

# ACTIONABLE STEP.
*GET ATLEAST 10 MINUTES OF SHIRTLESS SUNLIGHT EVERY DAY.*
*this could be in the morning, it could be at midday.*
*but all you want to do, is get some direct sunlight on your skin.*
*and DO NOT do it through any window, it needs to be DIRECT sunlight onto your skin.*
*but you also might be thinking :*
- what if it's cloudy
- what if it's raining
- what if I don't want to do it

well, the answers are simple.
you still get sun, even on cloudy days.
when it not actually "sunny"
it's still light outside, so that means there are still UV rays from it.
so it doesn't matter if it's cloudy, rainy, or whatever.
I'm in the UK, I know the pain.
but you still power through it.
i mean, who would've thought a task as simple as sitting 10 mins in the sun requires discipline?
it should be something you do.
so here's your actionable step.

# MAKE THIS A HABIT.
right after reading this module, go and get 10 minutes of shirtless sunlight.
I'm not gonna tell you to "post your experience" because all you're doing is sitting in the sun.
this should be a norm.
and every day from now on, make sure to get atleast 10 minutes of shirtless sunlight.
even if you stay in your house the WHOLE DAY after that, it still builds up.
remember, 1% better is a 37x per year increase.
that's our motto here.
MAKE SURE, RIGHT NOW YOU GET SOME SUN (unless it's night-time)
your brain will reject this and tell you to "leave it for another day"
or "I'll do it in one hour"
but you gotta think, this is the same brain that gets you to procrastinate work.
and what are you doing rn? you're procrastinating sitting out in the sun, pussy.
go do it rn.
don't post it, but hold it as an internal win.
stack the rocks.`,
  },

  // ─── Gut & Microbiome ──────────────────────────────────────────────────────
  {
    slug: "healing-your-leaky-gut",
    title: "HEALING YOUR LEAKY GUT",
    category: "Gut & Microbiome",
    summary: "The gut lining is the foundation. Rebuild it with collagen, D3, zinc, and anti-inflammatories.",
    body: `Imagine your gut lining is like the walls of your house. In a healthy gut, these walls have perfectly fitted doors that only open for the good stuff such as the nutrients your body needs.
But in a leaky gut, it's like someone took a BB gun to your walls, creating holes everywhere.
Now imagine what happens when it rains - toxins from food, stress, medications.
Instead of staying outside where it belongs, the water pours through those holes into your living room.
That's exactly what's happening in your body right now.
When your gut wall is damaged, things that should never enter your bloodstream start flooding in like undigested food particles, bacteria and toxins, and inflammatory compounds.
Your immune system sees these invaders and goes into full attack mode.
But here's the problem:
It starts attacking everything, including your own tissues.
This is why you might suddenly develop random food sensitivities to foods you've eaten your whole life, like milk or even certain proteins.
Think about it:
Your digestive system's job is like a nightclub bouncer at your base of operations.
It's supposed to check IDs, let in the G's, and keep the brokies and troublemakers out.
*But when the bouncer is injured and can't do his job properly, shit kicks off inside the club.*
Here's what most people don't realize:
**70% of your ENTIRE immune system lives in your gut lining.**
When that lining is damaged, it's like having 70% of your body's security force out of commission.
This explains why leaky gut doesn't just cause digestive problems but also that it's the hidden driver behind that joint pain you can't shake,
Brain fog that makes you feel like you're thinking through molasses,
Skin breakouts that appeared out of nowhere,
Feeling exhausted even after a full night's sleep, and taking forever to recover from workouts.
The gut lining contains specialized cells with very specific jobs.
Paneth cells are your gut's security guards that produce natural antibiotics that ONLY kill the bad microbes.
Goblet cells are the maintenance crew that creates protective mucus.
Intestinal stem cells are the construction workers that repair damage.
When these get damaged and can't do what they are supposed to do, it's like your gut's entire workforce is injured and can't do their jobs anymore.
So how do we fix this?
Your gut lining needs specific raw materials to rebuild itself,
Just like you need bricks and mortar to fix a wall.
You need to start eating fatty, collagen-rich meats - think pot roasts, pork shoulder (If you can get it from a wild boar even better), oxtail.
The fattier and more gelatinous, the better.
If you're not eating enough meat or can't stomach large amounts, here's what you need:
- Collagen peptides: 20-30g daily, best absorbed when taken between meals
- Bone-in sardines: 3-4 cans per week for easily absorbed calcium
- Bone broth: homemade if possible, drink warm on empty stomach
- Raw milk kefir: 1 cup daily - contains both collagen precursors and beneficial bacteria that help rebuild the gut lining (look for a starter with Lactobacillus Planterum and Saccharomyces Boullardi if you find one of these I don't care how much it costs that will make the most potent Kefir for gut healing)

Collagen provides the literal building blocks for your gut lining.
Kefir is particularly powerful because it delivers both the raw materials your gut needs and the microbes that help coordinate the repair process.
But even with the best building materials, construction workers need the right tools.
Most people are walking around with severe deficiencies in the two nutrients that power gut repair:
**Vitamin D**
**And**
**Zinc**
These aren't optional.
They're the only things that can trigger your body's production of natural defense peptides.
Without them, you're trying to rebuild your gut with a broken toolbox and also you guys should be taking these anyway as your test production will be low anyways.
Here's what you need to supplement immediately:
- Vitamin D3: 4,000-5,000 IU daily, take with fats for absorption (with breakfast or dinner)
- Zinc L-carnosine: 75mg daily, 2 hours after meals or before bed for maximum absorption

Source the highest quality you can find, this isn't the place to save money.
Your gut repair depends on bioavailable forms that actually get absorbed and not picking the cheapest formulas you can find.
But here's something most gut protocols completely miss:
*Your gut can't heal in an inflamed environment because It's like trying to rebuild a house while it's still on fire.*
Look, if you're not dealing with obvious stuff like achy joints, brain fog, or gut issues, you might get away with just focusing on the building blocks above.
But if you're one of those people who wakes up stiff, can't think clearly after eating, or your skin looks like a connect-the-dots (can see my childhood trauma in that one haha),
Then your gut is swimming in inflammation and nothing's going to stick until you deal with this first.
Here's what actually works to calm things down:
- Curcumin: 500-1000mg daily, make sure it has black pepper in (low dose) it or it won't absorb
- Boswellia: 300-500mg daily - this is the anti-inflammatory that actually does something
- Black seed oil: 1-2 teaspoons daily - traditional medicine literally calls this "the cure for everything except death"

Take all of these with your fattiest meal so your body can actually use them.
Black seed oil is incredible because it doesn't just put out the fire but it tells your immune system to stop throwing matches at your gut in the first place.
Here's the thing,
you can take all the collagen and fancy gut supplements in the world, but if your gut is still inflamed, it's like trying to paint over rust.
Deal with the inflammation first, then everything else actually works.
This is why you need to be eating the diet layed out for you in the health course and limiting stress through practices such as meditation too.
While your gut is healing, it also needs extra protection from the hostile environment inside your digestive tract.
This is where lactoferrin comes in.
It acts like a protective coating over your damaged gut lining while actively killing harmful bacteria.
It's like putting a temporary tarp over your roof while you're fixing the holes.
If you want some natural alternatives (it literally comes from breast milk and raw milk) or just can't find any high quality take one of these or all preferably:
- Raw milk: 1-2 glasses daily if you can access and tolerate it
- Raw goat's milk: often better tolerated if cow's milk causes issues
- Lactoferrin supplement: 500mg daily, first thing in the morning on empty stomach
- Colostrum: 1-2g daily, also on empty stomach for maximum absorption
- Slippery Elm: 1-2g in water 20m before meals - Creates a "slippery" coating on your intestines so damage can't occur

Raw milk is ideal because it contains lactoferrin in its natural form, plus immunoglobulins and growth factors that directly rebuild gut tissue.
Goat's milk has smaller protein molecules that are easier on damaged guts.
If you can't access either, the supplements work just take them 30 minutes before breakfast for optimal uptake.
Now here's the part most gut protocols miss:
Rebuilding the actual gates between your gut and bloodstream. These tight junctions are like security checkpoints that decide what gets through to your blood.
L- Glutamine is an essential amino acid for gut lining repair take 5000mg powder form mixed with water on an empty stomach.
Quercetin literally reconstructs these junctions.
It's not just anti-inflammatory but it's rebuilding the actual barrier that keeps toxins out of your bloodstream.
Quite optimal for brain health too btw.
You need both food sources and supplementation:
- Onions: eat them daily, raw or cooked - red onions have the highest concentration
- Blueberries: at least a cup per day, frozen works just as well as fresh
- Quercetin supplement: 300-500mg daily, take 30 minutes before meals for best absorption

The combination of food sources plus supplementation creates an amount that can actually rebuild damaged tight junctions.
Studies show quercetin can restore intestinal barrier function within 4-6 WEEKS of consistent use.
And most NPC's are spending years going through treatment after treatment with no results for this very same thing btw.
Here's what's going to happen, and this is important because most people quit right before the breakthrough.
Initially, you might feel slightly worse as your body starts the healing process.
You might feel more tired, have some digestive upset, even feel a bit foggy.
This is your body redirecting energy toward repair.
Remember there is no growth without pain and no joy without rain, oddly philosophical but it's important nonetheless.
Then you'll start noticing the shift.
Less bloating after meals.
Clearer thinking.
Better skin.
Reduced joint stiffness.
Foods that once caused problems become tolerable again.
The real transformation happens when most people report feeling like they have a completely different digestive system.
They can eat foods they haven't touched in years. Their energy is stable all day. Their skin clears up.
Joint pain disappears.
I can't lie the other day I ate some spicy chicken wings and my gut stood there absolutely unfazed so that's a win,
That's the type of stuff your effort gets you instead of insane shits the next day.
Healing a leaky gut isn't complicated, but it absolutely requires consistency.
Your gut lining completely regenerates every 3-5 days, which means you have a fresh opportunity to rebuild it properly with every single meal you eat.
Miss days, and you're essentially starting over.
Keep sowing the seeds and eventually you will notice how good your crop has become,
Sit there and watch impatiently?
You're gonna get frustrated real quick.
This the exact same process your body uses naturally to maintain gut health, just amplified to overcome the damage from modern living.
Every recommendation here is based on how your gut actually heals at the cellular level.
Your gut has been damaged for YEARS,
Give it at least 4-6 weeks of consistent effort, and you'll understand why successful people say fixing their gut was the single most important thing they ever did for their health.`,
  },
  {
    slug: "your-microbiome-is-finished",
    title: "YOUR MICROBIOME IS FINISHED",
    category: "Gut & Microbiome",
    summary: "Break the biofilms, identify what's overgrown, then target it — in the right order.",
    body: `What's one thing that a damaged gut lining also damages?
Your body's own ability to regulate the microbes living inside of your gut.
This means you've got an imbalance in your gut microbiome leading to mood issues, chronic inflammation, and potentially endless digestive problems.
And here's the worst part:
The longer you let these little bastards thrive, the harder they become to kill.
You see, almost everybody in the western world not only has a leaky gut (not you anymore though) but also has what's called dysbiosis:
Basically your gut bacteria have gone completely rogue.
Western medicine's cure for this?
Blast you full of antibiotics that kill off potentially good bacteria too.
It's about as smart as nuking the entirety of Pakistan to kill Bin Laden and forgetting to evacuate the billions of innocent workers that run the country.
But here's what makes it even worse in my eyes:
Antibiotics don't even kill the bacteria that have learned to shield themselves from your body's own antimicrobial peptides.
These smart little fuckers create what are called biofilms, think of them as bacterial safehouses that make them 1000 times more resistant to even the most powerful antibiotics.
It's like they're wearing bulletproof vests while your immune system is throwing pebbles at them.
Imagine an 106lb woman trying to beat the shit out of Mike Tyson, that's how effective it is.
Even if antibiotics did work perfectly, they'd just leave empty real estate for opportunistic bacteria to move in and set up shop.
You'd be back to square one, except now your gut would be even more damaged.
You need a smarter approach.
First, we need to break down these biofilms and pierce their defenses.
You've got two options here, and both work incredibly well and one of them is delicious (can tell which one I prefer).
You can either take NAC on an empty stomach because this stuff literally dissolves the protective shields these bacteria hide behind.
Or if you want to go the natural route, take a spoonful of 500MGO+ Manuka honey with high-quality cranberry extract.
The Manuka honey is fascinating because it's selective in the way it kills the bad guys while actually feeding the good bacteria.
Most people don't realize that not all antimicrobials are created equal.
Now here's why we sealed your leaky gut first, and this is crucial:
If you had killed off all these bacteria while your gut was still leaky, you'd let a massive flood of toxins into your system.
We're talking about more toxins than you've ever experienced before.
This is called a herxheimer reaction, and it can make you feel like absolute death.
But when my coaching clients and people who take my protocols get a herx at worst it's like a mild headache.
I've seen guys try to kill infections with a leaky gut and end up bedridden for weeks.
That's why the order matters so much.
Once you've broken down the biofilms, you need to figure out exactly what type of microbes have taken over your system.
Most people just throw random antimicrobials at the problem and wonder why nothing works.
Here's a simple diagnostic system I've developed that you can do at home:
*If you're dealing with SIBO which is bad bacteria that have migrated up into your small intestine where they don't belong:*
You'll get bloated 1-3 hours after eating, have constant gas, brain fog, and feel full after just a few bites.
Want to test this?
Eat a banana with a slice of bread. If you're bloated and gassy within 2 hours, you've got SIBO.
*Candida is the yeast overgrowth that makes you crave sugar like a crack addict.*
You'll have a white coating on your tongue, random skin rashes, and brain fog that hits hard after eating carbs.
To test this, avoid all sugar and starch for 3 days. If you feel better but have intense cravings, that's candida screaming for its food source.
*Dysbiosis is when the bad bacteria have completely taken over.*
You'll have rotten egg gas that clears out rooms, alternating between diarrhea and constipation, cramping, and mucus in your stool.
Test this by eating scrambled eggs with onions. If you get sulfur gas and cramping within 4 hours, your gut bacteria have gone completely sideways.
*Parasites are the nastiest of all*.
You'll never feel satisfied after eating no matter how much you consume, have unexplained itchiness especially around your backside, alternating bathroom issues, grind your teeth at night, and have dark circles under your eyes.
There's no reliable food test for these, but look for actual worms in your stool, intense itching at night, and teeth grinding while sleeping.
*Other fungal infections beyond candida* will make you react badly to moldy environments, and here's the weird part:
Antifungal foods like garlic and oregano will initially make you feel worse as they start killing off the fungi.
*H. pylori lives in your stomach and creates burning pain on an empty stomach, nausea, loss of appetite, and bad breath.*
The pain usually improves after eating then comes back. Test this by noticing if coffee or alcohol on an empty stomach makes the pain worse, but bread or milk makes it better.
***No matter what you're dealing with, you should probably be running berberine*** - it's the most powerful broad-spectrum antimicrobial I've ever used.
But here's where we get specific with the targeted approach.
*For SIBO*,
You need oregano oil at 200mg to target the hydrogen-producing bacteria in your small intestine, allicin at 300mg because it's the most effective thing against methane producers, ginger extract at 1000mg to restore your migrating motor complex (basically gets your gut moving properly again), and neem at 300mg for additional biofilm disruption.
This combination has over 50% clearance rates.
*For candida*,
Undecylenic acid at 250mg three times daily literally destroys the fungal cell walls - it's more effective than caprylic acid.
Speaking of caprylic acid, take 500mg three times daily as it penetrates fungal membranes FASTER than pharmaceuticals in many human studies.
And here's the key - take betaine HCl 500mg with meals to acidify your gut, because fungi hate acidic environments.
*For dysbiosis*,
Black seed oil at 1000mg is your broad-spectrum antimicrobial that specifically targets pathogenic bacteria, Manuka honey at 20g works as both antimicrobial and prebiotic (make sure it's UMF 15+ grade), and Lactobacillus plantarum at 50 billion CFU to crowd out the bad guys with beneficial bacteria.
*For parasites*,
Tongkat ali at 400mg has specific anti-toxoplasma activity and targets brain parasites, wormwood at 200mg twice daily contains artemisinin compounds that parasites can't handle, clove oil at 100mg twice daily disrupts their entire life cycle by killing both the adults and eggs, and pumpkin seeds at 500mg contain cucurbitacins that traditional medicine has used as dewormers for centuries.
*For H. pylori*,
Mastic gum at 500mg three times daily is specifically designed to kill this bacteria - it's been used as a traditional stomach treatment for ages. Cranberry extract at 1000mg prevents the bacteria from sticking to your stomach lining, and bismuth citrate at 200mg twice daily creates a protective coating while you're killing off the infection.
You only need around 4 weeks maximum to effectively disrupt and kill 99% of these microbes if you're running the right protocols.
And here's what's interesting:
These protocols I've just laid out have been PROVEN in studies by researches from the top universities to be more effective than antibiotics, with zero downside of killing good bacteria.
The pharmaceutical companies don't want you to know this, but nature has already provided us with everything we need to handle these infections.
You just need to know how to use it properly.
Most people bounce from practitioner to practitioner, spending thousands on tests and treatments that don't work.
But if you follow this systematic approach:
Break down biofilms -> Identify the specific problem -> Then target it with the right compounds,
You'll clear infections that have been plaguing you for years.
The key is being systematic about it rather than just throwing supplements at the wall and hoping something sticks.`,
  },
  {
    slug: "top-5-gut-healing-superfoods",
    title: "TOP 5 GUT HEALING SUPERFOODS",
    category: "Gut & Microbiome",
    summary: "Bone broth, grass-fed butter, sardines, goat products and herbs — plus the peptides that finish the job.",
    body: `I'm going to cut through all the BS about superfoods and give you the five foods that will actually heal your gut instead of just making you feel good about your grocery shopping.
Most people think gut healing means eating more vegetables and taking probiotics.
That's like trying to build a house with play-doh and expecting it to withstand a hurricane.
In fact if you're eating lots of veggies from your supermarket you need to re-assess your life choices as you know by now they are full of pesticides.
Your gut lining regenerates every 3-5 days, which means you have a fresh opportunity to either rebuild it properly or keep damaging it with every single meal you eat.
The foods I'm about to show you aren't just foods...
They're literally the raw materials your body uses to construct a healthy gut lining at the cellular level.
**BONE BROTH**, **GELATIN, COLLAGEN, AND SLOW-COOKED MEATS** are basically the same category, and this is where most people's gut healing journey should start.
You need to get this connective tissue for your gut terrain, and here's why...
Can you have a functioning ecosystem if you don't have a proper structure to support it?
Your gut lining is made of the same materials found in bones, cartilage, and connective tissue.
If you're not eating these regularly, you're trying to rebuild your gut with materials it wasn't designed to use.
Slow-cooked meats on the bone cover the most bases, and it's always best to get this from real food rather than supplements.
Stick to ruminant animals like beef, lamb, and bison because their amino acid profiles match what humans need most closely.
Type 1 collagen is the most important for gut healing because it's the primary structural protein in your intestinal lining.
Most collagen supplements are random mixtures that don't specify the type, so you're gambling with your gut health.
Here are the key amino acids you're getting...
*Glycine*, which helps mitigate homocysteine and lowers inflammation throughout your entire body. *Proline,* which is essential for collagen synthesis. *Hydroxyproline*, which you literally cannot make without adequate vitamin C.
One study showed a significant **REDUCTION IN CIRCULATING ENDOTOXINS** when people consumed bone broth regularly.
Endotoxins are basically toxins from bad bacteria that leak through your gut wall and poison your entire system.
You'll also notice incredible benefits for your skin, hair, and joints as a bonus because you're giving your body the building blocks it needs to repair connective tissue everywhere.
People stress about histamine reactions from bone broth, but that's like hiding from the monsters under your bed.
Histamine intolerance is a leaky gut and SIBO issue, and avoiding bone broth just delays your healing time while keeping you stuck in the problem.
If you react badly to bone broth, that's your body telling you your gut is severely damaged and needs this even more.
Start with smaller amounts and work your way up.
**GRASS-FED BUTTER** is next, and this is where people's programming about saturated fat being evil completely falls apart.
Grass-fed butter is *HIGH IN FAT-SOLUBLE VITAMINS* that are hard to find in adequate amounts anywhere else in the modern food supply.
Raw grass-fed butter is absolutely elite if you can get your hands on it, because the pasteurization process destroys many of the beneficial compounds and enzymes.
It's an incredible source of vitamin A in the retinol form, which is what your body actually uses.
Most people are severely deficient in real vitamin A, and that acne, chicken skin, and other skin issues you might be dealing with?
Often that's just vitamin A deficiency showing up on your skin.
Ghee is even better for some people because it's higher in medium-chain fatty acids, which can be easier on the GI tract compared to other short or long-chain fats.
Your damaged gut can process medium-chain fats more efficiently.
Here's what's incredible about ghee...
People with IBD and IBS conditions have major problems producing butyrate, which is the primary fuel for your gut lining cells.
Ghee helps restore butyrate production and protects against leaky gut.
Get this...
Crohn's patients were actually given butyric acid supplements in one study, and 7 out of 10 were fucking CURED from Crohn's disease.
Not managed, not improved... cured.
If you can't tolerate ghee or butter, MCT oil is a good option for getting those medium-chain fatty acids, but you're missing out on the fat-soluble vitamins.
***SARDINES*** are probably the most nutrient-dense food on the planet, and most people avoid them because they're programmed to think they're gross.
They're extremely high in calcium if you eat the bones, and most people are not getting anywhere near enough calcium from their diet.
The modern food supply is severely depleted in minerals.
Eat the fucking bones... you're not a child.
The bones are soft and completely edible, and that's where most of the calcium is concentrated.
Calcium is very important for the GI tract because calcium literally acts like a zipper for those leaky holes in your gut wall.
Without adequate calcium, your tight junctions can't seal properly.
People with leaky gut and damaged digestive systems have a hard time digesting and absorbing fats, so they'll miss out on fat-soluble vitamins.
But they can still absorb the calcium and other minerals from sardines effectively.
You're basically micronutrient maxing with sardines because they contain virtually every nutrient your body needs in highly bioavailable forms.
The omega-3 fatty acids in sardines protect intercellular tight junctions, which are the gates between your gut and bloodstream.
Take sardines regularly and you're basically consuming a tasty health supplement that actually works.
DHA from sardines is super important for joint health, brain function, and reducing inflammation throughout your entire body.
You need to eat these 2-3 times per week minimum.
If you're not doing that, you should be supplementing with high-quality omega-3s, but the real food version is always superior.
**GOAT PRODUCTS** like goat whey, colostrum, and raw goat milk are incredibly underrated for gut healing.
The essential amino acid content in goat products is really great, and the ratios match human needs better than cow products for most people.
Glutathione levels in goat products are massive for gut health because glutathione is your body's master antioxidant and detoxifier.
Most people are severely depleted in glutathione from toxic overload.
The soil quality is generally better where goats graze compared to industrial cattle operations, which means the nutrient density is higher across the board.
Goat products are rich in micronutrients and omega-3s compared to conventional dairy, and here's something interesting...
We recognize the enzymes in goat milk better than cow milk enzymes.
Raw goat milk is incredible for people with sensitive guts because it's naturally homogenized and easier to digest.
The protein molecules are smaller, so your damaged digestive system doesn't have to work as hard to break them down.
Goat dairy also helps with iron status and absorption, which is crucial because many people with gut issues become iron deficient over time.
If you can't find goat products locally, they're worth ordering online because the gut healing benefits are that significant.
**HERBS AND AROMATICS** are the final category, and these aren't just flavor enhancers... they're potent medicine that's been used for thousands of years.
*Parsley* isn't just a garnish...
It helps with bladder infections and supports kidney function while adding vitamin K and folate to your meals.
*Oregano* is a powerful antimicrobial that's been shown to be as effective as antibiotics against certain bacterial strains, but without destroying your beneficial bacteria.
*Thyme* contains compounds that support respiratory health and act as natural preservatives for your food.
*Rosemary* is incredibly soothing to the digestive system and contains compounds that protect your brain from oxidative damage.
*Mint* is amazing for soothing gut inflammation and can actually make other antimicrobials more effective when used together.
*Basil* can be used as a natural pain reliever and contains compounds that support liver detoxification.
*Ginger* is incredible for inflammation and digestive motility. It literally helps move food through your digestive tract more efficiently while reducing inflammation at every step.
*Radishes* are very good for clearing bilirubin, which helps with SIBO and other digestive issues. They're also good for clearing uric acid and supporting connective tissue and collagen production.
The key with herbs is using them fresh when possible and using them generously. Don't just sprinkle a tiny bit for flavor... use therapeutic amounts that actually provide medicinal benefits.
Here's what most people get wrong about gut healing foods...
They try to eat around their problems instead of eating to solve their problems.
These five categories provide everything your gut needs to rebuild itself properly... structural proteins from bone broth and collagen, fat-soluble vitamins from grass-fed butter, minerals and omega-3s from sardines, easily digestible proteins from goat products, and medicinal compounds from herbs.
Most people are eating foods that require a healthy gut to digest properly, then wondering why their gut never heals.
These foods are specifically chosen because they're either easy to digest or they actively support the healing process.
Your gut lining is either being built from high-quality materials or cheap substitutes with every meal you eat.
*The choice is yours, but don't expect premium results from discount inputs.*

# ADVANCED PEPTIDES PROTOCOLS
I've kept my ears close to the streets on this one and heard a lot of you guys are quite interested in peptides.
I've personally seen guys recover from back injuries and be hitting 400lb back squats within 4 weeks.
Some other crazy stuff that would make western doctors call me out saying it's BS because their tiny minds can't fathom it.
When it comes to the gut?
Not just powerful but absolutely game changing if you have any severe damage.
Look, after you've run through the leaky gut protocol and antimicrobial protocol I just laid out for you, your gut is going to be in a much better place.
But if you really want to seal the deal and accelerate the entire process by weeks, this is where peptides come in.
Think of it like this  you've done the construction work, cleared out the infections, now peptides are like having a team of molecular engineers come in and put the finishing touches on everything.
Speaking of antimicrobials, you could technically pin LL-37  a selective antimicrobial that's honestly as powerful as antibiotics but ONLY kills off bad bacterial strains.
But that's not medical advice, I don't want big pharma knocking down my door for putting them out of business.
Here's where most people get completely wrong about peptides, and it's because of all the fear-mongering bullshit you've been fed.
There's a lot of negative talk about peptides and definitely the government trying to scare you away from them.
But here's the funny thing all a peptide is, is a short chain of amino acids.
Yep, you literally consume amino acids in your preworkout or recovery shake, whatever kind of fruity drinks these gym bros are chugging these days.
Absolutely nothing to be scared about.
The toxic dose would require you to take 125g of a peptide, which not only is pretty much impossible but you'd have spent a few grand doing it.
Pretty expensive way to kill yourself if you ask me.
So why aren't they pushing these things in mainstream medicine?
Because in the near future, peptides will most likely make pharmaceuticals extinct  with none of the side effects.
Think about that for a second.
An industry built on managing symptoms with drugs that create more problems suddenly faces compounds that actually heal without the side effects.
Of course they're terrified.
It also makes perfect sense why they're suppressing human studies on peptides when they're clearly incredible for healing tissue damage.
I've seen more than enough real-life cases to know they work better than anything Big Pharma is pushing.
But here's what's interesting:
Your body already makes most of these peptides naturally.
We're just giving you therapeutic doses of what you should be producing anyway.
Now that you're deprogrammed from the government-induced groupthink, let me show you exactly how to use peptides to not only heal your gut but speed up the entire process dramatically.
Bold claim?
Maybe. But I've seen it happen firsthand with someone I was working with for their gut issues.
BPC-157 is literally on the WADA banned list because it's so powerful for recovery it gives athletes an unfair advantage.
KOBE himself used BPC-157 to recover from injuries before it got banned.
If it's good enough for the Black Mamba, it's probably worth your attention.
BPC is actually produced in your gastric juices naturally, so you're not putting some foreign chemical into your body.
You're just amplifying what's already supposed to be there.
Here's what BPC-157 actually does, and this list will probably surprise you:
*It heals leaky gut at the cellular level, improves every single marker of recovery you can measure, works like a nootropic for brain function, prevents inflammation in your blood-brain barrier (which stops toxins from getting into your brain), dramatically improves sleep quality, and when you apply it topically, it can heal injuries directly on your skin.*
I had one guy tell me his chronic shoulder pain disappeared after using BPC topically for two weeks.
Just rubbed it on the area and the inflammation went away completely.
The research on BPC-157 paired with quercetin and butyrate supplements shows it can completely heal a leaky gut.
It's more expensive than the natural approach I laid out, but if you've got the money and want to fast-track everything, this is your shortcut.
It gets really interesting when you start looking at peptide combinations.
GHK-Cu has been shown to repair pretty much every type of tissue in your body.
What's fascinating is these peptides are "smart" they can somehow detect where you need healing most and redirect themselves toward that area.
It's like having molecular repair crews that automatically know which part of your house needs the most work.
GHK-Cu can deactivate inflammatory genes, protect you from bacterial toxins, reverse arthritis and other inflammatory conditions, and help rebuild the basal cells that make up your gut lining.
When you get it, it should be a royal blue color if it's not, you're getting garbage.
This stuff also happens to be a natural cure for male pattern baldness.
Don't mess around with finasteride and destroy your hormones and turn gay just use this instead and actually improve your health while regrowing hair.
Now let me give you the specific peptides that target gut issues directly:
Larazotide acetate reduces gut permeability.
It's like having molecular sealant for your intestinal walls.
Take 0.25mg three times daily with meals for 4 weeks.
KPV is incredible for gut inflammation.
It's like having a fire extinguisher specifically designed for your digestive system.
Use 200mcg twice daily, away from food.
TB-500 handles tissue repair across your entire body.
I actually used this to help someone reverse lung damage but don't tell the NHS I said that.
For gut repair, 2.5mg twice weekly for 4 weeks.
Here's the protocol I recommend, and this is based on actually seeing it work:
Week 1-4: Run your leaky gut healing protocol (from the first module) Week 5-8: Add antimicrobial protocol (from the infections module)
Week 9-12: Finish with BPC-157 at 250mcg twice daily, plus one of the targeted peptides above
This systematic approach creates incredible synergy.
The leaky gut protocol gives your body building blocks, antimicrobials clear infections, and peptides accelerate the final healing phase.
I've seen people go from severe digestive issues to eating pizza and drinking beer with zero problems in 12 weeks using this exact approach.
Compare that to years of conventional treatment that never addresses root causes.
But here's the critical part most people mess up - quality.
You're dealing with delicate molecular structures that get destroyed by heat, light, or poor manufacturing.
This isn't the place to bargain hunt on price.
Bad peptides aren't just useless but they can actually be harmful.
Look for companies that provide third-party testing certificates, proper refrigerated storage, and have been around for more than five minutes.
The peptide space attracts tons of fly-by-night operators selling garbage powder.
I personally recommend LVLUP Health because their quality is consistently good, but do your own research.
If the price seems too good to be true, it probably is.
Most peptides you cycle 5 days on, 2 days off.
These are precision tools, not daily vitamins.
You use them strategically to accelerate healing, then you let your body maintain the improvements naturally.
The timing matters too.
Take BPC-157 on an empty stomach, 30 minutes before meals.
For the others, follow the specific timing I mentioned above. Your body has natural rhythms, and working with them amplifies the effects.
Here's something most people don't realize:
there are over 9,000 different peptides in your body, and we're discovering new beneficial ones constantly. We're still in the early stages of understanding what's possible here.
The future of healing isn't going to be about managing symptoms with drugs that create side effects.
*It's about giving your body the exact molecular tools it needs to repair itself properly.*
This is like having side-effect-free performance enhancers that you can use whenever you need accelerated healing.`,
  },
  {
    slug: "diet-and-lifestyle",
    title: "DIET AND LIFESTYLE",
    category: "Gut & Microbiome",
    summary: "Prep carbs right, cut the hidden toxins, chew properly, and lower the total toxic load.",
    body: `I'm assuming you're following something close to what's laid out in the health course,
Mainly meat, eggs, and the good stuff.
But here's where most people get it wrong: they think carbs are the enemy when really it's about quality and timing.
Don't be afraid to add in some proper carbs like potatoes, sweet potatoes, oats, and rice.
*But here's the key:*
You need to prepare them right.
Rice, for example, is loaded with arsenic and other nasties, most guys who know how bad this is end up washing that rice like their life depends on it.
Here's how you actually do it:
rinse your rice in RO water at least 5-6 times until the water runs completely clear, then soak it for 30 minutes before cooking.
This removes up to 80% of the arsenic and other toxins.
Most people just throw it straight in the pot and wonder why they feel like garbage after eating it.
But food is only half the battle.
Your gut is getting hammered from directions you probably haven't even considered.
Think about where toxins are sneaking into your system every single day:
- Washing up liquid residue on your plates
- Laundry detergent chemicals in your clothes that absorb through your skin,
- Unfiltered water that's basically a chemical cocktail,
- Stagnant air in your house,
- Synthetic fragrances that disrupt your hormones,
- Non-organic fruits covered in pesticides.

The gut-destroyers you absolutely need to eliminate are alcohol and artificial sweeteners.
I'm not being dramatic here these cause massive inflammation and literally punch holes in your gut lining.
If you're doing all the healing work from the previous module then sabotaging it with a few drinks or diet sodas, you're basically setting your progress on fire.
Something interesting is if you're planning a vacation you can run a protocol of BPC 157 before and after to negate and reverse the damage of alcohol,
But don't tell anyone I told you that.
Here's something most people miss:
Estrogen is terrible for your gut health.
High estrogen levels slow down gut motility and increase inflammation leading to more leaky gut and funnily enough more estrogen lower test etc.
One of the cheapest ways to lower your estrogen-to-testosterone ratio is eating white button mushrooms daily.
Sounds random, but they contain compounds that literally block estrogen production.
Now let's talk about eating properly, because most people eat like they're in a race against time.
First rule: no water with meals.
I see this constantly and it's one of the worst things you can do for digestion.
Water dilutes your stomach acid, which means your food sits there fermenting instead of being properly broken down.
Keep water separate from meals by at least 15 minutes before and after eating.
When you sit down to eat, that's all you're doing.
No phone, no TV, no distractions.
Just you and your food, preferably outside in the sun if possible.
Your nervous system needs to be in rest-and-digest mode, not fight-or-flight and I actually like to do a bit of meditation before meals where and if possible for this reason.
*And then there's chewing.*
Most people chew their food maybe 5-10 times before swallowing.
That's not even close to enough.
You should be chewing each bite 20-30 times until it's basically liquid.
This isn't just about digestion - improperly chewed food creates massive stress further down your digestive tract and feeds the wrong bacteria in your gut.
Here's where we get into the advanced stuff that most gut protocols completely ignore or they charge ridiculous money for:
Your body accumulates toxins faster than it can eliminate them, especially if your liver and lymphatic system aren't functioning optimally.
Taking activated charcoal every few days on an empty stomach is one of the cheapest and most effective ways to bind toxins and pull them out of your system.
Just make sure to take it away from supplements and medications because it'll absorb those too.
Your lymphatic system is basically your body's drainage network, but unlike your circulatory system, it doesn't have a pump.
It relies on movement to function.
This is why exercise isn't just about building muscle but it's about moving lymphatic fluid and helping your body detox.
Even just bouncing on a mini trampoline for 10 minutes gets things moving (shout out to Alex Hormozi for putting that idea into my head).
Sweating is another massively underrated detox pathway.
Your skin is your largest organ and one of your primary elimination routes.
Whether it's sauna, hot baths (the best), or just working up a sweat through exercise, you're literally sweating out toxins that would otherwise recirculate and damage your gut.
Your liver is working overtime to process all the toxins in modern life, and most people's livers are completely overwhelmed.
Castor oil packs on your liver 2-3 times per week help stimulate bile flow and liver detoxification.
Just soak a cloth (natural fibres unless you want microplastics) in castor oil, place it over your liver area (right side under your ribs), cover with plastic wrap and a hot water bottle, and lie there for 30-45 minutes.
If you're dealing with sluggish digestion or feel heavy after meals, your bile production might be compromised.
This is where TUDCA or Ox bile supplements come in.
Take 250-500mg with fatty meals to help break down fats and improve nutrient absorption.
Your gut can't heal if you're not absorbing the nutrients you're giving it.
Here's the thing about all this lifestyle stuff:
it's not about being perfect. It's about reducing the total toxic load on your system so your gut actually has a chance to heal instead of constantly fighting fires.
Every toxin you eliminate, every meal you eat mindfully, every time you move your body and sweat it all adds up.
Your gut is either healing or being damaged with every choice you make, it's either progression or regression, either growth or death.
The guys who get the best results are the ones who understand that healing isn't just about taking the right supplements.
It's about creating an environment where your body can actually do what it's designed to do:
Repair itself.
Most people want a magic pill, but the reality is that your lifestyle is either supporting your gut healing or sabotaging it.
There's no middle ground here.`,
  },

  // ─── Diet & Food ───────────────────────────────────────────────────────────
  {
    slug: "only-eat-these-things",
    title: "ONLY EAT THESE THINGS.",
    category: "Diet & Food",
    summary: "The one-ingredient human diet: fatty meat, eggs, raw dairy, nuts, avocados.",
    body: `# YOUR NORMAL MEALS
NOTHING BUT THESE THINGS SHOULD GO INTO YOUR MOUTH.
- FRUIT / HONEY AFTER WORKOUT AS FUEL (under 50g carbs a day if you are work focused)
- PEANUT BUTTER / ALMOND BUTTER (no bs ingredient)
- FUCK TONE OF FATTY MEAT (20% FAT BEEF, STEAK, CHICKEN THIGHS)
- FUCK TONE OF EGGS (ATLEAST 4 A DAY, OPTIMAL IS 10 A DAY)
- CHEESE (NO BULLSHIT CHEESE, ONLY 1 INGREDIENT REAL MATURE CHEESE)
- BUTTER (NO SEED OIL SPREADABLE SHIT)
- NUTS (ANY NUTS)
- KEFIR, RAW MILK, ANY RAW DAIRY.
- AVOCADOS.

# THIS IS THE HUMAN DIET.
this is combining biohacking + bulking.
and no you don't need vegetables lol.
vegetables actually fuck up your health.
if you want to know more.
[WATCH THIS VIDEO.](https://www.youtube.com/watch?v=j1cqNDDG4aA&t=238s&ab_channel=LowCarbDownUnder)
the guy looks like he's proper high test, so you should trust him.

# EAT AS MUCH AS YOU CAN.
as long as you keep it in the healthy food bracket.
your body will tell you when to actually stop.
when it's had enough.
but ONLY with real food that has no sugar.

# MEAT CAN TASTE LIKE SHIT SOMETIMES.
but why is that?
it's because our gut and brain communicates.
it tells us "we need these nutrients rn, let's eat more"
and when it tastes like shit it says "we don't need these nutrients, stop eating"
THAT IS THE BEAUTY OF REAL FOOD.

# SUGAR DOESN'T MAKE YOU STOP.
when you ingest sugar.
it's not about "when you're full"
that's not when you stop.
it's simply about when you think like you're having too much.
you see, sugar actually increases the levels of dopamine in your brain.
so your stomach doesn't care if it's full, it's still going to find a way to eat.
and keep stuffing, and keep stuffing.
it blocks the hormone that actually says "let's stop eating, we're full"

# THIS IS WHY PEOPLE GET FAT ON A BULK.
they think "oh I need to eat a lot"
then they eat sugar.
then they eat more and more of that sugar.
they need to eat until they feel full on a bulk
BUT THE PROBLEM IS.
sugar blocks that signal of telling you when you are full.
which means people will get fat.
it's useless.

# EAT REAL HIGH CALORIE FOOD.
# AND EAT AS MUCH AS YOU CAN FROM IT.
THINGS HIGH IN FAT.
- FATTY MEATS
- PEANUT BUTTER
- BUTTER

everything that I listed at the start.
- FRUIT / HONEY AFTER WORKOUT AS FUEL (under 50g carbs a day if you are work focused)
- PEANUT BUTTER / ALMOND BUTTER (no bs ingredient)
- FUCK TONE OF FATTY MEAT (20% FAT BEEF, STEAK, CHICKEN THIGHS)
- FUCK TONE OF EGGS (ATLEAST 4 A DAY, OPTIMAL IS 10 A DAY)
- CHEESE (NO BULLSHIT CHEESE, ONLY 1 INGREDIENT REAL MATURE CHEESE)
- BUTTER (NO SEED OIL SPREADABLE SHIT)
- NUTS (ANY NUTS)
- KEFIR, RAW MILK, ANY RAW DAIRY.
- AVOCADOS.

and you will inevitably gain weight.

# ACTIONABLE STEP.
- CREATE YOUR OWN DIET BLUEPRINT
- WHAT ARE YOU GOING TO EAT EVERY DAY FROM NOW ON?
- USE THE LIST ABOVE TO HELP.`,
  },
  {
    slug: "ingredients-that-tank-your-testosterone",
    title: "Ingredients That Tank Your Testosterone.",
    category: "Diet & Food",
    summary: "Artificial sweeteners, refined sugars and grains — and the easiest way to fix your diet.",
    body: `**Artificial Sweeteners**
- Aspartame (sometimes under the name Nutrasweet)
- Acesulfame-K
- Neotame

# Refined sugars
- Avoid all forms of refined sugars (i.e. sugars found in drinks, sweets and desserts)

# Grains
- All forms of grains should be avoided whether it's bread, pasta, cornflakes, oatmeal, you name it.

Grains are well-known for causing inflammations within the gut because of their gluten and phytic acid content.
this advice of "get rid of grains" is very controversial as it is on top of the food pyramid.
but if you use common sense, nobody "normal" has testosterone that can even compete with mine.
and coincidentally, I do the things that "normal" people find unhealthy, which we will get into soon.
the "advice" you get from your normal doctors and teachers is pure bullshit.
listen to a teacher that has the result you actually want.

# The Easiest Way To Fix Your Diet.
you should simply only eat foods that have one ingredient.
for example :
red meat has one ingredient.
banana has one ingredient.
etc...
and you should only eat things that humans have been designed to eat.
if it does not grow from the ground, or come from an animal, you should not consume it as it is made in a manmade human lab...
companies pay experts millions to split test certain ingredients in foods to wire it as most addictive, this is not natural and will tank your testosterone.
do not worry too much about diet... we will go through an optimal day of eating soon.
sit back and take notes.`,
  },
  {
    slug: "the-fats-and-oils-you-should-use",
    title: "The Fats And Oils You Should Use.",
    category: "Diet & Food",
    summary: "Grass-fed butter, coconut oil, beef tallow — high smoke points, no seed oils.",
    body: `The fats and oils you SHOULD use.
- Grass-fed, raw milk butter (note, if you do not have grass fed, normal is good.)
- Organic, cold-pressed coconut oil.
- Beef fat (tallow)

something like olive oil should be avoided for frying as it does not have a high smoke point, meaning that when they are heated up to the max, they actually distribute harsh chemicals that most likely lower your testosterone and mess up your general health.
however, olive oils are good to add onto your meals.
and also not to mention, A LOT of olive oils are actually cut with seed oils.
if you check your olive oil at the back, if it says that it originated from more than one country.
it is likely to be cut with some type of seed oil.
all in all, I would stick to animal fats since that's what we have used from the beginning of time.
and also, these that I have listed have a high smoke point, which means they can fry without distributing harsh chemicals.
you can get these oils from your local shops, or even online places like amazon.`,
  },
  {
    slug: "common-mistakes-to-be-made",
    title: "Common Mistakes To Be Made.",
    category: "Diet & Food",
    summary: "Fish, chicken, eggs, grains, vegetables and salt — the traps to avoid.",
    body: `# I DON'T Suggest Eating Too Much Fish.
since fish nowadays contains a lot of microplastics, eating fish does you more harm than good.

# DO NOT Eat Too Much Chicken.
Chicken is very high in the unsaturated omega-6 fats found in seed oils, and seed oils are very bad for you because of these high amounts of omega-6 fatty acids.
if you love chicken and want to eat it, you should get organic ones that are not fed soy.

# Make Sure That The Eggs You Buy Are Free Range Or Pasture-raised.
The chickens should NOT be fed corn and soy, because feeding chickens corn and soy make their eggs high in omega-6 fatty acids which are inflammatory.
I personally will eat eggs, but not chicken, but it's your choice.

# Like I Said Before, I'll Say It Again: Do Not Eat Grains.
So no bread, no pasta, no form of dough.

# Do Not Eat Vegetables Unless These Vegetables Are Organic And/Or Fermented.
this is the advice that shocks a lot of people, but I recommend not eating any vegetables.
Nowadays, a lot of pesticides are sprayed on vegetables, and even if they are not.
In addition, vegetables contain anti- nutrients that prevent your body from absorbing vitamins and minerals and also cause chronic inflammation in your stomach.
Fermenting vegetables ensures that these anti- nutrients largely break down.
something like sauerkrat is an example of a good vegetable which is fermented, meaning all of the anti nutrients are not there.
if you are still not sure about vegetables being bad for you.
[you can watch this video.](https://www.youtube.com/watch?v=j1cqNDDG4aA)

# Do Not Use Table Salt.
table salt contains no minerals at all while sea salt such as Himalayan and Celtic sea salt contain more than 80 minerals that are essential.
salt is not bad for you, it was actually treasured in rome back in the day.
the only salt that is bad for you is table salt, you should never use it.

# FINAL POINT.
You can occasionally eat boiled potatoes, sweet potatoes or white rice, HOWEVER do not put it into your main daily diet.
Try to get your carbohydrates from`,
  },
  {
    slug: "dos-and-donts-with-raw-milk",
    title: "Do/Don'ts With Raw Milk.",
    category: "Diet & Food",
    summary: "Never drink it cold, and how much to drink per day.",
    body: `# Do Not Drink It Cold.
leave it outside for a couple hours, do it like they did it back in the day, they did not have fridges.
personally, i'd leave it out for only about an hour because time is precious, but just don't do it straight out the fridge.

# Amount To Drink.
PER DAY 1L is perfect amount, i wouldn't go over 2L`,
  },
  {
    slug: "the-importance-of-sea-salt",
    title: "The Importance Of Sea Salt/Avoiding Table Salt.",
    category: "Diet & Food",
    summary: "Sea salt carries 80+ essential minerals. Table salt carries none.",
    body: `![Sea salt vs table salt](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/4d7c09c2530f4ac48990cafdd8b84cb959d8ab06789d44008b363591340d718d)
Do not use table salt, table salt contains no minerals at all while sea salt such as Himalayan and Celtic sea salt contain more than 80 minerals that are essential.
Your body NEEDS these micronutrients and being deficient in even 1 micronutrients such as zinc, your testosterone could be lowered by as much as 300%.
So imagine being deficient in many other minerals besides zinc, such as magnesium, selenium, boron, etc.
Yeah, your testosterone will get DESTROYED.
cover your food with sea salt, don't be shy.
but avoid table salt at all costs.`,
  },
  {
    slug: "nazis-put-fluoride-in-water",
    title: "Nazi's Put Fluoride In Water.",
    category: "Diet & Food",
    summary: "On fluoride in the water supply.",
    body: `enough said, simple google search`,
  },

  // ─── The Food Deep-Dive (FOOD subpages) ────────────────────────────────────
  {
    slug: "never-frozen-meat",
    title: "Never Frozen Meat.",
    category: "The Food Deep-Dive",
    summary: "Meat must always be fresh — frozen is for survival situations only.",
    body: `**Meat**
Meat must always be fresh.
Frozen meat is not acceptable unless you are in a survival starvation situation.
If you already have a freezer full of it, sorry, but your money is already wasted.
I recommend leaving it for emergencies or selling it to someone else, that way you can actually make progress with your health by eating fresh meat.
also, It is fine to eat conventional meat from the grocery store.`,
  },
  {
    slug: "beef",
    title: "Beef",
    category: "The Food Deep-Dive",
    summary: "Buy fresh-cut butcher meat, not vacuum-sealed packaged brands.",
    body: `Of course it is preferable to have grass fed meat as there are more nutrients, but it doesn't have to be grass fed for muscle meats.
Just make sure the meat is fresh. You only want meat from a grocery store when there is a butcher at the store. The store will have a deal with a farm and they will get sections of the animal every week that they cut up fresh in the back. If you ask if it is fresh and they say is fresh, there's a 99% chance that it actually is fresh. It is very rare where they lie or don't know. don't buy the pre-packaged meat that comes from other locations, only buy the stuff cut up and wrapped in the back of the store, the stuff where it's on that paper tray thing with the plastic wrap.
Not the vacuum sealed packaged branded meats. I suspect that the vacuum sealed meats have chemicals in them because they are produced where nobody can see, so they can do whatever they want without anyone knowing.
They can easily and legally add chemicals, but the butchers at the store don't care to. The butcher after slaughtering, before it is even sent to the grocery store might spray citric acid on the outside of the carcass, but it doesn't get onto the individual cuts.
The real concern is when they clean the tables and don't rinse them off all the way. Some places with higher regulations like California might deliberately put chemicals on meat, so if you are concerned, you ask the butcher to cut you a fresh section but to rinse the table and their knife with water before they cut it. You watch them do it, or you ask for a piece of meat still in the big packaging from the cooler and just buy the whole thing, like a 5-10 pound cut
(P.S if you can only get packaged meat, it's still the second best thing, don't stress too much)`,
  },
  {
    slug: "chicken",
    title: "Chicken.",
    category: "The Food Deep-Dive",
    summary: "Pasture-raised, no soy — but 9/10 times, just switch to beef.",
    body: `Preferably it is fed no soy and is non-gmo.
You want the chicken to at least be pastured raised. Free-range can still be locked in a barn and have hundreds of chickens that have access to a very tiny space outside. Pasture raised means they are mainly outdoors. Most whole foods have a pasture raised chicken source.
But 9/10 times just don't eat chicken, switch to beef.`,
  },
  {
    slug: "raw-dairy",
    title: "Raw Dairy",
    category: "The Food Deep-Dive",
    summary: "Raw goat's milk > raw cow's milk. Never drink homogenised milk.",
    body: `**Goat Milk**
Raw goat's milk > Raw cow's milk
Don't get me wrong raw cow's milk is an amazing food, but goat's milk is truly on another level, why?
🧬 Higher Vitamin C content
🦴 Higher lactoferrin content
🔑 Better amino acid balance
💊 More Inositol
🍼 Resembles breast milk more
the GOAT 🐐
but raw cows milk does taste better imo.
either way, both are amazing.

**Dairy**
Hopefully you live in a country with easy accessibility. If you don't, you will need to work very hard to find a farm, start your own farm, or move to another country. If you have enough people in one area desiring raw foods, you could contract with a farmer to produce specifically for you guys. All the members together could even invest in a farm,
Start off by using the Online websites and have a look where to buy raw dairy.
(if you do not have access to raw dairy, you can buy parmigiano reggiano cheese which you can find in any shop and is made from raw cows milk)
DO NOT DRINK HOMOGENISED MILK, IT WILL INCREASE ESTROGEN.`,
  },
  {
    slug: "honey",
    title: "Honey.",
    category: "The Food Deep-Dive",
    summary: "Real raw honey is never heated above 93°F and the bees are only fed honey.",
    body: `**Honey**
Honey must never be heated above 93 F degrees, and the bees cannot be fed anything but honey. Lots of beekeepers feed them sugar or corn syrup in the off season.
It seems like most do, They'll argue and say it is fine, but it is not. Many will also argue with you about the temperatures.
Honey can be heated to high temperatures and still legally be labelled as raw. Many brands claim gentle heating like 120 degrees which would burn you. You can ask them if the honey is ever heated and they'll say no it's not heated it is raw. But then they'll say they actually warm it to pour it.
Then you can ask how hot and a lot of them will say 100 F degrees, "not hot enough to damage anything".
Bullshit, the honey is already ruined.
(P.S you can look at the back of store bought "Raw" honeys and check.)
If you can get local honey even better, some farm shops have them.`,
  },
  {
    slug: "red-meat",
    title: "Red meat",
    category: "The Food Deep-Dive",
    summary: "The main part of the diet — and the food-combining rules that let it heal you.",
    body: `**Red meat should be the main part of diet.**
Increases energy. Builds glands, muscle, and hormones.
Do not mix fruit and honey with red meat, you can use maple syrup, pineapple and papaya. It will convert all the protein into fuel and you won't heal with that meal. Remember, you want the fat to be the fuel, not the protein converted into protein-sugar.
the reason it converts into protein sugar is because you are mixing alkaline foods with acidic foods.
red meat is acidic and so is pineapple, papaya and maple syrup, meaning they can be mixed and it will not turn into protein sugar.
Do not mix sauce with red meat meals for longer than 3 hours. It will convert all the protein to fuel which will not heal the body. The fat should be fuel and the protein should heal the body.
Red meat too close to bedtime may prevent you from being able to sleep. It is stimulating.`,
  },
  {
    slug: "water",
    title: "Water.",
    category: "The Food Deep-Dive",
    summary: "Naturally carbonated mineral water is superior — here's why.",
    body: `**CARBONATED WATER IS SUPERIOR.**
Over the years, it has been shown that the co2 found in carbonated water is capable of lowering histamine, improving blood flow, and increasing cellular energy, all of which are things that in fact can alleviate nervousness and low mood. Natural spring water also tends to be high in magnesium which helps to increase GABA, the calming neurotransmitter. C02 has also been shown to increase stomach acid and speed up gastric emptying
![](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/221eba68eee344f98445a508f3a298a6dcaafe04418349168fd7f130c012c2a3-md.png)
![](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/779f3e5d21cc4e52a42579a0c61008445a7633b7b9294be3a57eac8849e4336c-md.png)
![](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/e630f32a723345d5a29b57fc7f6ade3adf5a1c1fe2eb49969cd7e845b3ad4fe9-md.png)
You want naturally carbonated mineral water. If it doesn't say natural then it is synthetic carbonation. The reason we want it to be carbonated is because it passes the inspections without adding any chemicals. They add chemicals to all the other waters to lower the bacteria so it will pass the bacterial inspections. The carbonation is anti-bacterial naturally, but it won't affect the bacteria in our body so it is no concern for us to consume that.
There are local springs that may be good for you to access and there are websites that help you find them.
or you can get reverse osmosis water which you need to put electrolytes in because the osmosis filtration simple removes everything from the water.`,
  },
  {
    slug: "a-rule-of-thumb",
    title: "A RULE OF THUMB.",
    category: "The Food Deep-Dive",
    summary: "Do not mix alkaline foods with acidic foods.",
    body: `do not mix alkaline foods with acidic foods.
this might lead to things like farting which is a sign of indigestion.`,
  },
  {
    slug: "pineapple-for-bones",
    title: "Pineapple for Bones",
    category: "The Food Deep-Dive",
    summary: "Pineapple stimulates bone regeneration and pairs perfectly with red meat.",
    body: `**Pineapple for Bones**
Helps digestion primarily protein, but also fats. Able to eat with red meat. Helps build bones. Breaks down lymphatic congestion.
pineapple helps to heal and regenerate bones.
If you've ever seen under a microscope, bones have a web system that grows out and then it fills in. Pineapple for some reason stimulates this.
Perfect food combination.
Raw red meat with pineapple , doesn't have to be raw if you're not eating raw foods yet.
Cooked rare steak or burger is fine too.`,
  },
  {
    slug: "when-you-eat-beef-and-rice",
    title: "When You Eat Beef + Rice.",
    category: "The Food Deep-Dive",
    summary: "How to prep beef and rice the right way for energy and hydration.",
    body: `as mentioned in the testosterone course, your main source of fuel should be from fruits and honey.
but once in a while it is fine to have boiled potatoes and white rice.
also, this will help your gym performance.
but grains DO reduce your brain function, it is better to have fruits if you are focused on business.
so here's how you should make it.
![](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/64e016759d784887b2976cc941ed6654093850278b484c5dba5ae84d5893cecc-md.jpg)
![](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/46c114387ef64c7abf5e27adfba3ac1e29ee12b1461647308dae3da6fd84093f-md.jpg)
**Beef and rice**
This is how i prefer to eat cooked ground beef with rice
Tried many versions of it like just plain rice and chopped ground beef in pan which was always super dehydrating and made me just drink tons of water
How i make it
200g of raw rice i rinse it under water atleast 5 times very well then i add 400ml of boiling water in stainless steel bowl where rice is, make sure that you cook rice in stainless steel and not rice cookers that are coated with non stick stuff, i did it and its big mistake
300g of fatty ground beef
I split it in 2 burger patties,for seasoning only use salt,u dont need bunch of toxic seasoning,
quality cuts of meat will taste good no matter what
And make sure burger is rare inside, never over cook it.
Use cast iron or stainless steel pan and cover it with animal fat like pork lard or beef tallow,thats best for cooking it has high smoke point
And last, separate yolks from whites and add it to rice on top, i like to add 5 egg yolks
This meal should make you hydrated and full of energy.`,
  },

  // ─── Biohacking (Biohacking subpages) ──────────────────────────────────────
  {
    slug: "your-vessel",
    title: "YOUR VESSEL.",
    category: "Biohacking",
    summary: "Your body is the home you live in 24/7. Take care of the vessel first.",
    body: `we all have vessels.
vessels are simply the thing we live in.
our bodies.

# WE ARE LIVING INSIDE OUR VESSEL 24/7.
every time you look in the mirror.
you either are proud...
or have a little feeling of shame.
there's no inbetween.
and there's no getting away from it.
because you are ALWAYS...
in your vessel.
remember that.

# SO WHERE DO YOU WANT TO LIVE IN?
most people don't even know how good they can feel.
because they're not metabolically flexible.
- they have brain fog.
- they wake up tired.
- they don't even want to work.
- they are stiff.
- no confidence.

MOST PEOPLE ARE SO FOCUSED ON LIVING IN BIG HOUSES, AND FANCY CARS.
but they don't even take care of their real home, the place they live in all the time.
their temple, the vessel.

# A NON BIOHACKED VESSEL.
this is horrible for an entrepreneur, and even just normal people.
why do you think every successful person will tell you to focus on health?
without health.
you cannot achieve success.
without health.
there is no such thing as success.

# AND NOT TO MENTION.
GETTING RICH IS WAY HARDER
- low energy 24/7.
- messed up serotonin (mood regulation)
- increased stress
- increased anxiety

we already know.
we need to dedicate EVERY part of our life to one mission.
of getting rich.
and this is just one of them.`,
  },
  {
    slug: "there-is-no-overnight-process",
    title: "THERE IS NO OVERNIGHT PROCESS.",
    category: "Biohacking",
    summary: "A biohacked body cannot be bought, borrowed or fast-tracked — only earned.",
    body: `this is the last warning I just want to give you.
you can actually see I care about you understanding this.
you need to know these things before going into it.

# THIS TAKES TIME.
this requires a life changing commitment.
but you're ready for that aren't you?
you said you'd sacrifice everything for success.

# MONEY CANNOT BUY A BIOHACKED BODY.
it cannot be bought.
it cannot be borrowed.
it cannot be inherited.
it cannot be fast tracked.
THE ONLY WAY TO KEEP IT.
IS THROUGH CONSTANT HARD WORK.
otherwise, it will be lost.
which will convey :
- respect
- discipline
- passion
- superiority.

# THE CORRECT MINDSET.
## THE STUDENTS MINDSET.
every person who is successful, is always learning.
understand that you are learning this topic, and go into this with an open mind.

# IT TAKES ONE SINGLE STEP.
every single journey, the biggest journeys.
they all can be traced back to one step at a time.
no matter how small the steps are.
that is what it always comes back to .
ALWAYS REMEMBER.
no matter how small the steps may feel.
progress.
is.
progress.

# IF YOU DO NOT QUIT, FAILURE IS IMPOSSIBLE.
the only way to fail with anything in life.
is to quit.
if you put your mind to ANYTHING for a long enough time.
you will reach success.
100% of the time.
this is the key to success.
this is the strangest secret in the world.
this is a cheat code.

# THIS WILL NOT BE EASY.
you cannot change yourself.
unless you kill your old version first.
which will be hard.
NOTHING IN THIS LIFE CAN BE ACHIEVED.
without hardship.
the reason these things like :
- money
- a biohacked vessel, a good body.
- confidence

the reason they are so wanted.
is because it takes hardship.
it is rare, because not many are willing to go through hardship.
**but you're different, aren't you?**
**you will put the work in.**
**that's the last promise I want you to make before going into this.**
you got that?`,
  },
  {
    slug: "food-is-fuel-energy",
    title: "FOOD IS FUEL/ENERGY.",
    category: "Biohacking",
    summary: "Your body is a supercar. Stop seeing food as pleasure — see it as fuel.",
    body: `as you probably have heard...
the 1st law of energy tells us this :
"energy cannot be created or destroyed, it can only be morphed from one form to another."

# THIS ALSO APPLIES TO FOOD.
when we eat anything.
our body takes out the energy from the food we eat.
and uses that for a whole bunch of body functions.
this is why certain foods are healthy, and some aren't.
they contain nutrients.
and those nutrients are extracted from the food, and used in our body.
but most foods people eat literally contains things that our bodies want to fight.
and a lack of nutrients.

# FOOD IS FUEL.
your body is a car.
and what would you rather run on?
1. HIGH OCTANE POWERFUL DIESEL.
2. VEGETABLE OIL.

the answer is clear.

# OUR BODIES ARE SUPERCARS.
YOUR CAR CAN BE AMAZING.
your car can have expert craftsmanship, top notch parts.
every one of us...
from birth, we was born with the best car we can get.

# BUT ONLY SOME MAINTAIN THEIR CARS.
only some took great care of it.
replaced the wheels.
gave it the right fuel.
which means...
IT WILL BEAT ALL OTHER CARS IN A DRAG RACE.

# THE QUALITY OF YOUR INPUTS REFLECT THE QUALITY OF YOUR OUTPUTS.
we're ambitious you already know that, we want to race as fast as possible.
and it's not going to work without fuelling your vessel right.
the thing that you live in 24/7.
the thing that you work from.

# FOOD WAS NOT MADE FOR PLEASURE.
food is now seen as pleasure by the modern day people
it's seen as a way to get away from your real problems.
and it works like a charm.
where you can be lost in the taste of something sweet, something nice.
and you don't have to worry about your real world problems.

# I DID THIS WITH FRUIT.
this goes deep right.
I would never go back to eating junk, because I know how bad that is for me.
but I used to do this with fruit.
because fruit is sweet, I could eat a lot of it.
so I would just eat, eat, eat.
and the dangerous thing about it was?
I was still seen as healthy by the people around me.
BUT I HAD A COPE.
I could eat as much fruit as I want, still be seen as healthy.
but it doesn't hide the intention behind the eating.
eating just to get away from your real world problems.
it was the same intention, just masked.
it tastes good...

## BUT WHEN THE TASTE FINISHES...
you're back to facing your real problems.
the reality.
so what do you do ?
you get more and more food.
but in the back of your mind, that parasite stays there.
knowing that the food is going to end, and you'll have to go to face your real problems.

# STOP SEEING FOOD AS PLEASURE OR AS AN ESCAPE.
# SEE IT AS FUEL.
# YOU NEED A DESTINATION TO FUEL IT TOWARDS.`,
  },
  {
    slug: "the-food-pyramid-propaganda",
    title: "THE FOOD PYRAMID PROPAGANDA.",
    category: "Biohacking",
    summary: "Why the food pyramid you were taught is a road to mediocrity, not health.",
    body: `**THE "HEALTHY" FOOD PYRAMID.**

# THE FOOD PYRAMID PROPAGANDA.
we're about to dive in to a controversial topic.
so I hope you're ready bro, ik you are.
it's the controversial topic of...

# FAKE BELIEFS OF DIET.
now, first...
let's dissect the so called "health-guide" that we've had since our childhood.
I remember in year 7, start of secondary, in food technology.
this is the first thing they showed us... this propaganda.

# THE FOOD PYRAMID.
## THIS IS A KIDS PYRAMID BTW.
It might look harmless at first, nothing wrong with it.
other than the cereals and seed oils they're recommending.
but it's a colourful array of foods.
that are supposed to guide us to "health"
**but the thing is....**

# it's more like a road to mediocrity.
**it's not a road to becoming a king.**
becoming superior.
do you think a ling is eating coco pops and bread?
or is he eating a big juicy steak?
I can't imagine a king going to aldi, and buying a 10kg bag of basmati rice, it's not going to happen.

# THE SCHOOL SYSTEM
this has conditioned us to believe the food pyramid is like a "one size fits all"
which couldn't be further from the truth.
BUT THEY WILL SERVE YOU BURGERS, FRIES, SEED OILS.
every fucking day.

# a 3 course meal of "health"
in my school, every morning it was routine to get a slice of pizza as "breakfast"
then at breaktime, you'd get a waffle LOADED with sugar, which tasted so good.
good way of getting the kids addicted.
then lunch, a burger, with a cookie.
and no one thought anything about it.
no parents are concerned for their child, because even they are brainwashed.
it's fucked bro.
and you already know.
**YOU SEE WHAT THE 99% DO, AND YOU DO THE OPPOSITE.**
this is how you really win.
that was the kids food pyramid, let's look at the adult.

# THE ADULT FOOD PYRAMID.
# 6-11 SERVINGS OF GRAINS.
that is a fucking colossal amount
especially when grains contain gluten which we talk about later...
"vegetarian meat substitutes"
all of these things...
they're in the same category as pies, pastry, biscuits, cakes.
what's up with that?

# WHAT DO GRAINS DO TO YOU?
- OBESITY
- INFLAMMATION
- INSULIN RESISTANCE.

and more things which we're going to cover in a later module.
which btw...
inflammation.
**that's the times where you lose the ability to think...**
the times where you eat a meal, and you want to go sleep straight after.
you literally lose your ability to stay awake, you have to fight for it.
is that a good sign your body wants it yeah?
when your cells are trying to fight off the food that you're ingesting?
but that's for a later topic.

# EVERYONE IS OBSESSED WITH CARBS.
all this bullshit of 55% carb diet 25% protein or some bs.
everyone is so obsessed with carbs aren't they?

# but guess what?
**THERE IS NO SUCH THING AS AN ESSENTIAL CARBOHYDRATE.**
but protein and fats? you can't live without them, you will literally die.
the brain is 70% fat, testosterone is made from cholesterol.
but what does the food pyramid, and everyone say?
"don't use too much fat, it's too much calories!"

# WHY ARE WE TOLD TO BELIEVE THIS?
it's straight forward.
## THE HIGHER UPS, THE FOOD INDUSTRY, THE MONEY.
"you feed the poor grains"
but why?
because it makes them tired, they can't cast a revolution when they're in a carb crash.

# THE FOOD INDUSTRY.
carbs are the only thing that can really taste amazing.
the only thing that you have to force yourself to stop eating.
I could eat 100 cookies back to back, and I stand by that.
I'd have to force myself to stop.
is that how food is meant to work?
you have to force yourself to stop?
"I'll just have one more"
"maybe another one"
"okay I have to stop now"
but you still crave it in the back of your mind... that's fucked.

# SO OF COURSE THEY FOCUS ON CARBS...
you can't make addictive protein, you can't make addictive REAL fats.
so you're going to do carbs, and label them as "low fat"
because "fat" is a buzz word.
you're going to pay doctors and places millions to release some studies.
just how they said "cigarettes are healthy"
and just rinse it out.

# the best way to make money?
get them addicted to your products.
you think Kellogg's or some shit give a fuck about your health?
their one goal is to be profitable, and it's working.
respect to them for the amount of money they're printing from your addictions...
it's a method.
a lot of work has gone into it, and now you can see behind the scenes.
all the studies they publish, all the propaganda they push IN SCHOOL.
it's mad out here.
**but either way.**
**just wanted to get you clear on that.**
**let us proceed to the next module.**`,
  },
  {
    slug: "dont-eat-gluten",
    title: "Don't Eat Gluten.",
    category: "Biohacking",
    summary: "Gluten starts fires of inflammation, spikes insulin, and creeps bacteria in.",
    body: `# BREAD/PASTA/GLUTEN.
# THE POOR ARE FED GLUTEN.
WHILE THE KINGS FEAST ON FATS.
to keep people poor, you need to keep them slow, you need to keep them lethargic.
so you feed them gluten and grains.
PRISONERS ARE FED BREAD.
and it's all for a reason.

# GLUTEN STARTS FIRES...
YOU WILL FIND GLUTEN IN
- WHEAT.
- BARLEY.
- RYE.

which is a fire starter for inflammation.
that can lead to a fuck tone of health problems :
- autoimmune diseases
- joint pain
- horrible digestive issues

# DURING THE REFINING PROCESS.
all of the nutrients are stripped away from the foods.
from your cereals, your pastas, your bread.
EVEN IF THEY'RE MARKETED AS :
- high fiber.
- high iron.
- high magnesium.

THAT WAS BEFORE THEY WAS REFINED.

# GLUTEN WILL SPIKE YOUR INSULIN LIKE MAD.
- white bread
- white rice

shit that seems healthy.
these rise your insulin like NOTHING ELSE.
I remember Eddie Abbew wore an insulin tracker...
and the thing that spiked his insulin the most out of everything was white rice.
which insulin leads to :
- storage of fat.
- insane brain fog.
- type 2 diabetes.
- inflammation.

# GLUTEN CREEPS BACTERIA IN.
gluten actually attacks the lining of your small intestine, the thing that digests.
so bacteria from food that is undigested leaks into your bloodstream.
THIS FLIES UNDER THE RADAR.
even though it causes
- CHRONIC TIREDNESS/FATIGUE
- SKIN ISSUES
- JOINT PAIN.
- DIGESTIVE DISCOMFORT.

most people don't know the cause.
and that's a problem.
so you already know the actionable step.

# ACTIONABLE STEP.
- CUT OUT ALL GLUTEN.`,
  },
  {
    slug: "dont-use-vegetable-oils",
    title: "Don't Use Vegetable Oils.",
    category: "Biohacking",
    summary: "The petroleum-solvent process behind seed oils — and what to use instead.",
    body: `# VEGETABLE OILS / SEED OILS.
you've seen them.
in the big shops.
vegetable oil, sunflower oil, canola oil (also known as rapeseed)
it literally looks like piss.
but either way, you've heard that seed oils or whatever are bad right?
but do you know the actual reason?
most likely not.
I've done some deep diving on why this oil is actually bad.
and what it does to your health.
let's get into it.

# THEY CLAIM TO BE "HEART HEALTHY"
but the truth is.
they're taking the piss, these oils are anything but heart healthy.
causing more harm that you could EVER imagine.

# A "HEALTHY" ALTERNATIVE?
they say to use these instead of things like
- butter
- ghee
- olive oil

but behind the curtains...
these oils, also known as "industrial seed oils"
unlike traditional fats like butter, animal fat, good oils.
have a very short and questionable history.
which we're going to get into rn.

# THE HISTORY OF SEED OILS.
they came to existence in the early 1900s.
I always try to convince my mum that seed oils are bad.
it never worked until I told her the info that I know now, that I'm going to tell you.
she always said "but they've always used it, and people are living long"
but when did they come into existence?
**UNDER 100 YEARS AGO.**
and when has obesity started to rise for the first time ever?
**you think this is a coincidence?**

# THE AVERAGE PERSON CONSUMES 50-70 LBS/YEAR.
of seed oils...
per year.
and this mad increase came with rise of diseases like cancer, etc.
despite the decrease of butter and cholesterol, which they blame.
**interesting isn't it?**

# WHAT'S THE BIG DEAL WITH THESE OILS?
most people, like me.
used to use these oils, thinking not much of it.
thinking they were healthy.
as the names of "sunflower" and "vegetable" suggest.
thinking they was a product of nature.
**WHICH COULD NOT BE FURTHER FROM THE TRUTH.**

# THE PROCESS OF MAKING SEED OILS.
how much do you actually know about the process?
well you're about to unveil the truth.
let's use canola / rapeseed oil as an example.
since it's probably the most used vegetable oil.

# THE PROCESS OF CANOLA/RAPESEED OIL.
the journey starts with canola seeds.
which don't even exist in nature.
THIS IS MADE FROM A VERSION OF RAPESEED.
which is genetically modified, and heavily dosed with pesticides.
and after that.
these seeds are then going under extreme heat.
causing oxidation and rancidity.

# BUT IT DOESN'T STOP THERE.
the extraction of these oils involve a PETROLEUM SOLVENT.
WHICH BY THE WAY.
is the thing you use to power your car lol.
which is followed by :
- heating
- acid treatment (to get rid of the solvents)
- chemical to improve the colour
- deodorization to get rid of the chemical smells.

THAT'S WHAT YOU'RE INGESTING? nice one
but in contrast...

# HOW IS BUTTER MADE?
- cream from milk.
- shake cream until solid.

unhealthy? yeah bro

# WHAT SHOULD YOU USE INSTEAD?
the simple answer is...
what did they used to use back in the day?
## OIL COLD PRESSED STRAIGHT FROM THE SOURCE.
- coconut oil
- avocado oil
- extra virgin olive oil

or, what I personally use for cooking
- animal fat (duck fat/ beef tallow)
- butter
- ghee.

these are all natural things.
BUT MAKE SURE.
your butter is not the bullshit "spreadable" shit.
and It has 1-2 ingredients on the back.
- milk
- salt (maybe)

NO BULLSHIT CAR OILS.
so here, the actionable step.

# ACTIONABLE STEP.
CUT OUT ALL SEED OILS.`,
  },
  {
    slug: "do-not-eat-processed-sugar",
    title: "Do Not Eat Processed Sugar.",
    category: "Biohacking",
    summary: "Sugar has zero nutrients, wrecks your focus, and works exactly like a drug.",
    body: `![](https://i5.walmartimages.com/asr/d309772d-437e-4e08-bd21-b920d615ea0f.82e114adaf618642be482bcd33cfacd6.jpeg)
# PROCESSED SUGAR.
this image is funny, 30 calories per serving.
you can be addicted with less guilt!

# IN 8/10 FOODS YOU FIND PROCESSED SUGAR.
and that's fucking crazy.
because these sugars are an overkill... (literally)

# SUGAR HAS 0 NUTRIENTS.
literally bro, absolutely 0.
I mentioned earlier that your body takes out the nutrients from food and uses it.
well yeah, sugar has no nutrients inside it.
instead it is just a thing that destroys your body.
it's purely an energy killer, even tho you've been told "sugar gives you energy"
jokes.

# YOUR BRAIN ON SUGAR.
gonna have to talk about it like it's a drug...
because it is.
I mean...
you get withdrawals, like my mum said her hands shake when she doesn't have it for too long.
incredibly addicting.
incredibly hard to cut out.

# HOW IT AFFECTS AN ENTREPRENEUR.
once you eat anything with added sugars...
or any artificial sweetener, like sucralose, and all that bullshit.
IT MAKES YOUR BRAIN FUCK UP.
and the scary part.
you might not have even realised it.
but the next time, if you will, you will realise it.
your brain will start to become less focused, you will realise this if you're aware.

# LONG TERM ILLNESS.
you already know this, but here's just a list :
1. Obesity
2. Type 2 Diabetes
3. Heart Disease
4. Tooth Decay
5. Non-Alcoholic Fatty Liver Disease (NAFLD)
6. Metabolic Syndrome

# YOU CANNOT FOCUS AFTER EATING SUGAR.
it's almost impossible.
the only person who I've actually seen productive on sugar.
is Alex Hormozi.
but fucking hell, that guy is a demon.
but you gotta keep in mind, he does use both caffiene and nicotine, so it cancels out.

# ACTIONABLE STEP.
- YOU NEED TO CUT OUT ALL PROCESSED SUGARS.`,
  },
  {
    slug: "clean-your-cupboards",
    title: "CLEAN YOUR CUPBOARDS.",
    category: "Biohacking",
    summary: "Every tempting snack in sight costs you brain points. Get rid of it.",
    body: `# CLEAN YOUR CUPBOARDS.
bro imagine if you was fasted.
you've not ate for hours, and you see that.
I know I wouldn't actually eat it, but that is tempting bro.
I could demolish that whole drawer in one sitting easily rn.

# THE CRAVING NEVER GOES AWAY.
you will always see a piece of cake and think "fuck that looks good"
it's never going to stop.
and every time you see something like that, the desire will pop up.
and sooner or later, you will indulge in that desire.

# THIS JOURNEY IS HARD.
and you will experience hunger and craving.
you can just open the wrapper to that chocolate bar.
you can open that bag of crisps.
and it's right there, you have your pleasure fulfilled.
it's so easy.

# THE ODDS ARE AGAINST YOU.
there's no need to be fighting an uphill battle.
why would you keep it there if you don't intend on eating it?
I thought you was serious on this journey?
are you going to be a sad little fuck and have a "cheat meal" on your desk with some youtube?
you're going to finish that bag of crisps, that chocolate bar.
and you're just gonna think "fuck, why did I do that"
as soon as the taste is gone.
the aftertaste of regret comes in.

# GETTING RID IS NOT A WASTE.
it is more of a waste to keep it.
STOP FOCUSING ON WHAT YOU'RE LOSING.
and focus on what you are going to achieve.
this is the hard part of this journey.

# IT WILL TAKE UP BRAIN POINTS.
every single time you look at that chocolate bar.
your brain starts a fight with each side, one arguing on why you should eat it.
one on the other side.
and it keeps fighting and fighting.
taking up a fuck tone of mental real estate.

# AS AN ENTREPRENEUR.
you cannot be having that.
you are setting yourself up for failure.
you're going to be working, and just think "I really would love that chocolate bar"
and your focus is gone.
because pleasure is hard to overcome.

# ACTIONABLE STEP.
**CLEAN YOUR CUPBOARD OUT.**
**get rid of all the bullshit.**
or atleast just try not to look at it, try to keep away from it.
because Ik most people have family that eat that shit, which will happen.
and you can't convince them to stop, trust me on that looool.
make sure to block it from your life.
it's not a thing anymore.`,
  },
  {
    slug: "you-can-mix-fuels",
    title: "You Can Mix Fuels.",
    category: "Biohacking",
    summary: "A revised philosophy: nature's most perfect foods combine fat, sugar and protein.",
    body: `So... i was a believer that the body should run either on fat or carbs, but this is my new philosophy on this.
How many times have you heard that human body is just like a car and you shouldn't mix fuels?
That it should run either on fat or carbohydrates just like a car runs only on diesel or gasoline?
In reality the most perfect food for human being - breast milk contains both saturated fat, sugar and some protein.
And before you say that breast/animal milk is only for babies let's take a look at some other foods
Honeycomb (which tribes always eat whole in its natural form) contains:
- Carbohydrates from the honey itself
- Fat from bee larvae and royal jelly
- Protein from bee larvae

Whole animal nose-to-tail contains:
- Sugar if freshly slaughter in meat, blood and organs. Liver can store up to 10g of glycogen
- Fat tissue (which itself contains some glycogen too) surrounding organs and muscles
- Protein from the muscles, blood and organs

Eggs
Although the yolk contains mostly fat and protein it also contain approx 3-4g/100g sugar in fresh egg
Caviar Depends on the fish % of fat and carbs varies but it does contain both sugar, fat and protein.
Think of the most delicious food combinations:
- Ice cream - fat and sugar
- Bone marrow with honey - fat and sugar
- Mashed potaoes with butter - fat and carbs
- Cheesecake - fat and sugar
- Pizza - fat,carbs and protein
- French fries - fat and carbs

Do you really think that our ancestors would throw away royal jelly from the honeycomb because it contains both sugar and fat? Or would they skim the milk because fat and carbs together are dangerous?
So is mixing fuels bad? If you believe that human body works like a car and you want less energy, less sex hormones then you should restrict yourself, overeat protein and eat only one fuel.
But if you want to really thrive with more energy, more healthy hormones and more fertility.
you can absolutely mix fuels.`,
  },

  // ─── Products & Environment ────────────────────────────────────────────────
  {
    slug: "daily-products-to-avoid",
    title: "Daily Products To Avoid.",
    category: "Products & Environment",
    summary: "The endocrine disruptors hiding in your daily life — and why they tank your hormones.",
    body: `# Hormone Regulators to AVOID for Higher Testosterone Levels:
Theses Are The Endocrine Disruptors and things you use in your daily life that reduce Testosterone.
endocrine disruptors are things that will stop your testosterone from being produced and cut off the flow.
and these things are FILLED in our daily lives.
and here I will tell you how to avoid them.
and I will go over what to use instead in the next section of this guide.

# WHAT TO AVOID :
# ***1) Teflon Pans (Pans With A Non Stick Coating)***
The non-stick coating on these pans contain PTFE (polytetrafluoroethylene) which has been scientifically proven to lower testosterone over 10 times and shrink your penis and balls. (no joke)

# ***2) Plastic Kitchen Utensils.***
all plastics are hormone and endocrine disruptors, which means if microplastics are actively leeching into your system, your testosterone will tank.
this happens because plastics literally mimic the hormone of women, estrogen.
if you are ingesting plastics, you are willingly depleting your testosterone and elevating estrogen.
If you cook food with plastic utensils, plastic ends up in your food.
Also, avoid plastic cutting boards (cutting on a plastic cutting board causes plastic to end up in your food)

# ***3) Toothbrushes With Nylon Bristles.***
every time you brush your teeth with a toothbrush that has nylon bristles, microplastics end up in your saliva, and you end up swallowing them, which we now know mimic the hormone of estrogen.

# ***4) Toothpaste (Toothpaste, Especially Toothpaste With Fluoride.)***
this tanks testosterone since toothpaste itself contains a lot of microplastics and artificial sweeteners, not to mention the fluoride which literally can disrupt male gametogenesis and steroidogenesis and induce testicular oxidative stress.
toothpaste is something you need to completely avoid, and I will give you some alternatives.

# ***5) Shaving Foam And Gel.***
contains a lot of hormone disruptors and tanks your testosterone, similar to toothpaste.
(p.s you are also letting it sink into your skin when shaving)

# ***6) Any Razor With Gel Underneath (Such As Gillette)***
avoid razors with layers of gel underneath that are often underneath the blades themselves.
this gel contains hormone disruptors that will get into your skin while you are shaving (often coupled with shaving foam)

# ***7) Shampoos, Soaps and Detergents***
these contain a lot of hormone disruptors that reduce testosterone and cause cancer.
you are cleaning yourself with warm water, meaning your pores will open up and these chemicals will leech inside your bloodstream, a hormone disruptor.

# ***8) Polyester Clothing.***
polyester has endocrine disruptors that mimic the female hormone estrogen (plastic)
you also sweat in this clothing when you go to the gym, a lot of "muscle fit" tees are made of polyester.

# ***9) Plastic Bottles And Cups/***
because of microplastics, you should never eat or drink from plastic bottles or packaging.
since those product wait under the sun, which the heat of the sun causes the plastic to loosen, causing more microplastics to end up in the drink or food.
ingesting more hormone disruptors and estrogen.
same with plastic food packaging, avoid where possible and i will give an alternative.

# ***10) Unfiltered Tap Water.***
unfiltered tap water contains a lot of heavy metals, fluoride, female hormones which is not filtered through the water systems, other endocrine disruptors and dirt that is not filtered out.
if you smell your tap water, you will know what I'm talking about.

# ***11) Receipts***
do not touch receipts because receipts contain a very high amount of BPA (Bisphenol A, an endocrine disruptor) which is easily absorbed through your skin.
instead, if you work a job in customer service, you should wear gloves to avoid this.
and simply never take the receipt when offered.
but if you need the receipt for some reason, just don't go around touching it everywhere, avoid where possible.

# ***12) Deodorants***
deodorants literally stop you from sweating, that isn't natural.
this blocks a WHOLE bunch of systems in the body, and is a huge endocrine disruptor.
I've seen guys put deodorant on their balls, and it pains me to think of what that will do.

# ***13) Sunscreen.***
should be avoided.
Sunscreen contains many chemicals that are both carcinogenic and estrogenic such as octinoxate, oxybenzone, octisalate, octocrylene, homosalate, avobenzone.
combined with the sun melting into your skin, it's a recipe to fuck your testosterone.`,
  },
  {
    slug: "daily-products-you-must-use-instead",
    title: "Daily Products You Must Use Instead.",
    category: "Products & Environment",
    summary: "The natural swaps for every endocrine disruptor — your shopping list.",
    body: `I hope you're ready to make your shopping list...
![Shopping list](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/1282dac046bc44939fd065a37a3c70a4477df6760f594e739b0f9846b33bb6ef)

# ***1) Stainless Steel Or Cast Iron Pans.***
this an investment to make if you don't want your testosterone to have a 10X decrease and if you don't want a shrunken penis and balls.

# ***2) Wooden/Steel Kitchen Utensils.***
this an investment to make if you don't want microplastics in your food.

# ***3) Wooden Cutting Board.***
this an investment to make if don't want more microplastics in your food.

# 4) Miswak Or Bamboo Toothbrushes With Sterilized Animal Hair.
**the bristles can be made with things like boar hair.**
this an investment to make if you don't want to be swallowing microplastics to start your day with.

# ***5) Coconut Oil And Baking Soda For Toothpaste.***
you might think this will make you have bad breath, however the opposite is true.
baking soda is a natural stain remover, meaning that your teeth will be as white as ever.
Also do oil pulling with coconut oil for whiter and healthier teeth.
(you can search up how to "oil pull" for more information)
also I highly recommend getting a tongue scraper if you don't want your breath to smell like a dog, brushing your tongue isn't enough.

# 6) Replace Shaving Foam With Soap.
**honestly, this is what I do.**
personally i do not shave, but i just trim with a clipper, it's much easier.
THE BEST SOAP TO USE IS [BIOMAX ALEPPO SOAP.](https://shopbiomax.com/)
![Biomax Aleppo soap](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/7a422e57800f49dfa0a381148b42a1fb3942e70665044033b9aca1b735713cb8)
P.S this soap also has benefits.
Vitamin E-deficient human subjects experience a significant drop in LH, FSH, and testosterone levels.
About 90% of adults are deficient in this vitamin as our modern eating habits high in rancid fats deplete vitamin E at a rapid pace.
and this soap includes oils that give you vitamin E topically through the skin.

# ***7) Use A Safety Razor To Shave.***
these razors are simply razors that do not have that sticky substance which is an endocrine disruptor.

# ***8) Use A Natural Soap To Wash Your Body/Hair/Face With.***
THE BEST SOAP TO USE IS [BIOMAX ALEPPO SOAP.](https://shopbiomax.com/)
![Biomax Aleppo soap](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/9002531704224c7586f911a4292bb1c19d88730fb1d24ca9b3ea83fdbc1507f1)

# ***9) Use Baking Soda And White Vinegar As Detergent To Clean Your Clothes, Pans, And Kitchen Utensils.***
to clean your dishes, use baking soda as it is a natural alternative to your shitty fairy liquid full of endocrine disruptors which are heated up while cooking.
if you are using the normal liquids, you are fucking your testosterone levels.
use white vinegar as detergent to clean your clothes, as normal detergent is a hormone disruptor, not to mention that these clothes heat up when you sweat and leak into your pores.

# ***10) 100% Cotton Or Organic Cotton Clothing.***
polyester is an endocrine disruptor, and it mimics the female hormone estrogen, and now imagine if you are training in polyester gym clothing...

# ***11) Glass Bottles, Glass Cups***
simple answer, plastic bottles will heat up and the microplastics will enter the fluid and you are ingesting a hormone disruptor when you think you are being healthy.

# ***12) Food You Buy Is Often Placed In A Plastic Bag, Which You Should Put In A Glass Jar At Home.***
most of the time you cannot avoid food being placed in a plastic bag, so you should put it in a glass container as soon as you get home.

# ***13) Filter Tap Water With A 5-stage (5 Phase) Reverse Osmosis Filter That Removes All Impurities From Your Water.***
a reverse osmosis filter is the only filter that actually gets rid of the female estrogen hormone that gets recycled inside tap water, which comes from females that are on birth control who take a piss.
the same water is recycled, and filtered by a little bit, enough to make the water barely drinkable.
but it does not get rid of the plastics, heavy metal toxins, and birth control hormones in the water.
your body is mostly water, it is crucial to fill it with the highest quality water, otherwise you are a walking estrogen particle.

# Also Filter Your Shower Water At The Same Time
you can search up for a shower head filter, and you can make a purchase.
since your skin is the largest organ, it also absorbs like your mouth does.
treat your body as if it was a thing to be taken care for.
[Buy This One.](https://uk.healf.com/products/jolie-skin-co-showerhead-modern-chrome)
or do your own research.

# ***14) Replace Deodorant With Baking Soda.***
simply combine water with baking soda and you can apply it as you would normal deodorant.
baking soda is a natural cleaner, and you will not smell, while avoiding all of the hormone disruptors.
p.s if you think you "smell bad", it is because of your diet which we will fix soon.

# ***15) Use Tallow Balm Instead For Sunscreen.***
As its name suggests, it's made from beef tallow.
Unlike what most people think, it doesn't make you smell like beef fat and it contains saturated fat and other nutrients that are essential for skin health and keep your skin younger by boosting collagen production.
Not to mention it works perfectly as sunscreen.
alternatively, coconut oil is a decent choice too.`,
  },

  // ─── Rituals & Recovery ────────────────────────────────────────────────────
  {
    slug: "creating-potions",
    title: "CREATING POTIONS.",
    category: "Rituals & Recovery",
    summary: "Tea is a lost, hidden art. Mix and match a gourd of healing herbs.",
    body: `# CREATING POTIONS.
this one was very interesting for me to research.
and in this section, we're going to be creating magic potions.
mixing and brewing....

# TEA IS MAGIC.
tea has been around for thousands of years.
not just for the taste.
but for health.
it's been used as medicine.
it's been used by the rich.
tea is a lost, hidden art.

# WHAT HAPPENS WHEN YOU USE TEA?
when you put a tea leaf into warm water.
the hidden treasures of the leaf get released.
the nourishing parts of the leaf gets released into the water.
the healing properties of the leaf gets extracted.

# THE BITTER TASTE OF TEA.
the bitter taste of tea are something ccalled "polyphenols"
idk why they do these complicated names.
but these are basically antioxidants.
**these antioxidants do these things :**
- combat oxidative stress (kills bad bacteria/cells)
- increases cardiovascular health
- improves cognitive function
- stress relief

# THE BEAUTY OF TEA.
each tea carries unique benefits and nutrients.
this is how we're going to create our potions.
mix and match...

# CRAFTING POTIONS.
before we start making potions, we need the equipment.

# A GOURD.
![A tea gourd](https://assets.skool.com/f/a0219e65cbee4df5bd7c52c65fcc1d99/8d934ca6dd48454ba437775fc0a2eee34fac98a051c548018ab3600d22697cda)
a gourd looks something like this.
you can get one on amazon, or anywhere.
just type in "tea gourd"
we're doing some old school shit here ahaha.
making this makes me feel like a magician bro back in the day.
feels amazing.

# NEVER USE A TEABAG.
unless it is organic from an organic shop.
tea bags are made of nylon plastic
or bleach paper...
that I also sealed with chemicals lol.
so you have :
- microplastics
- chemicals

boiled into your tea....
which disrupt your endocrine system, which fucks with your testosterone.
it's shown that there can literally be billions of microplastics in a single cup of tea.
it's mad.

# USE A GOURD.
with a gourd, we can mix and match the teas.

# HOW DOES A GOURD WORK?
pretty simple.
you put things on top of the gourd.
and you pour boiling water on it, making tea infused water.
and there are a lot of variety to making these potions.
test it out.
I'm gonna tell you some things to use.

# POTION INGREDIENTS.
- YERBA MATTE
- GREEN TEA
- BLACK TEA
- NETTLE LEAF
- CINNAMON STICKS
- FRESH GINGER
- CLOVES
- FRESH ROSEMARY
- FRESH MINT
- DRIED FRUITS.
- HONEY

and there are much more you can use....
I didn't list the benefits, because I want you to create your own potions.
you can mix and match them.
and there's actually too many benefits to list lol, I'll just ask chatgpt for a couple :
fucking hell there's a lot
this should convince you enough,
- Energy Boost
- Mental Alertness
- Improved Focus and Concentration
- Enhanced Physical Performance
- Weight Management Support
- Nutrient-Rich (Vitamins A, C, K, and Minerals)
- Anti-inflammatory Properties
- Detoxification Support
- Allergy Relief
- Blood Sugar Regulation
- Digestive Health Support
- Heart Health Support
- Immune Boosting Properties
- Nausea Relief
- Pain Relief (including menstrual pain and sore muscles)
- Respiratory Health Support
- Cognitive Support
- Stress Relief
- Bad Breath Prevention
- Headache Relief
- Skin Irritation Relief (applied topically)
- Antioxidant Benefits
- Antibacterial Properties
- Natural Sweetness without added sugars
- Circulation Support
- Bone Health Support
- Liver Health Support
- Kidney Health Support
- Anti-aging Properties
- Mood Enhancement
- Anti-anxiety Properties
- Hormonal Balance Support
- Anti-viral Properties
- Wound Healing Properties
- Anti-fungal Properties
- Joint Health Support
- Vision Health Support
- Hair and Nail Health Support
- Metabolism Boost
- Blood Pressure Regulation
- Cellular Health Support
- Memory Enhancement

don't forget the benefit of feeling like a wizard creating ts.

# MIX AND MATCH THEM.
# ACTIONABLE STEP.
- BUY A GOURD
- CREATE YOUR POTIONS
- BIOHACK TO SUCCESS.`,
  },
  {
    slug: "sleep-recovery",
    title: "SLEEP / RECOVERY.",
    category: "Rituals & Recovery",
    summary: "Sleep is a lost art. Fine-tune your habits for optimal recovery.",
    body: `# SLEEP / RECOVERY.
sleep and recovery is a lost art.
if you want to thrive, you must master recovering.

# JUST LIKE A VEHICLE.
your body needs maintenance and repair.
no matter how powerful the vehicle is.
it will break down without maintenance.

# REST IS A NOT AN OBJECTIVE, BUT A NECCESITY.
you need rest.
but once you make rest an objective.
you fall into a hole.
the average syndrome.

# WHAT HAPPENS IN SLEEP?
in sleep, our bodies are working overtime.
- TORN MUSCLES ARE REPAIRED
- NUTRIENTS ABSORBED FROM MEALS ARE DELIVERED TO CELLS
- GROWTH INDUCING HORMONES ARE RELEASED.
- YOUR MIND MAKES SENSE OF THE DAYS EXPERIENCE
- KNOWLEDGE CEMENTS INTO YOUR BRAIN

insufficient sleep is not a lack of sleeping hours.
but also a lack of sleep quality.
it will lead to you to unneeded stress, a loss of focus, a loss of growth (physical and mental)
and so much more.

# AS A MUSICIAN FINE TUNES HIS GUITAR.
we need to fine tune your habits for optimal sleeps.

# ACTIONABLE STEP.
# DO THESE THINGS TO TAKE CONTROL OF YOUR SLEEP
and remember, use the art of wisdom to validate these.
HABITS :
- STRETCH BEFORE BED (alleviate tension)
- NO BLUE LIGHT (stops melatonin)
- NO NOTIFICATIONS (raises dopamine)
- GRATITUDE JOURNAL (stress release)
- USE MICROPORE TAPE ON YOUR MOUTH
- SLEEP MASK
- EARPLUGS
- COLD TEMPERATURES
- RED LIGHT ACTIVATION (red lights only before sleep)
- MAKE SURE YOU LOCK DOORS (safety helps sleep)
- SET UP ROOM FOR TOMORROW.
- PLAN TOMORROW.

and loads of other things.
whatever you think of, you use wisdom to incorporate it in your life.
TAKE ACTION.`,
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
