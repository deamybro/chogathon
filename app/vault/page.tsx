'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { MONAD_TESTNET } from '@/lib/web3/monadChain';
import { VAULT_BYTECODE, VAULT_ABI } from '@/lib/web3/vaultArtifact';
import { soundSynth } from '@/game/soundEffects';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Coins,
  ArrowRight,
  Wallet,
  AlertCircle,
  Lock,
  RefreshCw,
  Flame,
} from 'lucide-react';

export default function VaultDeployerPage() {
  const { walletAddress, isConnected, setIsWalletModalOpen, shortAddress } = useWallet();

  const [tokenAddress, setTokenAddress] = useState(MONAD_TESTNET.contracts.chogToken);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedVaultAddress, setDeployedVaultAddress] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chogathon_live_vault_address');
    }
    return null;
  });
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [vaultBalance, setVaultBalance] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      soundSynth.playCoin();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1-Click In-App Deployment via Connected Wallet
  const handleDeployVault = async () => {
    if (!isConnected || typeof window === 'undefined' || !(window as any).ethereum) {
      setIsWalletModalOpen(true);
      return;
    }

    try {
      setIsDeploying(true);
      setStatusMessage('Preparing transaction for MetaMask...');
      soundSynth.playLaser(true);

      const ethereum = (window as any).ethereum;

      // 1. Ensure Monad Testnet
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MONAD_TESTNET.chainIdHex }],
        });
      } catch (err) {
        console.warn('Network switch warning:', err);
      }

      // 2. Encode constructor argument: address _chogToken (left-padded 32 bytes)
      const cleanAddress = tokenAddress.trim().toLowerCase().replace('0x', '');
      if (cleanAddress.length !== 40) {
        alert('Invalid $CHOG token address. Must be 40 hex characters.');
        setIsDeploying(false);
        return;
      }

      const encodedArg = cleanAddress.padStart(64, '0');
      const deployData = `${VAULT_BYTECODE}${encodedArg}`;

      setStatusMessage('Please confirm contract deployment in your wallet...');

      // 3. Send deployment transaction
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: walletAddress,
            data: deployData,
          },
        ],
      });

      setDeployTxHash(txHash);
      setStatusMessage('Broadcasting to Monad Testnet... Waiting for confirmation (~1-2 seconds)');

      // 4. Poll for receipt
      let receipt = null;
      let attempts = 0;
      while (!receipt && attempts < 30) {
        await new Promise((r) => setTimeout(r, 1200));
        receipt = await ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        attempts++;
      }

      if (receipt && receipt.contractAddress) {
        const vaultAddr = receipt.contractAddress;
        setDeployedVaultAddress(vaultAddr);
        localStorage.setItem('chogathon_live_vault_address', vaultAddr);
        soundSynth.playVictory();
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#facc15', '#a855f7', '#38bdf8'],
          });
        } catch {}
        setStatusMessage('Contract confirmed on Monad Testnet!');
      } else {
        setStatusMessage('Transaction submitted! Check Monad explorer for your contract address.');
      }
    } catch (err: any) {
      console.error('Deployment error:', err);
      alert(err.message || 'Transaction rejected or failed.');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 font-mono">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/40 bg-emerald-950/30 px-3.5 py-1 text-xs font-bold text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.25)]">
          <ShieldCheck className="h-4 w-4" />
          <span>OFFICIAL MONAD HACKATHON VAULT DEPLOYER</span>
        </div>

        <h1 className="mt-4 text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
          Chog Bounty Vault
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-zinc-300 font-sans">
          Deploy your non-custodial arcade prize vault directly on Monad. Holds your 400 $CHOG reward pool, handles micro-bounty claims, and gives you 100% emergency withdraw control anytime.
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 rounded-2xl border-2 border-emerald-500/50 bg-zinc-950 p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
        {/* Token & Network Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Target Network</span>
            <div className="mt-1 flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{MONAD_TESTNET.name}</span>
              <span className="text-xs text-zinc-500">(Chain ID {MONAD_TESTNET.chainId})</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Deployer (Vault Owner)</span>
            <div className="mt-1 flex items-center justify-between">
              {isConnected ? (
                <span className="font-bold text-sm text-white">{shortAddress}</span>
              ) : (
                <span className="text-xs text-amber-400 font-bold">Wallet Disconnected</span>
              )}
              {!isConnected && (
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="rounded bg-emerald-500/20 px-2 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black transition"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Token Contract Input */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400">$CHOG Token Address on Monad</span>
            <a
              href={MONAD_TESTNET.dextoolsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-[10px] text-amber-400 hover:text-amber-300 underline"
            >
              <span>View Pair on DEXTools</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-emerald-400 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* Status / Active Vault */}
        {deployedVaultAddress ? (
          <div className="mt-6 rounded-xl border-2 border-emerald-500 bg-emerald-950/20 p-5 animate-in fade-in">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Check className="h-5 w-5 text-emerald-400" />
              <span>VAULT LIVE & ACTIVE ON MONAD</span>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/40 bg-zinc-950 p-2.5">
              <span className="text-xs font-bold text-white truncate max-w-[280px] sm:max-w-md">
                {deployedVaultAddress}
              </span>
              <button
                onClick={() => handleCopy(deployedVaultAddress)}
                className="flex items-center space-x-1 rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-black transition"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>

            {/* Funding Instructions */}
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3.5 text-xs text-amber-200 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-amber-400">
                <Coins className="h-4 w-4" />
                <span>Next Step: Fund Your Vault</span>
              </div>
              <p className="font-sans text-[11px] leading-relaxed">
                Send your <strong>400 $CHOG</strong> from your personal wallet to your Vault address above. The game will automatically read from it and pay out winners!
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <a
                href={`${MONAD_TESTNET.blockExplorer}/address/${deployedVaultAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-300 hover:text-white transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Monad Explorer</span>
              </a>

              <Link
                href="/"
                className="flex items-center space-x-1.5 rounded-lg bg-emerald-500 px-4 py-2 font-black text-black hover:bg-emerald-400 transition"
              >
                <span>Back to Arcade Lobby</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            {/* Deploy Action */}
            <button
              onClick={handleDeployVault}
              disabled={isDeploying}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 py-4 px-6 font-mono text-sm font-black text-black shadow-[0_0_30px_rgba(34,197,94,0.6)] transition hover:brightness-110 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>DEPLOYING TO MONAD...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 fill-current" />
                  <span>1-CLICK DEPLOY VAULT ON MONAD</span>
                </>
              )}
            </button>

            {statusMessage && (
              <p className="mt-3 text-center text-xs text-emerald-400 animate-pulse font-mono">
                {statusMessage}
              </p>
            )}
          </div>
        )}

        {/* Security Features Accordion */}
        <div className="mt-6 border-t border-zinc-800 pt-5 space-y-2 text-xs text-zinc-400 font-sans">
          <p className="font-bold font-mono text-zinc-200">How your funds are 100% protected:</p>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li><strong>You are the Owner:</strong> Only your connected wallet can withdraw the 400 $CHOG back via <code>emergencyWithdraw()</code>.</li>
            <li><strong>Hard-Capped Payouts:</strong> No single game run can ever claim more than 0.10 $CHOG, protecting your vault against exploit scripts.</li>
            <li><strong>Cryptographic Proofs:</strong> The vault verifies win tickets before releasing tokens.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
