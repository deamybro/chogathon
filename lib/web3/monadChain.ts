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
    chogToken: '0x400ChogTokenContractMonad00000000000',
    bountyVault: '0xVaultBountyPoolMonad00000000000000000',
  },
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
