"use client";

import { useEffect, useState, useCallback } from "react";
import { useActiveWalletChain } from "thirdweb/react";
import { viemAdapter } from "thirdweb/adapters/viem";
import { client } from "@/app/client";
import { CONTRACT_ADDRESS, escrowAbi } from "@/lib/abi";
import Link from "next/link";
import { formatEther } from "viem";
import { Loader2, ArrowRight } from "lucide-react";

type TradeData = {
  id: number;
  buyer: string;
  seller: string;
  amount: bigint;
  released: boolean;
  sellerApprovedRefund: boolean;
  metadata: string;
};

export default function Dashboard() {
  const chain = useActiveWalletChain();
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrades = useCallback(async () => {
    if (!chain) {
      setError("Please connect your wallet and switch to the correct network.");
      setLoading(false);
      return;
    }

    try {
      const publicClient = viemAdapter.publicClient.toViem({ client, chain });

      // Get nextTradeId to know how many trades exist
      const nextTradeIdStr = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName: "nextTradeId",
      });

      const nextTradeId = Number(nextTradeIdStr);

      if (nextTradeId === 0) {
        setTrades([]);
        setLoading(false);
        return;
      }

      // Fetch the last 10 trades (or fewer if there are less than 10)
      const startId = Math.max(0, nextTradeId - 10);
      const tradesToFetch = [];

      for (let i = nextTradeId - 1; i >= startId; i--) {
        tradesToFetch.push(
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: escrowAbi,
            functionName: "trades",
            args: [BigInt(i)],
          }).then((res) => ({
            id: i,
            buyer: res[0],
            seller: res[1],
            amount: res[2],
            released: res[3],
            sellerApprovedRefund: res[4],
            metadata: res[5]
          }))
        );
      }

      const fetchedTrades = await Promise.all(tradesToFetch);
      setTrades(fetchedTrades as TradeData[]);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to load trades. Ensure you are on Monad Testnet.");
    } finally {
      setLoading(false);
    }
  }, [chain]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-zinc-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-24 px-6 max-w-5xl mx-auto w-full z-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Recent Escrows</h2>
          <p className="text-zinc-400">View and manage the latest trades created.</p>
        </div>
        <Link href="/create" className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors">
          + New Escrow
        </Link>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
          <p className="text-zinc-500 mb-4">No trades have been created yet on this network.</p>
          <Link href="/create" className="text-white hover:underline underline-offset-4">Be the first to create one</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trades.map((trade) => (
            <Link href={\`/trade/\${trade.id}\`} key={trade.id} className="group flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-white/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-zinc-700 to-zinc-900 opacity-50" />
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  ID: #{trade.id}
                </span>
                <span className={\`text-xs font-bold px-3 py-1 rounded-full \${trade.released ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}\`}>
                  {trade.released ? 'Completed' : 'Locked'}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{formatEther(trade.amount)} MON</h3>
              <p className="text-sm text-zinc-400 mb-6 truncate">{trade.metadata}</p>
              
              <div className="mt-auto flex items-center justify-between text-sm">
                <span className="text-zinc-500 group-hover:text-white transition-colors">Manage Trade</span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
