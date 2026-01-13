export type WalletType = 'web3auth' | 'traditional' | null

/**
 * Unified wallet state returned by useUnifiedWallet()
 *
 * This represents a normalized view over:
 * - Web3Auth-based accounts (social login)
 * - Traditional WalletConnect-based wallets (Pera, Defly, etc.)
 */
export interface UnifiedWalletState {
  /** Active Algorand address from the selected wallet source */
  activeAddress: string | null

  /** AlgoKit-compatible transaction signer */
  signer: any | null

  /** Which wallet source is currently active */
  walletType: WalletType

  /** Whether any wallet is connected */
  isConnected: boolean

  /** Loading state from underlying wallet providers */
  isLoading: boolean

  /** Error surfaced from wallet providers (if any) */
  error: string | null
}
