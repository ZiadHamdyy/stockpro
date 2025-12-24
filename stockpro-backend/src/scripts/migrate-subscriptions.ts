import { PrismaClient, SubscriptionPlanType, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to create subscriptions for existing companies
 * 
 * This script:
 * 1. Finds all companies without subscriptions
 * 2. Creates a BUSINESS plan subscription for each (most generous default)
 * 3. Sets status to ACTIVE
 * 
 * Run this script once after deploying the subscription feature:
 * npx ts-node src/scripts/migrate-subscriptions.ts
 */
async function migrateSubscriptions() {
  console.log('🚀 Starting subscription migration...\n');

  try {
    // Find all companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    console.log(`📊 Found ${companies.length} companies\n`);

    // Check which companies already have subscriptions
    const existingSubscriptions = await prisma.subscription.findMany({
      select: {
        companyId: true,
      },
    });

    const companiesWithSubscriptions = new Set(
      existingSubscriptions.map((s) => s.companyId),
    );

    const companiesNeedingSubscriptions = companies.filter(
      (c) => !companiesWithSubscriptions.has(c.id),
    );

    if (companiesNeedingSubscriptions.length === 0) {
      console.log('✅ All companies already have subscriptions. Nothing to do!');
      return;
    }

    console.log(
      `🔄 Creating subscriptions for ${companiesNeedingSubscriptions.length} companies...\n`,
    );

    // Create subscriptions for companies that don't have one
    let successCount = 0;
    let errorCount = 0;

    for (const company of companiesNeedingSubscriptions) {
      try {
        await prisma.subscription.create({
          data: {
            companyId: company.id,
            planType: SubscriptionPlanType.BUSINESS, // Default to BUSINESS (unlimited)
            status: SubscriptionStatus.ACTIVE,
          },
        });

        console.log(`  ✅ Created subscription for: ${company.name} (${company.code})`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to create subscription for: ${company.name}`, error);
        errorCount++;
      }
    }

    console.log(`\n📈 Migration Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📊 Total: ${companiesNeedingSubscriptions.length}`);

    if (successCount > 0) {
      console.log(`\n✅ Migration completed successfully!`);
      console.log(
        `\n💡 Note: All companies were assigned BUSINESS plan by default.`,
      );
      console.log(`   You can manually adjust plans through the subscription page.`);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateSubscriptions()
  .then(() => {
    console.log('\n🎉 Migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });

