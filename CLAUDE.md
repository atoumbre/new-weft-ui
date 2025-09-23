# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Weft Dashboard, a Svelte 5 + SvelteKit web application for interacting with DeFi protocols on the Radix network. The application is built as a decentralized finance dashboard with CDP (Collateralized Debt Position) management, market data display, and lending pools functionality.

### Tech Stack

- **Frontend**: Svelte 5 with runes, SvelteKit
- **Styling**: Tailwind CSS + DaisyUI components
- **Blockchain**: Radix DLT integration via `@radixdlt/radix-dapp-toolkit`
- **Deployment**: Cloudflare Workers/Pages via SvelteKit adapter
- **Price Data**: Pyth Network integration for real-time pricing
- **Package Manager**: pnpm with workspace configuration

## Core Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm check                  # Type check with Svelte
pnpm check:watch           # Type check in watch mode
pnpm lint                  # Run ESLint with auto-fix

# Build & Deploy
pnpm build                 # Build for production
pnpm preview              # Preview build locally via Wrangler
pnpm deploy               # Deploy to Cloudflare

# Cloudflare Workers
pnpm cf-typegen           # Generate Cloudflare Worker types
```

## Architecture

### Store System (Svelte 5 Runes)

The application uses a centralized store system with Svelte 5's new runes syntax:

- **RadixToolkitStore** (`rdt.svelte.ts`): Wallet connection and Radix network integration
- **PriceStore** (`price-store.svelte.ts`): Resource price data from Radix Gateway API
- **XRDPriceStore** (`xrd-price-store.svelte.ts`): XRD price from Pyth Network
- **MarketInfoStore** (`market-info.svelte.ts`): Market configuration and lending pool data
- **CDPStore** (`cdp-store.svelte.ts`): CDP (Collateralized Debt Position) management
- **UserAccountsStore** (`user-accounts.svelte.ts`): User account data and management
- **BaseStore** (`base-store.svelte.ts`): Base store functionality for shared patterns

All stores are initialized in `src/routes/+layout.svelte` and made available via Svelte context.

### Component Structure

- `src/lib/components/`: Main business logic components
- `src/lib/components/common/`: Reusable UI components
- `src/lib/components/forms/`: Form components for user interactions
- `src/routes/`: SvelteKit file-based routing

### Data Flow

1. Stores are initialized on app load in `+layout.svelte`
2. `WeftLedgerSateFetcher` singleton manages Radix Gateway API calls
3. Price data flows through dedicated stores with real-time updates
4. UI components reactively update via Svelte 5 runes (`$derived`, `$state`)

### Key Integrations

- **Radix DApp Toolkit**: Wallet connection, transaction building
- **Babylon Gateway API**: On-chain data retrieval
- **Pyth Network**: Real-time price feeds
- **Cloudflare Workers**: Edge deployment with Wrangler

### Internal Modules

The `src/lib/internal_modules/dist/` contains compiled modules for Radix ledger state fetching. These are pre-built dependencies specific to the Weft protocol.

## Development Notes

- Uses Svelte 5 runes syntax (`$state`, `$derived`, `$effect`) instead of legacy stores
- Context-based dependency injection for store management
- DaisyUI theme system with light/dark mode persistence
- Cloudflare Workers adapter for serverless deployment
- ESLint with Antfu config for code formatting
