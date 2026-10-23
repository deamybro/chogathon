/**
 * Monad Testnet Network Definitions and Configuration
 */

export const MONAD_TESTNET = {
  chainId: 10143,
  chainIdHex: '0x279f',
  name: 'Monad Testnet',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  currency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  blockExplorer: 'https://testnet.monadexplorer.com',
  contracts: {
    chogNft: '0x3969ChogNFTContractMonad00000000000000',
    chogToken: '0x350035555E10d9AfAF1566AaebfCeD5BA6C27777',
    chogDexPair: '0x116e7d070f1888b81e1e0324f56d6746b2d7d8f1',
    bountyVault: '0xVaultBountyPoolMonad00000000000000000',
  },
  dextoolsUrl: 'https://www.dextools.io/app/monad/pair-explorer/0x116e7d070f1888b81e1e0324f56d6746b2d7d8f1',
  marketplaceUrl: 'https://magiceden.io/collections/monad-testnet/chogs',
};

export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}
