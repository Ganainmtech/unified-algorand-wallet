import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from '@web3auth/base'
import { CommonPrivateKeyProvider } from '@web3auth/base-provider'
import { Web3Auth } from '@web3auth/modal'

let web3authInstance: Web3Auth | null = null

export interface InitWeb3AuthOptions {
  clientId: string
  appName?: string
  web3AuthNetwork?: WEB3AUTH_NETWORK
}

/**
 * Initialize (or return existing) Web3Auth instance.
 *
 * NOTE:
 * - This function is library-safe (no env access).
 * - The consuming app is responsible for providing the clientId.
 */
export async function initWeb3Auth(options: InitWeb3AuthOptions): Promise<Web3Auth> {
  const {
    clientId,
    appName = 'Unified Algorand Wallet',
    web3AuthNetwork = WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  } = options

  if (!clientId) {
    throw new Error('Web3Auth clientId is required')
  }

  if (web3authInstance) {
    return web3authInstance
  }

  // Create the private key provider for Algorand
  const privateKeyProvider = new CommonPrivateKeyProvider({
    config: {
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.OTHER,
        chainId: '0x1',
        rpcTarget: 'https://testnet-api.algonode.cloud',
        displayName: 'Algorand TestNet',
        blockExplorerUrl: 'https://testnet.algoexplorer.io',
        ticker: 'ALGO',
        tickerName: 'Algorand',
      },
    },
  })

  const web3AuthConfig = {
    clientId,
    web3AuthNetwork,
    privateKeyProvider,
    uiConfig: {
      appName,
      theme: {
        primary: '#000000',
      },
      mode: 'light' as const,
      loginMethodsOrder: ['google', 'github', 'twitter'],
      defaultLanguage: 'en',
    },
  }

  web3authInstance = new Web3Auth(web3AuthConfig)
  await web3authInstance.initModal()

  return web3authInstance
}

/** Get the current Web3Auth instance (if initialized) */
export function getWeb3AuthInstance(): Web3Auth | null {
  return web3authInstance
}

/** Get the active Web3Auth provider (if connected) */
export function getWeb3AuthProvider(): IProvider | null {
  return web3authInstance?.provider ?? null
}

/** Whether Web3Auth is currently connected */
export function isWeb3AuthConnected(): boolean {
  return web3authInstance?.status === 'connected'
}

export interface Web3AuthUserInfo {
  email?: string
  name?: string
  profileImage?: string
  [key: string]: unknown
}

/** Fetch user info from Web3Auth (if connected) */
export async function getWeb3AuthUserInfo(): Promise<Web3AuthUserInfo | null> {
  if (!web3authInstance || !isWeb3AuthConnected()) {
    return null
  }

  try {
    const userInfo = await web3authInstance.getUserInfo()
    return userInfo as Web3AuthUserInfo
  } catch {
    return null
  }
}

/** Logout from Web3Auth */
export async function logoutFromWeb3Auth(): Promise<void> {
  if (!web3authInstance) return
  await web3authInstance.logout()
}
