# Monad Pay Lagos 🇳🇬💸

**Monad Pay Lagos** is a modern Next.js-based escrow and payment platform built on the Monad blockchain. The platform aims to provide trustless, seamless, and secure trade capabilities by utilizing smart contracts, delivering the high performance of Monad combined with intuitive user interfaces.

## 🚀 Key Features

* **Decentralized Escrow** mechanisms to secure payments between parties.
* **Premium User Interface** built with modern aesthetics, utilizing Next.js, and Tailwind CSS.
* **Wallet Connectivity** integrated effortlessly using [Thirdweb](https://thirdweb.com/).
* **Secure Smart Contract interactions** handled primarily with `viem`.

---

## 📜 Smart Contract Information

The core functionalities of this escrow application are governed by a robust smart contract on the blockchain. 

### Deployment Overview

| Property | Details |
| :--- | :--- |
| **Network** | Monad |
| **Contract Address** | `0xd0cc532f55ce6849d5b70e24d6188073f8921621` |
| **Deployment Method** | This contract was successfully compiled and deployed using the [Remix IDE](https://remix.ethereum.org/). |

### Application Binary Interface (ABI)

To interact with the smart contract, the ABI is explicitly required. It has been made available within the standard directory structure of this repository.

📂 **ABI File Location:** [`abi/monad_pay_lagos.json`](./abi/monad_pay_lagos.json)

*You can import this JSON file straight into your frontend code (as seen within `src/lib/abi.ts` or similar files) to properly interact with the predefined functions of the contract.*

---

## 🛠 Technologies Used

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Core Framework** | [Next.js (v16+)](https://nextjs.org/) | The React framework used for server-side rendering and client routing. |
| **Web3 & Wallets** | [Thirdweb v5](https://thirdweb.com/) | For flexible and reliable wallet connection and management. |
| **Blockchain Sync** | [viem](https://viem.sh/) | A modern TypeScript interface for Ethereum and compatible chains. |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS framework for rapid and modern UI development. |
| **Icons** | [Lucide React](https://lucide.dev/) | Beautiful and consistent scalable vector icons. |

---

## ⚙️ How to Start the Project

Follow these instructions to quickly spin up the development environment.

### 1. Installation

After cloning the repository, install the necessary dependencies using your preferred package manager.

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Environment Variables

Create a `.env` (or `.env.local`) file at the root of your project directory. Ensure the deployed contract address is placed within the environment variables for smooth interaction:

```env
CONTRACT_ADDRESS=0xd0cc532f55ce6849d5b70e24d6188073f8921621
```
*(Add API keys for Thirdweb if your setup implies any specific keys).*

### 3. Start the Development Server

Boot up the local Next.js server.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### 4. Open in Browser

Finally, navigate to [http://localhost:3000](http://localhost:3000) using your web browser. You should see the application running. Any edits you make in `src/app/page.tsx` will automatically re-compile and update live on the screen!

---

## 📁 Repository Structure

For developers looking to dive right in, here's a brief overview of the project's layout:

```text
Monad_Pay_Lagos/
├── abi/                        # Contains the ABI JSON files
│   └── monad_pay_lagos.json    # The smart contract ABI for the project
├── public/                     # Static media files and generic assets
└── src/                        # Main source code directory
    ├── app/                    # Next.js App Router (Pages & Layouts)
    │   ├── create/             # Route to create an escrow
    │   ├── dashboard/          # Route for user dashboards
    │   └── ...                 
    └── lib/                    # Configuration and setup scripts
```

## 🤝 Contributing

We heartily welcome contributions from the community! Feel free to review the issue tracker, fork the repository, and submit Pull Requests to help us improve the platform.
