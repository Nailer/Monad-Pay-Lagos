"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { viemAdapter } from "thirdweb/adapters/viem";
import { client } from "@/app/client";
import { CONTRACT_ADDRESS, escrowAbi } from "@/lib/abi";
import { formatEther } from "viem";
import { Loader2, ShieldAlert, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

type TradeData = {
  buyer: string;
  seller: string;
  amount: bigint;
  released: boolean;
  sellerApprovedRefund: boolean;
  metadata: string;
};

export default function TradeDetail() {
  const params = useParams();
  const tradeId = BigInt(params.id as string);
  
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const router = useRouter();

  const [trade, setTrade] = useState<TradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTrade = useCallback(async () => {
    if (!chain) return;

    try {
      const publicClient = viemAdapter.publicClient.toViem({ client, chain });
      const res = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName: "trades",
        args: [tradeId],
      });

      setTrade({
        buyer: res[0],
        seller: res[1],
        amount: res[2],
        released: res[3],
        sellerApprovedRefund: res[4],
        metadata: res[5],
      });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch trade details.");
    } finally {
      setLoading(false);
    }
  }, [chain, tradeId]);

  useEffect(() => {
    fetchTrade();
  }, [fetchTrade]);

  const executeAction = async (functionName: "releaseToSeller" | "sellerApproveRefund" | "buyerClaimRefund") => {
    if (!account || !chain) {
      setError("Please connect your wallet correctly.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const walletClient = viemAdapter.walletClient.toViem({ client, chain, account });
      const publicClient = viemAdapter.publicClient.toViem({ client, chain });

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName,
        args: [tradeId],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await fetchTrade(); // Reload UI
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Transaction failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-zinc-600 animate-spin" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Trade not found</h2>
        <Link href="/dashboard" className="text-zinc-400 hover:text-white underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isBuyer = account?.address.toLowerCase() === trade.buyer.toLowerCase();
  const isSeller = account?.address.toLowerCase() === trade.seller.toLowerCase();
  const isConnectedParticipant = isBuyer || isSeller;
  const isCompleted = trade.released || (trade.sellerApprovedRefund && trade.amount === BigInt(0)); // Crude logic check if refund claimed

  return (
    <div className="flex-1 flex flex-col items-center py-16 px-6 relative z-10 w-full max-w-3xl mx-auto">
      <div className="w-full mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Trades
        </Link>
      </div>

      <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Trade #{params.id}</h2>
            <p className="text-zinc-400">Manage escrow terms securely.</p>
          </div>
          <div className={\`px-4 py-2 rounded-full font-bold text-sm \${trade.released ? 'bg-green-500/10 text-green-400 border border-green-500/20' : trade.sellerApprovedRefund ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}\`}>
            {trade.released ? "Completed (Released)" : trade.sellerApprovedRefund ? "Refund Authorized" : "Funds Locked"}
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-black border border-zinc-800">
              <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Locked Amount</span>
              <span className="text-2xl font-bold text-white">{formatEther(trade.amount)} MON</span>
            </div>
            <div className="p-5 rounded-2xl bg-black border border-zinc-800">
              <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Status</span>
              {trade.released ? (
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <CheckCircle2 className="w-5 h-5" /> Escrow Concluded
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-400 font-medium">
                  <ShieldAlert className="w-5 h-5" /> Secured On-Chain
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black border border-zinc-800">
             <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Terms & Metadata</span>
             <p className="text-zinc-300 font-medium whitespace-pre-wrap">{trade.metadata}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
             <div className="p-5 rounded-2xl bg-black border border-zinc-800 truncate">
               <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Buyer</span>
               <span className={\`font-mono \${isBuyer ? 'text-white' : 'text-zinc-400'}\`}>{trade.buyer} {isBuyer && "(You)"}</span>
             </div>
             <div className="p-5 rounded-2xl bg-black border border-zinc-800 truncate">
               <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Seller</span>
               <span className={\`font-mono \${isSeller ? 'text-white' : 'text-zinc-400'}\`}>{trade.seller} {isSeller && "(You)"}</span>
             </div>
          </div>
        </div>

        {/* Action Panel */}
        {!trade.released && isConnectedParticipant && (
          <div className="mt-8 pt-8 border-t border-zinc-800">
            <h3 className="text-xl font-bold text-white mb-4">Required Actions</h3>
            <div className="flex flex-col gap-4">
              
              {isBuyer && !trade.sellerApprovedRefund && (
                <button 
                  onClick={() => executeAction("releaseToSeller")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center px-6 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Satisfied? Release Funds to Seller
                </button>
              )}

              {isSeller && !trade.sellerApprovedRefund && (
                <button 
                  onClick={() => executeAction("sellerApproveRefund")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center px-6 py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Authorize Refund for Buyer
                </button>
              )}

              {isBuyer && trade.sellerApprovedRefund && (
                <button 
                  onClick={() => executeAction("buyerClaimRefund")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center px-6 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Claim Authorized Refund
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
