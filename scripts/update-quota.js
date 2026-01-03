const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('更新所有用户的每日额度为50...');
  
  // 更新所有非管理员用户的dailyQuota为50
  const result = await prisma.user.updateMany({
    where: {
      isAdmin: false
    },
    data: {
      dailyQuota: 50
    }
  });
  
  console.log(`✅ 已更新 ${result.count} 个用户的每日额度为50次`);
}

main()
  .catch((e) => {
    console.error('更新失败:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
