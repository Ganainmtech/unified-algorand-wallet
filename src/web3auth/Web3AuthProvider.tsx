import { IProvider } from '@web3auth/base'
import { Web3Auth } from '@web3auth/modal'
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { AlgorandAccountFromWeb3Auth, getAlgorandAccount } from './algorandAdapter'
import {
  getWeb3AuthUserInfo,
  initWeb3Auth,
  logoutFromWeb3Auth,
  Web3AuthUserInfo,
  InitWeb3AuthOptions,
} from './web3authConfig'

export interface Web3AuthContextType {
  isConnected: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  provider: IProvider | null
  web3AuthInstance: Web3Auth | null
  algorandAccount: AlgorandAccountFromWeb3Auth | null
  userInfo: Web3AuthUserInfo | null
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshUserInfo: () => Promise<void>
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined)

export interface Web3AuthProviderProps {
  children: ReactNode
  /**
   * Web3Auth init options. At minimum, provide clientId.
   * Example:
   *  <Web3AuthProvider options={{ clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID }} />
   */
  options: InitWeb3AuthOptions
}

export function Web3AuthProvider({ children, options }: Web3AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [provider, setProvider] = useState<IProvider | null>(null)
  const [web3AuthInstance, setWeb3AuthInstance] = useState<Web3Auth | null>(null)
  const [algorandAccount, setAlgorandAccount] = useState<AlgorandAccountFromWeb3Auth | null>(null)
  const [userInfo, setUserInfo] = useState<Web3AuthUserInfo | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const web3auth = await initWeb3Auth(options)
        setWeb3AuthInstance(web3auth)

        if (web3auth.status === 'connected' && web3auth.provider) {
          setProvider(web3auth.provider)
          setIsConnected(true)

          try {
            const account = await getAlgorandAccount(web3auth.provider)
            setAlgorandAccount(account)
          } catch {
            setError('Failed to derive Algorand account. Please reconnect.')
          }

          try {
            const info = await getWeb3AuthUserInfo()
            if (info) setUserInfo(info)
          } catch {
            // silent: user info is optional
          }
        }

        setIsInitialized(true)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Web3Auth'
        setError(errorMessage)
        setIsInitialized(true)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
    // options should be stable; consumers should memoize if constructing inline
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async () => {
    if (!web3AuthInstance) {
      setError('Web3Auth not initialized')
      return
    }

    if (!isInitialized) {
      setError('Web3Auth is still initializing, please try again')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const web3authProvider = await web3AuthInstance.connect()
      if (!web3authProvider) throw new Error('Failed to connect Web3Auth provider')

      setProvider(web3authProvider)
      setIsConnected(true)

      try {
        const account = await getAlgorandAccount(web3authProvider)
        setAlgorandAccount(account)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to derive Algorand account'
        setError(msg)
      }

      try {
        const info = await getWeb3AuthUserInfo()
        if (info) setUserInfo(info)
      } catch {
        // silent
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      setIsConnected(false)
      setProvider(null)
      setAlgorandAccount(null)
      setUserInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      setError(null)

      await logoutFromWeb3Auth()

      setProvider(null)
      setIsConnected(false)
      setAlgorandAccount(null)
      setUserInfo(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed'
      setError(errorMessage)

      setProvider(null)
      setIsConnected(false)
      setAlgorandAccount(null)
      setUserInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUserInfo = async () => {
    try {
      const info = await getWeb3AuthUserInfo()
      if (info) setUserInfo(info)
    } catch {
      // silent
    }
  }

  const value = useMemo<Web3AuthContextType>(
    () => ({
      isConnected,
      isLoading,
      isInitialized,
      error,
      provider,
      web3AuthInstance,
      algorandAccount,
      userInfo,
      login,
      logout,
      refreshUserInfo,
    }),
    [isConnected, isLoading, isInitialized, error, provider, web3AuthInstance, algorandAccount, userInfo],
  )

  return <Web3AuthContext.Provider value={value}>{children}</Web3AuthContext.Provider>
}

export function useWeb3Auth(): Web3AuthContextType {
  const context = useContext(Web3AuthContext)
  if (context === undefined) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider')
  }
  return context
}
