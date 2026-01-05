FROM node:18
LABEL "language"="nodejs"
LABEL "framework"="express"

WORKDIR /src

# 安装 OpenSSL (你写的这行是对的)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

# 先复制 package 文件，利用 Docker 缓存加速构建
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制剩余的所有源代码
COPY . .

# 生成 Prisma Client (建议直接用 npx，不需要依赖 package.json scripts)
RUN npx prisma generate

# 构建项目 (如果你的项目是纯 JS 不需要编译，这行可以注释掉)
# RUN npm run build 

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["npm", "start"]