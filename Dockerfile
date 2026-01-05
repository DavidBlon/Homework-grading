FROM node:18
LABEL "language"="nodejs"
LABEL "framework"="express"
<<<<<<< HEAD

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
=======
WORKDIR /src
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm install
RUN npm run build
RUN npm run prisma:generate
EXPOSE 8080
CMD ["npm", "start"]
>>>>>>> 37e102a2ff5928dac0832878fb015f5bb403f9a2
