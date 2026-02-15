FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src/ src/
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
CMD ["node", "--no-deprecation", "src/bot.mjs"]
