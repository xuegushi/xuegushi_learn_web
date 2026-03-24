# ====== 阶段0：指定node镜像 ======
FROM node:22-alpine AS base
LABEL maintainer="https://github.com/johnnyzhang1992"

ENV NODE_OPTIONS="--max-old-space-size=2048 --expose-gc"

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com && npm i -g pnpm
# COPY node_modules ./node_modules
# COPY package-lock.json ./
# COPY pnpm-lock.yaml ./
COPY package.json pnpm-lock.yaml ./
RUN pnpm install next@16.1.7
COPY .next ./.next
COPY public ./public

EXPOSE 2345
CMD ["pnpm", "start"]