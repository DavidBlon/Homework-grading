FROM node:22
LABEL "language"="nodejs"
LABEL "framework"="express"
WORKDIR /src
COPY . .
RUN npm install
RUN npm run build
RUN npm run prisma:generate
EXPOSE 8080
CMD ["npm", "start"]
