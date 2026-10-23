'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Chog, CartridgeBattery } from '@/types/chog';
import { MONAD_TESTNET } from '@/lib/web3/monadChain';
import {
  getCartridgeBattery,
  consumeCartridgeRun,
  rechargeCartridge,
  rollGachaTrialChog,
  getWalletTrialChogs,
  getWalletClaimedChog,
  addWalletClaimedChog,
} from '@/lib/web3/batteryStorage';
import { DEMO_CHOGS } from '@/lib/demoChogs';
import { soundSynth } from '@/game/soundEffects';

interface WalletContextType {
  walletAddress: string | null;
  shortAddress: string;
  isConnected: boolean;
  isConnecting: boolean;
  isMonadNetwork: boolean;
  userChogs: Chog[];
  claimedBountyBalance: number;
  connectWallet: (type?: 'injected' | 'judge_pass') => Promise<boolean>;
  disconnectWallet: () => void;
  mintTrialChog: () => Promise<{ chog: Chog; tier: 'common' | 'rare' | 'epic' | 'legendary' } | null>;
  getBattery: (tokenId: number) => CartridgeBattery;
  consumeRun: (tokenId: number) => CartridgeBattery;
  recharge: (tokenId: number) => CartridgeBattery;
  claimBounty: (amount: number) => void;
  // Modals
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  isGachaModalOpen: boolean;
  setIsGachaModalOpen: (open: boolean) => void;
  isDepletedModalOpen: boolean;
  setIsDepletedModalOpen: (open: boolean) => void;
  depletedTokenId: number | null;
  setDepletedTokenId: (id: number | null) => void;
  // Last minted chog for gacha reveal
  lastMintedChog: { chog: Chog; tier: string } | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const LOCAL_STORAGE_WALLET_KEY = 'chogathon_connected_wallet';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMonadNetwork, setIsMonadNetwork] = useState(true);
  const [userChogs, setUserChogs] = useState<Chog[]>([]);
  const [claimedBountyBalance, setClaimedBountyBalance] = useState(0);

  // Modals
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isGachaModalOpen, setIsGachaModalOpen] = useState(false);
  const [isDepletedModalOpen, setIsDepletedModalOpen] = useState(false);
  const [depletedTokenId, setDepletedTokenId] = useState<number | null>(null);
  const [lastMintedChog, setLastMintedChog] = useState<{ chog: Chog; tier: string } | null>(null);

  // Load existing trial chogs and balance for wallet
  const refreshWalletData = useCallback((address: string) => {
    const trials = getWalletTrialChogs(address);
    setUserChogs(trials);
    setClaimedBountyBalance(getWalletClaimedChog(address));
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setUserChogs([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_WALLET_KEY);
    }
  }, []);

  // Re-hydrate saved connection on mount & register EVM event listeners
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_WALLET_KEY);
      if (saved) {
        setWalletAddress(saved);
        refreshWalletData(saved);
      }

      if ((window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        const handleAccounts = (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            localStorage.setItem(LOCAL_STORAGE_WALLET_KEY, accounts[0]);
            refreshWalletData(accounts[0]);
          } else {
            disconnectWallet();
          }
        };

        ethereum.on?.('accountsChanged', handleAccounts);

        return () => {
          ethereum.removeListener?.('accountsChanged', handleAccounts);
        };
      }
    }
  }, [refreshWalletData, disconnectWallet]);

  // Connect wallet
  const connectWallet = useCallback(async (type: 'injected' | 'judge_pass' = 'injected'): Promise<boolean> => {
    setIsConnecting(true);

    try {
      if (type === 'judge_pass' || typeof window === 'undefined' || !(window as any).ethereum) {
        // Zero-friction Hackathon Judge Pass
        const judgeAddress = '0xChog969JudgesMonadTestnet' + Math.floor(1000 + Math.random() * 9000);
        setWalletAddress(judgeAddress);
        localStorage.setItem(LOCAL_STORAGE_WALLET_KEY, judgeAddress);
        refreshWalletData(judgeAddress);
        setIsWalletModalOpen(false);
        soundSynth.playCoin();
        return true;
      }

      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        localStorage.setItem(LOCAL_STORAGE_WALLET_KEY, address);

        // Attempt Monad Testnet switch
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: MONAD_TESTNET.chainIdHex }],
          });
          setIsMonadNetwork(true);
        } catch (switchError: any) {
          // Chain not added to metamask, attempt add
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: MONAD_TESTNET.chainIdHex,
                    chainName: MONAD_TESTNET.name,
                    rpcUrls: [MONAD_TESTNET.rpcUrl],
                    nativeCurrency: MONAD_TESTNET.currency,
                    blockExplorerUrls: [MONAD_TESTNET.blockExplorer],
                  },
                ],
              });
              setIsMonadNetwork(true);
            } catch (addError) {
              console.warn('Failed to add Monad network', addError);
            }
          }
        }

        refreshWalletData(address);
        setIsWalletModalOpen(false);
        soundSynth.playCoin();
        return true;
      }
    } catch (err) {
      console.warn('Wallet connection cancelled or failed', err);
    } finally {
      setIsConnecting(false);
    }

    return false;
  }, [refreshWalletData]);

  // Mint Lucky Trial Chog
  const mintTrialChog = useCallback(async () => {
    if (!walletAddress) {
      setIsWalletModalOpen(true);
      return null;
    }

    const result = rollGachaTrialChog(walletAddress);
    setLastMintedChog(result);
    refreshWalletData(walletAddress);
    return result;
  }, [walletAddress, refreshWalletData]);

  // Battery queries
  const getBattery = useCallback((tokenId: number) => {
    return getCartridgeBattery(tokenId);
  }, []);

  const consumeRun = useCallback((tokenId: number) => {
    const updated = consumeCartridgeRun(tokenId);
    if (walletAddress) {
      refreshWalletData(walletAddress);
    }
    return updated;
  }, [walletAddress, refreshWalletData]);

  const recharge = useCallback((tokenId: number) => {
    const updated = rechargeCartridge(tokenId);
    if (walletAddress) {
      refreshWalletData(walletAddress);
    }
    return updated;
  }, [walletAddress, refreshWalletData]);

  const claimBounty = useCallback((amount: number) => {
    if (walletAddress) {
      const updated = addWalletClaimedChog(walletAddress, amount);
      setClaimedBountyBalance(updated);
    }
  }, [walletAddress]);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        shortAddress,
        isConnected: !!walletAddress,
        isConnecting,
        isMonadNetwork,
        userChogs,
        claimedBountyBalance,
        connectWallet,
        disconnectWallet,
        mintTrialChog,
        getBattery,
        consumeRun,
        recharge,
        claimBounty,
        isWalletModalOpen,
        setIsWalletModalOpen,
        isGachaModalOpen,
        setIsGachaModalOpen,
        isDepletedModalOpen,
        setIsDepletedModalOpen,
        depletedTokenId,
        setDepletedTokenId,
        lastMintedChog,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return ctx;
}
