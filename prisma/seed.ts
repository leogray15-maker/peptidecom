import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  // Categories
  const categories = [
    { slug: "general", name: "General discussion", description: "Anything and everything.", order: 0, icon: "💬" },
    { slug: "glp1", name: "GLP-1s", description: "Semaglutide, Tirzepatide, Retatrutide.", order: 1, icon: "💉" },
    { slug: "vendors", name: "Vendor talk", description: "Reviews, warnings and recommendations.", order: 2, icon: "🏪" },
    { slug: "protocols", name: "Protocols & dosing", description: "How people run their research.", order: 3, icon: "📋" },
    { slug: "results", name: "Results & progress", description: "Share your data.", order: 4, icon: "📈" },
    { slug: "testing", name: "Lab testing", description: "COAs, purity and mass-spec.", order: 5, icon: "🧪" },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }

  // Demo admin with an active membership. Sign up in the app with this email via
  // Firebase and the account links automatically (matched by email), giving you
  // instant admin + member access to explore the gated area.
  const ADMIN_EMAIL = "leogray15@gmail.com";
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", subscriptionStatus: "ACTIVE" },
    create: {
      email: ADMIN_EMAIL,
      name: "Arcane Admin",
      username: "admin",
      role: "ADMIN",
      verified: true,
      reputation: 500,
      subscriptionStatus: "ACTIVE",
      stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 864e5),
    },
  });

  // Vendors
  const vendorData = [
    { slug: "vendor-a", name: "Aurora Research", country: "China", verified: true, website: "https://example.com", description: "Long-standing vendor with consistent third-party testing." },
    { slug: "vendor-b", name: "Helix Peptides", country: "EU", verified: true, description: "EU-based, fast shipping, community favourite." },
    { slug: "vendor-c", name: "Nova Labs", country: "China", verified: false, description: "Newer vendor, results pending verification." },
  ];
  const vendors = [];
  for (const v of vendorData) {
    vendors.push(await prisma.vendor.upsert({ where: { slug: v.slug }, update: v, create: v }));
  }

  // Reviews
  await prisma.vendorReview.upsert({
    where: { vendorId_userId: { vendorId: vendors[0].id, userId: admin.id } },
    update: {},
    create: {
      vendorId: vendors[0].id,
      userId: admin.id,
      rating: 5,
      title: "Reliable",
      body: "Third-party tests matched their COAs. Recommended.",
    },
  });

  // Lab results
  const labData = [
    { vendorId: vendors[0].id, peptide: "Tirzepatide", batch: "T-2405", purityPct: 99.2, labName: "Janoshik", testedAt: new Date("2026-05-10") },
    { vendorId: vendors[0].id, peptide: "Retatrutide", batch: "R-2404", purityPct: 98.6, labName: "Janoshik", testedAt: new Date("2026-04-22") },
    { vendorId: vendors[1].id, peptide: "Semaglutide", batch: "S-2312", purityPct: 99.7, labName: "MZ Biolabs", testedAt: new Date("2026-06-01") },
    { vendorId: vendors[2].id, peptide: "BPC-157", batch: "B-2401", purityPct: 96.1, labName: "Janoshik", testedAt: new Date("2026-03-15") },
  ];
  for (const l of labData) {
    await prisma.labResult.create({ data: { ...l, submittedById: admin.id } });
  }

  // Group buy
  const gb = await prisma.groupBuy.create({
    data: {
      title: "Tirzepatide 30mg group buy",
      peptide: "Tirzepatide",
      vendorName: "Aurora Research",
      pricePerUnit: 45,
      targetUnits: 50,
      status: "OPEN",
      ownerId: admin.id,
      deadline: new Date(Date.now() + 14 * 864e5),
      details: "Bulk pricing unlocks at 50 units. Verified vendor, tested batch.",
    },
  });
  await prisma.groupBuyMember.create({ data: { groupBuyId: gb.id, userId: admin.id, units: 5 } });

  // A welcome post
  const generalCat = await prisma.category.findUnique({ where: { slug: "general" } });
  await prisma.post.create({
    data: {
      title: "Welcome to the lab 🧪",
      content:
        "This is the community feed. Introduce yourself, ask questions, and share what's working. Real testing, real results, real community.",
      authorId: admin.id,
      categoryId: generalCat?.id,
      pinned: true,
    },
  });

  console.log(`Seed complete. Sign up in-app with ${ADMIN_EMAIL} (Firebase) to claim admin + full access.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
