# clone Product Spec

## Working Definition

clone is a consumer app for creating, publishing, discovering, and chatting with portable agentic brains.

A brain is a reusable thinking layer created from a person's writing, decisions, public posts, and connected knowledge sources. People can browse brains, chat with them, and use them as capability-bound thinking companions inside the clone app.

In one sentence:

> clone lets anyone turn their public/private knowledge into a paid, portable brain people can discover and chat with.

## Core Product Loop

1. A creator builds a brain from their data.
2. clone generates a structured Brain Profile.
3. The brain receives a Brain ID and public profile.
4. Other users discover the brain in an explore marketplace.
5. Users chat with the brain inside clone.
6. Paid brains charge for usage.
7. The creator earns from usage.

## Product Boundary

The first product is the app:

- create a brain
- publish a brain profile
- browse brains
- chat with brains
- pay for premium brain access
- let creators manage pricing, profile, and earnings

## Why This Is Useful

Most AI chat products are generic. They can answer questions, but they do not carry a specific person's taste, history, judgment, or domain lens.

clone makes expertise browseable and usable.

Examples:

- A product brain can review an app idea.
- A trader brain can reason about a market setup.
- A founder brain can evaluate startup direction.
- A writing brain can critique voice and structure.
- A security brain can inspect a technical plan.

The user does not need to scrape posts, build embeddings, tune prompts, or recreate a person's style. They open the brain and chat.

## Capability-Bound Brains

A brain is not a generic shell with random tools attached.

Each brain has intrinsic capabilities based on its source data, category, expertise, and permissions.

Examples:

- A trader brain can discuss trades, risk, and market setups.
- A product brain can critique product direction and UX.
- A writing brain can edit voice and structure.
- A non-trading brain should not pretend it can trade.
- A non-security brain should not present itself as a security expert.

The product should make capability boundaries visible in the profile and enforce them during chat.

## Brain Builder

The Brain Builder is the creator-facing interface for making a new brain.

### Builder Flow

1. Basic identity
   - name
   - handle
   - bio
   - category
   - description
   - avatar/banner

2. Brain purpose
   - what this brain is best at
   - what it should never be used for
   - what kind of people should use it
   - pricing preference

3. Data sources
   - X/Twitter connection
   - uploaded files
   - Google Docs
   - Medium
   - Paragraph
   - Substack
   - pasted essays/posts
   - product docs
   - examples of good and bad outputs

4. Brain preview
   - extracted style
   - topics
   - beliefs
   - reasoning patterns
   - strengths
   - limitations
   - capabilities
   - examples

5. Publish
   - create Brain ID
   - set category
   - set price
   - publish marketplace listing

## X As First Brain Layer

X should be the first supported source because it gives a dense, public signal of:

- voice
- opinions
- taste
- recurring topics
- emotional triggers
- social context
- short-form judgment
- live market/category awareness

Other sources can layer on top later.

Initial rule:

> X is the base personality layer. Docs/articles/files become deeper knowledge and expertise layers.

## Future Data Sources

After X, add:

- Google Docs for private thinking and drafts
- Medium/Paragraph/Substack for long-form reasoning
- PDFs and markdown files for domain knowledge
- GitHub repos for technical/project brains
- transcripts for conversational voice
- manual examples for alignment and correction

## Brain Profile

Each brain should generate a structured profile.

### Suggested Brain Profile Fields

- `brainId`
- `ownerAddress`
- `displayName`
- `handle`
- `category`
- `description`
- `avatarUrl`
- `price`
- `version`
- `sources`
- `voiceProfile`
- `writingExamples`
- `coreBeliefs`
- `opinions`
- `topicMap`
- `reasoningStyle`
- `strengths`
- `limitations`
- `capabilities`
- `disallowedUses`
- `emotionalTriggers`
- `blindSpots`
- `contradictions`
- `vocabularyFingerprint`
- `createdAt`
- `updatedAt`

## Brain Explore

The explore page is the marketplace/discovery surface.

Users should be able to browse brains by:

- category
- popularity
- usage
- price
- rating
- newest
- best performing
- featured

### Brain Categories

Examples:

- Product
- DeFi
- Trading
- Startups
- Writing
- Design
- Security
- Research
- Governance
- Marketing
- Engineering
- Culture
- Consumer Apps

Each category should have a ranking:

> Best Product Brains, Best DeFi Brains, Best Writing Brains, etc.

### Brain Card

Each brain card should show:

- avatar
- name
- Brain ID
- category
- short description
- price
- usage count
- rating or quality signal
- top strengths
- capability tags
- open chat button

This can borrow heavily from the existing profile cards and explore UI.

## Brain Detail Page

Clicking a brain opens a detail page.

It should show:

- brain identity
- owner
- description
- category
- price
- Brain ID
- source summary
- personality/voice summary
- reasoning strengths
- limitations
- capability boundaries
- sample outputs
- usage examples
- reviews/ratings
- payment/access status
- primary chat CTA

This can borrow from the existing profile detail page.

Important:

> The brain detail page is not just a profile. It is a conversion page for chatting with the brain.

## Chat Experience

The chat is the core usage surface.

Users should be able to:

- open a brain and start chatting immediately
- see whether the brain is free or paid
- understand what the brain is good at
- receive answers that match the brain's voice and judgment
- get clear refusal or redirection when the request is outside the brain's capability
- review/rate the brain after use

