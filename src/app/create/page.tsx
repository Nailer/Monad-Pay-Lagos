"use client";

import { useState, useEffect } from "react";
import { parseEther, createWalletClient, custom, http, createPublicClient } from "viem";
import { useActiveAccount } from "thirdweb/react";
import { CONTRACT_ADDRESS, escrowAbi } from "@/lib/abi";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Define Monad Testnet Constants
const MONAD_CHAIN = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
};

export default function CreateTrade() {
  const account = useActiveAccount();
  const router = useRouter();

  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [metadata, setMetadata] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!account) {
      setError("Please connect your wallet first.");
      return;
    }

    // Check if window.ethereum exists (MetaMask/Browser Wallet)
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No browser wallet detected. Please install MetaMask.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create a direct Viem Wallet Client using the browser provider
      // This bypasses the 401 Unauthorized RPC error
      const walletClient = createWalletClient({
        chain: MONAD_CHAIN,
        transport: custom(window.ethereum),
      });

      // 2. Create a Public Client for waiting for the receipt
      const publicClient = createPublicClient({
        chain: MONAD_CHAIN,
        transport: http("https://testnet-rpc.monad.xyz"),
      });

      // 3. Execute the Contract Call
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName: "createTrade",
        args: [seller as `0x${string}`, metadata],
        value: parseEther(amount),
        account: account.address as `0x${string}`,
      });

      console.log("Transaction Hash:", hash);

      // 4. Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      });
      
      if (receipt.status === "success") {
        router.push("/dashboard");
      } else {
        setError("Transaction failed on-chain. Check explorer for details.");
      }
    } catch (err: any) {
      console.error("Create Trade Error:", err);
      // Clean up common error messages for the user
      const message = err.shortMessage || err.message || "Transaction failed";
      setError(message.includes("User rejected") ? "Transaction cancelled by user." : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center py-20 px-6 relative z-10 w-full max-w-2xl mx-auto">
      {/* Back Button */}
      <Link href="/dashboard" className="self-start flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#FF007A]/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#FF007A]" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">New Escrow</h2>
        </div>
        
        <p className="text-zinc-400 mb-8 font-medium">
          Lock your funds on Monad. Money is only released when you confirm delivery.
        </p>
        
        {error && (
          <div className="p-4 mb-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-6">
          {/* Seller Address */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Seller Wallet Address</label>
            <input 
              required
              type="text" 
              placeholder="0x..." 
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#FF007A]/50 transition-all placeholder:text-zinc-700 font-mono text-sm"
            />
          </div>
          
          {/* Amount */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Amount to Secure (MON)</label>
            <div className="relative">
              <input 
                required
                type="number" 
                step="0.0001"
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#FF007A]/50 transition-all placeholder:text-zinc-700 font-bold text-lg"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-xs tracking-tighter">MONAD TESTNET</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Trade Details / Waybill Info</label>
            <textarea 
              required
              placeholder="Describe the item (e.g. iPhone 15 Pro Max, Lagos delivery)..." 
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              className="bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#FF007A]/50 transition-all placeholder:text-zinc-700 min-h-[120px] resize-none text-sm leading-relaxed"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 relative group overflow-hidden px-8 py-5 rounded-2xl bg-[#FF007A] text-white font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-pink-500/20"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Finalizing on Monad...</>
              ) : (
                "Fund & Secure Trade"
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
          Protected by Monad Pay-Lagos Safe-Hand Protocol
        </p>
      </div>
    </div>
  );
}