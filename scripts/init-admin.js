const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('检查管理员账号...');
  
  // 检查是否已有管理员
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' }
  });
  
  if (existingAdmin) {
    console.log('✅ 管理员账号已存在，跳过创建');
    return;
  }
  
  // 创建管理员账号
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      balance: 9999
    }
  });
  
  console.log('✅ 管理员账号创建成功！');
  console.log('   用户名: admin');
  console.log('   密码: admin123');
  console.log('   请登录后立即修改密码！');
}

main()
  .catch((e) => {
    console.error('初始化管理员失败:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
