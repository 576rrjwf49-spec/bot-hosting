FROM node:22-alpine

RUN npm install -g pnpm@10

WORKDIR /app

# Workspace config
COPY pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./

# Only the packages the bot needs
COPY lib/db ./lib/db
COPY artifacts/discord-bot ./artifacts/discord-bot

# Regenerate lockfile to fix mismatches and install all dependencies
RUN pnpm install --no-frozen-lockfile

# Push DB schema then start the bot
CMD ["sh", "-c", "pnpm --filter @workspace/db run push && pnpm --filter @workspace/discord-bot run start"]
