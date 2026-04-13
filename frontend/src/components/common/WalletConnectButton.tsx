"use client";

import { Loader2, LogOut, Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

type WalletConnectButtonProps = {
  connectLabel?: string;
  compact?: boolean;
};

export default function WalletConnectButton({
  connectLabel = "Connect Wallet",
  compact = false,
}: WalletConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const connector = connectors.find((item) => item.id === "injected") ?? connectors[0];

  if (isConnected) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className={`inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300 transition-all hover:bg-emerald-500/15 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <Wallet size={14} />
        <span className="font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <LogOut size={12} className="opacity-70" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => connector && connect({ connector })}
      disabled={!connector || isPending}
      className={`inline-flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-violet-300 transition-all hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      {isPending ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
      <span>{isPending ? "Connecting..." : connectLabel}</span>
    </button>
  );
}
