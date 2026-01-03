const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('检查管理员账号...');
  
  // 检查是否已有管理员教师
  const existingAdmin = await prisma.user.findFirst({
    where: { isAdmin: true }
  });
  
  if (existingAdmin) {
    console.log('✅ 管理员账号已存在，跳过创建');
  } else {
    // 创建管理员账号
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'teacher',
        isAdmin: true,
        balance: 9999,
        dailyQuota: 999
      }
    });
    
    console.log('✅ 管理员账号创建成功！');
    console.log('   用户名: admin');
    console.log('   密码: admin123');
    console.log('   角色: 教师(管理员)');
    console.log('   请登录后立即修改密码！');
  }
  
  // 更新所有非管理员用户的每日额度为50
  console.log('检查用户额度...');
  const result = await prisma.user.updateMany({
    where: {
      isAdmin: false,
      dailyQuota: { lt: 50 }
    },
    data: {
      dailyQuota: 50
    }
  });
  
  if (result.count > 0) {
    console.log(`✅ 已更新 ${result.count} 个用户的每日额度为50次`);
  } else {
    console.log('✅ 所有用户额度已是最新');
  }
}

main()
  .catch((e) => {
    console.error('初始化管理员失败:', e);
    process.exit(1);  // ← 添加这一行
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
