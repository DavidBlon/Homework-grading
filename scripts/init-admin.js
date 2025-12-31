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
    return;
  }
  
  // 创建管理员教师账号
  const hashedPassword = await bcrypt.hash('teacher123', 10);
  
  const admin = await prisma.user.create({
    data: {
      username: 'teacher1',
      password: hashedPassword,
      role: 'teacher',
      isAdmin: true,
      balance: 9999,
      dailyQuota: 999
    }
  });
  
  console.log('✅ 管理员教师账号创建成功！');
  console.log('   用户名: teacher1');
  console.log('   密码: teacher123');
  console.log('   角色: 教师(管理员)');
  console.log('   请登录后立即修改密码！');
}

main()
  .catch((e) => {
    console.error('初始化管理员失败:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
