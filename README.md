# Pokémon GO Account Auction Website

A secure, real-time, escrow-backed auction platform for Pokémon GO trainer accounts and digital assets. Built with Next.js, Socket.io, MongoDB/Mongoose, and Razorpay.

## Documentation

To help understand the platform's vision, architecture, and operational guidelines, please refer to the following documentation:

1. **[Website Purpose & Overview](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/docs/website-purpose.md)**: Explains the core purpose of the platform, user roles (Sellers, Buyers, Admins), problems solved (escrow, trust verification, auction default cascade), and the general workflow.
2. **[Admin Control Center Operations Guide](file:///run/media/sourav/New%20Volume/Projects/pokemon-go-auction-website/docs/admin-guide.md)**: Details the step-by-step instructions for platform operators using the `/admin` portal (Review Auditor, Live Room Kill Switch, Escrow Pipeline, Credentials Vault, Cascade Engine, and Webhook Watchdog).

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`.

3. Start the development server:
   ```bash
   npm run dev
   ```
