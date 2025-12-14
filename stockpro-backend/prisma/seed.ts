import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process for SUPER_ADMIN...');

  // Create or get system company for SUPER_ADMIN (stockplus.cloud)
  console.log('🏢 Creating/Getting system company...');
  let systemCompany = await prisma.company.findUnique({
    where: { host: 'stockplus.cloud' },
  });

  if (!systemCompany) {
    // Check if there's a company with empty host that we should update
    const companyWithEmptyHost = await prisma.company.findFirst({
      where: { host: '' },
    });

    if (companyWithEmptyHost) {
      // Update existing company with empty host to use stockplus.cloud
      systemCompany = await prisma.company.update({
        where: { id: companyWithEmptyHost.id },
        data: {
          name: 'StockPro System',
          activity: 'System Administration',
          address: 'System Address',
          phone: '+966000000000',
          taxNumber: '000000000000000',
          commercialReg: '0000000000',
          currency: 'SAR',
          capital: 0,
          vatRate: 15,
          isVatEnabled: true,
          host: 'admin',
        },
      });
      console.log('✅ Updated existing company to system company');
    } else {
      // Create new system company
      systemCompany = await prisma.company.create({
        data: {
          name: 'StockPro System',
          activity: 'System Administration',
          address: 'System Address',
          phone: '+966000000000',
          taxNumber: '000000000000000',
          commercialReg: '0000000000',
          currency: 'SAR',
          capital: 0,
          vatRate: 15,
          isVatEnabled: true,
          host: 'admin',
        },
      });
      console.log('✅ Created system company');
    }
  } else {
    console.log('✅ System company already exists');
  }

  const companyId = systemCompany.id;

  // Create subscription permissions
  console.log('📝 Creating subscription permissions...');
  const subscriptionPermissions = [
    {
      resource: 'subscription',
      action: 'read',
      description: 'Read subscription',
    },
    {
      resource: 'subscription',
      action: 'create',
      description: 'Create subscription',
    },
    {
      resource: 'subscription',
      action: 'update',
      description: 'Update subscription',
    },
    {
      resource: 'subscription',
      action: 'delete',
      description: 'Delete subscription',
    },
  ];

  for (const permission of subscriptionPermissions) {
    await prisma.permission.upsert({
      where: {
        resource_action_companyId: {
          resource: permission.resource,
          action: permission.action,
          companyId,
        },
      },
      update: permission,
      create: {
        ...permission,
        companyId,
      },
    });
  }
  console.log(`✅ Created ${subscriptionPermissions.length} subscription permissions`);

  // Create SUPER_ADMIN role
  console.log('👥 Creating SUPER_ADMIN role...');
  const superAdminRole = await prisma.role.upsert({
    where: {
      name_companyId: {
        name: 'SUPER_ADMIN',
        companyId,
      },
    },
    update: {
      description: 'Super Administrator with full access to manage all companies',
      isSystem: true,
    },
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator with full access to manage all companies',
      isSystem: true,
      companyId,
    },
  });
  console.log('✅ Created SUPER_ADMIN role');

  // Get all subscription permissions
  const createdPermissions = await prisma.permission.findMany({
    where: {
      companyId,
      resource: 'subscription',
    },
  });

  // Assign subscription permissions to SUPER_ADMIN role
  console.log('🔗 Assigning subscription permissions to SUPER_ADMIN role...');
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ Assigned subscription permissions to SUPER_ADMIN role');

  // Create default branch for system company
  console.log('🏪 Creating default branch...');
  let existingBranch = await prisma.branch.findFirst({
    where: { companyId },
  });

  if (!existingBranch) {
    const lastBranchWithCode = await prisma.branch.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextBranchCode = (lastBranchWithCode?.code ?? 0) + 1;
    existingBranch = await prisma.branch.create({
      data: {
        code: nextBranchCode,
        name: 'System Branch',
        address: systemCompany.address,
        phone: systemCompany.phone,
        description: 'Default branch for system company',
        companyId,
      },
    });
    console.log('✅ Created default branch');
  } else {
    console.log('✅ Branch already exists');
  }

  // Create default store for the branch
  console.log('🏬 Creating default store...');
  let existingStore = await prisma.store.findFirst({
    where: { branchId: existingBranch.id },
  });

  if (!existingStore) {
    const lastStoreWithCode = await prisma.store.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextStoreCode = (lastStoreWithCode?.code ?? 0) + 1;

    // We'll create the store after creating the user
    console.log('⏳ Store will be created after user creation');
  } else {
    console.log('✅ Store already exists');
  }

  // Create SUPER_ADMIN user
  console.log('👤 Creating/updating SUPER_ADMIN user...');
  const existingSuperAdmin = await prisma.user.findUnique({
    where: {
      email_companyId: {
        email: 'super@stockpro.com',
        companyId,
      },
    },
  });

  let superAdminUser = existingSuperAdmin;

  if (!existingSuperAdmin && existingBranch) {
    // Hash the password using bcryptjs with 12 rounds
    const hashedPassword = await bcryptjs.hash('Password#1', 12);
    // Next user code
    const lastUserWithCode = await prisma.user.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextUserCode = (lastUserWithCode?.code ?? 0) + 1;

    superAdminUser = await prisma.user.create({
      data: {
        code: nextUserCode,
        email: 'super@stockpro.com',
        name: 'Super Admin',
        password: hashedPassword,
        emailVerified: true,
        active: true,
        roleId: superAdminRole.id,
        branchId: existingBranch.id,
        companyId,
      },
    });
    console.log('✅ Created SUPER_ADMIN user');
    console.log('   📧 Email: super@stockpro.com');
    console.log('   🔑 Password: Password#1');
  } else if (existingSuperAdmin) {
    // Ensure SUPER_ADMIN user has correct branch and role
    superAdminUser = await prisma.user.update({
      where: {
        email_companyId: {
          email: 'super@stockpro.com',
          companyId,
        },
      },
      data: {
        branchId: existingBranch.id,
        roleId: superAdminRole.id,
        active: true,
        name: 'Super Admin',
      },
    });
    console.log('✅ Updated SUPER_ADMIN user');
    console.log('   📧 Email: super@stockpro.com');
    console.log('   🔑 Password: Password#1');
  }

  // Create default store if user was created
  if (!existingStore && superAdminUser) {
    const lastStoreWithCode = await prisma.store.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextStoreCode = (lastStoreWithCode?.code ?? 0) + 1;

    await prisma.store.create({
      data: {
        code: nextStoreCode,
        name: 'System Store',
        address: existingBranch.address,
        phone: existingBranch.phone,
        description: 'Default store for system company',
        branchId: existingBranch.id,
        userId: superAdminUser.id,
        companyId,
      },
    });
    console.log('✅ Created default store');
  }

  console.log('🎉 Seed process completed successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   - System Company: stockplus.cloud');
  console.log('   - SUPER_ADMIN Role: Created');
  console.log('   - SUPER_ADMIN User: super@stockpro.com');
  console.log('   - Password: Password#1');
}

main()
  .catch((e) => {
    console.error('❌ Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
