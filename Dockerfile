FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10.6.5
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
ARG VITE_API_URL
ARG VITE_PRIVY_APP_ID
ENV VITE_API_URL=$VITE_API_URL VITE_PRIVY_APP_ID=$VITE_PRIVY_APP_ID
RUN pnpm run build
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
