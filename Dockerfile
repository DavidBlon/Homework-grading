FROM node:18
LABEL "language"="nodejs"
LABEL "framework"="express"
WORKDIR /src
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm install
RUN npm run build
RUN npm run prisma:generate
EXPOSE 8080
CMD ["npm", "start"]