The product should feel closer to talking to a capable specialist than querying a generic bot.

## Payments and Wallets

This needs a clear access/payment model.

There are two users:

1. Brain creators
2. People who consume brains

### Creator Wallet

Creators need a wallet to:

- own the brain
- receive usage fees
- manage brain metadata
- withdraw earnings

This can reuse the existing Privy wallet setup.

### Consumer Wallet

Users need a wallet or app account to:

- pay for premium brain usage
- access paid brains
- track spending
- receive usage receipts

### Suggested Payment Model

Start simple:

- free brains can be chatted with without payment
- paid brains require credits or a wallet payment
- usage is metered inside the app
- creators see usage and earnings in the dashboard

Hackathon/demo model:

1. User connects wallet.
2. User buys credits or pays a usage fee.
3. clone checks access.
4. The chat runs.
5. Usage is recorded.
6. Creator sees usage/earnings.

## Onchain Layer

The app should run on Base.

Base is the chain for:

- creator wallets
- token/payment flows
- creator earnings
- fee claims
- future access passes or collectibles

The existing Base/Clanker pieces are the starting point for this layer.

## Example Demo App Flow

The demo should prove that clone is useful as a consumer app.

Recommended demo: **Product Review Brain**

1. User opens clone.
2. User browses Product brains.
3. User opens a brain detail page.
4. User sees the brain's strengths, limitations, and capability tags.
5. User starts a chat.
6. User submits a product idea or landing page copy.
7. The brain reviews it through the creator's judgment style.
8. User sees the response is meaningfully different from generic AI output.
9. Usage is recorded.
10. Creator dashboard shows the chat usage.

Optional second demo: **Trading Brain**

1. User browses Trading brains.
2. User opens a trader brain.
3. User asks for market reasoning.
4. The app makes clear this brain can discuss trades because trading is part of its capability profile.
5. A non-trading brain refuses the same request or redirects it.

## Repurposing Existing App Work

We should repurpose the existing app foundation instead of starting from scratch.

The current app already has:

- X ingestion
- voice analysis
- writing example selection
- core brain generation
- RAG chunks
- proxy chat
- proxy detail pages
- explore UI
- wallet/auth pieces
- creator/proxy data model
- Base token/payment pieces

### Keep

- brain-builder pipeline
- voice-analysis pipeline
- example-selector
- chat context builder
- X ingestion
- proxy/profile cards
- explore UI
- detail page layout
- Privy wallet/auth
- database patterns for brain JSON and chunks
- Base payment/token infrastructure

### Remove or De-Emphasize

- bot-based consumer framing
- Twitter bot as the primary creation flow
- market speculation around proxies
- external integration positioning
- sponsor-integration language
- any non-Base chain pivot

### Add

- Brain Builder onboarding
- manual uploads/connectors
- Brain ID
- capability manifest
- capability-bound chat behavior
- brain marketplace framing
- creator pricing and earnings
- clearer paid/free access model

## Frontend Pages

Recommended pages:

- `/` landing page
- `/build` Brain Builder
- `/explore` brain marketplace
- `/brains/[id]` brain detail page
- `/dashboard` creator dashboard
- `/wallet` wallet/credits/earnings
- `/chat/[brainId]` dedicated chat page
- `/demo/product-review` sample demo flow

## Build Priorities

### Must Have

- Brain Builder with X as first source
- Brain profile generation from X/posts/files
- Brain ID
- Explore page with brain cards
- Brain detail page with clear chat CTA
- Capability-bound chat
- Paid/free brain access
- Creator dashboard
- Base wallet/payment support

### Should Have

- ratings/reviews
- usage events
- creator earnings summary
- clean onboarding
- demo video script

### Nice To Have

- Medium/Paragraph/Substack connectors
- Google Docs import
- DeFi research demo
- public leaderboards
- access passes or collectible ownership on Base

## Main Risks

### Risk: It Feels Like A Clone App

Avoid saying "clone people."

Say:

> clone creates portable agentic brains from user-provided knowledge and writing.

### Risk: Marketplace Is Too Big

The marketplace only needs to prove discovery, profile quality, and chat usage.

Do not overbuild search, reviews, rankings, or monetization in v1.

### Risk: Payments Get Complicated

For the hackathon, use a simple credit/access model.

Do not let billing block the main demo.

### Risk: Too Much Legacy Product Framing

Keep the brain engine. Rebrand the product surface.

The story should not be about proxy speculation.

## Best Product Framing

clone is:

> A marketplace for portable agentic brains.

More concrete:

> clone lets creators publish persona/expertise brains that other people can discover, chat with, and pay to use.

Most app-focused:

> clone turns public writing and private context into paid specialist brains with profiles, capability boundaries, and chat.

## Three-Minute Demo Script

1. Open clone.
2. Create a new brain from X/posts/files.
3. Show extracted profile: voice, beliefs, expertise, reasoning style.
4. Show capability boundaries.
5. Publish brain.
6. Open explore page.
7. Click the brain detail page.
8. Start chat.
9. Submit a product idea.
10. Show the brain reviewing it in the creator's judgment style.
11. Ask an out-of-scope question.
12. Show the capability-bound refusal or redirect.
13. Show usage recorded.
14. Show creator dashboard with usage/earnings.

## Final Product Boundary

clone should not try to be every agent platform.

The boundary is:

> clone creates and serves reusable brains people can discover, chat with, and pay to use.
