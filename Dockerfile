FROM node:22-slim
LABEL "language"="nodejs"
LABEL "framework"="express"
WORKDIR /src
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm install
RUN npm run build
RUN npm run prisma:generate
EXPOSE 8080
CMD ["npm", "start"]
