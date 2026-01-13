import { useWallet } from '@txnlab/use-wallet-react'

/**
 * Thin wrapper around @txnlab/use-wallet-react
 *
 * Normalizes the traditional WalletConnect-based wallet (via @txnlab/use-wallet-react)
 * into a shape that can be consumed by the unified wallet hook.
 */
export function useTraditionalWalletSource() {
  const wallet = useWallet()

  return {
    activeAddress: wallet.activeAddress ?? null,
    signer: wallet.transactionSigner ?? null,
    wallets: wallet.wallets,
    activeWallet: wallet.activeWallet,
    isConnected: Boolean(wallet.activeAddress),
  }
}
