import { ConnectButton } from "thirdweb/react";
import { client } from "@/app/client";
import { defineChain } from "thirdweb";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 bg-black/80 transition-all duration-300">
      <Link href="/" className="flex items-center gap-3 cursor-pointer group hover:opacity-80">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10 group-hover:shadow-white/30 transition-shadow">
          <span className="font-bold text-black text-xl tracking-tighter">MP</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Monad Pay
        </span>
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
          Dashboard
        </Link>
        <Link href="/create" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden sm:block">
          New Escrow
        </Link>
        <ConnectButton 
          client={client} 
          theme="dark" 
          connectModal={{ size: "wide" }}
          chain={defineChain(10143)}
        />
      </div>
    </header>
  );
}
