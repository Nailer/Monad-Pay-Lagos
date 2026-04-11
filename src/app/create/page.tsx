"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { viemAdapter } from "thirdweb/adapters/viem";
import { client } from "@/app/client";
import { CONTRACT_ADDRESS, escrowAbi } from "@/lib/abi";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CreateTrade() {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
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

    if (!chain) {
      setError("Waiting for network connection...");
      return;
    }

    setLoading(true);

    try {
      // 1. Convert active thirdweb account to Viem Wallet Client
      const walletClient = viemAdapter.walletClient.toViem({
        client,
        chain,
        account,
      });

      // 2. Initialize viem public client for reading chain data
      const publicClient = viemAdapter.publicClient.toViem({
        client,
        chain,
      });

      // 3. Make the smart contract call using native Viem
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName: "createTrade",
        args: [seller as \`0x\${string}\`, metadata],
        value: parseEther(amount),
      });

      // 4. Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === "success") {
        router.push("/dashboard");
      } else {
        setError("Transaction failed on-chain.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center py-24 px-6 relative z-10 w-full max-w-2xl mx-auto">
      <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white mb-2">Create Escrow</h2>
        <p className="text-zinc-400 mb-8">Lock funds securely until your terms are met.</p>
        
        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Seller Wallet Address</label>
            <input 
              required
              type="text" 
              placeholder="0x..." 
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Amount to Lock (MON)</label>
            <input 
              required
              type="number" 
              step="0.0001"
              placeholder="e.g. 1.5" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Trade Terms / Metadata</label>
            <textarea 
              required
              placeholder="Description of the goods or services..." 
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50 transition-colors min-h-[100px] resize-y"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 flex items-center justify-center gap-2 w-full px-8 py-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Fund & Create Trade"}
          </button>
        </form>
      </div>
    </div>
  );
}
