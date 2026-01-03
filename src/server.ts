import dotenv from 'dotenv';
import app from './app';
import os from 'os';

// 加载环境变量
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0'; // 监听所有网络接口

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 服务器启动成功！`);
  console.log(`\n📡 访问地址：`);
  console.log(`   - 本机访问: http://localhost:${PORT}`);
  
  // 获取本机局域网IP
  const networkInterfaces = os.networkInterfaces();
  Object.keys(networkInterfaces).forEach(interfaceName => {
    const addresses = networkInterfaces[interfaceName];
    if (addresses) {
      addresses.forEach(address => {
        // 只显示IPv4地址，排除内部地址
        if (address.family === 'IPv4' && !address.internal) {
          console.log(`   - 局域网访问: http://${address.address}:${PORT}`);
        }
      });
    }
  });
  
  console.log(`\n💡 提示: 确保防火墙允许端口 ${PORT}\n`);
});



