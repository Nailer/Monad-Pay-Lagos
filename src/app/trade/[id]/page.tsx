"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { createPublicClient, createWalletClient, http, custom, formatEther } from "viem";
import { CONTRACT_ADDRESS, escrowAbi } from "@/lib/abi";
import { Loader2, ShieldAlert, CheckCircle2, ArrowLeft, Info, HelpCircle } from "lucide-react";
import Link from "next/link";

const MONAD_CHAIN = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
};

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
  const idStr = params?.id as string;
  const tradeId = idStr ? BigInt(idStr) : BigInt(0);
  
  const account = useActiveAccount();
  const [trade, setTrade] = useState<TradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTrade = useCallback(async () => {
    if (!idStr) return;
    try {
      const publicClient = createPublicClient({
        chain: MONAD_CHAIN as any,
        transport: http("https://testnet-rpc.monad.xyz"),
      });

      const res = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName: "trades",
        args: [tradeId],
      }) as any;

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
      setError("Failed to fetch trade details from Monad.");
    } finally {
      setLoading(false);
    }
  }, [idStr, tradeId]);

  useEffect(() => {
    fetchTrade();
  }, [fetchTrade]);

  const executeAction = async (functionName: "releaseToSeller" | "sellerApproveRefund" | "buyerClaimRefund") => {
    if (!account || !window.ethereum) {
      setError("Please connect MetaMask first.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const MONAD_CHAIN = {
        id: 10143,
        name: "Monad Testnet",
        nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
        rpcUrls: {
          default: { http: ["https://testnet-rpc.monad.xyz"] },
          public: { http: ["https://testnet-rpc.monad.xyz"] },
        },
      };
      const walletClient = createWalletClient({
        chain: MONAD_CHAIN as any,
        transport: custom(window.ethereum),
      });

      const publicClient = createPublicClient({
        chain: MONAD_CHAIN as any,
        transport: http("https://testnet-rpc.monad.xyz"),
      });


      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: escrowAbi,
        functionName,
        args: [tradeId],
        account: account.address as `0x${string}`,
        chain: MONAD_CHAIN as any, // <--- ADD THIS LINE TO FIX THE ERROR
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await fetchTrade(); // Reload UI state
    } catch (err: any) {
      console.error(err);
      setError(err.shortMessage || "Transaction failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-[#FF007A] animate-spin mb-4" />
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Loading Ledger State...</p>
    </div>
  );

  if (!trade) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <HelpCircle className="w-16 h-16 text-zinc-800 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Trade Record Not Found</h2>
      <Link href="/dashboard" className="text-[#FF007A] hover:underline">Return to Dashboard</Link>
    </div>
  );

  const isBuyer = account?.address.toLowerCase() === trade.buyer.toLowerCase();
  const isSeller = account?.address.toLowerCase() === trade.seller.toLowerCase();

  return (
    <div className="flex-1 flex flex-col items-center py-16 px-6 relative z-10 w-full max-w-3xl mx-auto">
      <div className="w-full mb-8 flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px]">
          <ArrowLeft className="w-4 h-4" /> Back to Ledger
        </Link>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${trade.released ? 'bg-zinc-500' : 'bg-green-500'}`} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Monad Live Status</span>
        </div>
      </div>

      <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl">
        {/* Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h2 className="text-4xl font-black text-white mb-2">Trade #00{idStr}</h2>
            <div className="flex items-center gap-2 text-zinc-500 text-sm italic">
                <Info className="w-4 h-4" />
                <span>{trade.metadata}</span>
            </div>
          </div>
          <div className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest border ${
            trade.released 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : trade.sellerApprovedRefund 
                ? 'bg-blue-500/10 text-blue-400 border-blue-400/20' 
                : 'bg-[#FF007A]/10 text-[#FF007A] border-[#FF007A]/20'
          }`}>
            {trade.released ? "Settled" : trade.sellerApprovedRefund ? "Refund Ready" : "Funds Escrowed"}
          </div>
        </div>

        {error && (
          <div className="p-4 mb-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-[2rem] bg-black/40 border border-zinc-800 flex flex-col justify-center">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Locked Value</span>
              <span className="text-4xl font-black text-white">{formatEther(trade.amount)} <span className="text-sm font-normal text-zinc-500">MON</span></span>
            </div>
            
            <div className="p-8 rounded-[2rem] bg-black/40 border border-zinc-800 flex flex-col justify-center">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Agreement Status</span>
              {trade.released ? (
                <div className="flex items-center gap-3 text-green-400 font-black uppercase tracking-widest text-xs">
                  <CheckCircle2 className="w-6 h-6" /> Concluded
                </div>
              ) : (
                <div className="flex items-center gap-3 text-yellow-500 font-black uppercase tracking-widest text-xs">
                  <ShieldAlert className="w-6 h-6 animate-pulse" /> Protected
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Buyer (Payer)</span>
                 <span className="text-white font-mono text-xs">{trade.buyer.slice(0,10)}...{trade.buyer.slice(-8)}</span>
               </div>
               {isBuyer && <span className="text-[10px] font-black bg-[#FF007A] text-white px-3 py-1 rounded-full">YOU</span>}
             </div>
             <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Seller (Vendor)</span>
                 <span className="text-white font-mono text-xs">{trade.seller.slice(0,10)}...{trade.seller.slice(-8)}</span>
               </div>
               {isSeller && <span className="text-[10px] font-black bg-[#FF007A] text-white px-3 py-1 rounded-full">YOU</span>}
             </div>
          </div>
        </div>

        {/* Action Panel: Only visible if active */}
        {!trade.released && (isBuyer || isSeller) && (
          <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-b from-zinc-800/20 to-transparent border border-zinc-800">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 text-center">Settlement Actions</h3>
            <div className="flex flex-col gap-4">
              
              {isBuyer && !trade.sellerApprovedRefund && (
                <button 
                  onClick={() => executeAction("releaseToSeller")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center px-8 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : null}
                  Confirm Delivery & Release MON
                </button>
              )}

              {isSeller && !trade.sellerApprovedRefund && (
                <button 
                  onClick={() => executeAction("sellerApproveRefund")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center px-8 py-5 bg-zinc-800 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : null}
                  Authorize Return of Funds
                </button>
              )}

              {isBuyer && trade.sellerApprovedRefund && (
                <button 
                  onClick={() => executeAction("buyerClaimRefund")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center px-8 py-5 bg-[#FF007A] text-white font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : null}
                  Withdraw Refund
                </button>
              )}
              
              {!isBuyer && !isSeller && (
                  <p className="text-center text-zinc-600 text-xs italic">You are viewing this trade as an observer.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}