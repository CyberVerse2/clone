# clone

clone is an AI clone marketplace and chat app built on Base.

Creators can turn their public writing and connected knowledge into an AI clone that other people can discover, chat with, collect, and support. Each live clone can have a Base token and creator fee flow.

## Current Stack

- Next.js App Router
- React
- Tailwind CSS
- PostgreSQL + Drizzle
- Privy auth and embedded wallets
- X/Twitter ingestion
- Vercel AI SDK
- Base + Clanker token deployment
- Uniswap Trading API swaps

## Hackathon Note

This repository is being reset as a fresh `clone` workspace, but the codebase began as the existing Proxi app. Any hackathon submission should clearly disclose which parts were pre-existing and which integrations or product changes were built during the event.

## Development

```bash
npm run dev
npm run build
npm run lint
```

Set `UNISWAP_API_KEY` for live clone-token buys and sells.
