import algosdk, { TransactionSigner } from 'algosdk'
import { AlgorandAccountFromWeb3Auth } from './algorandAdapter'

/**
 * Integration utilities for using Web3Auth-derived Algorand accounts
 * with AlgoKit / AlgorandClient.
 */

/**
 * Convert a Web3Auth-derived Algorand account into an AlgoKit-compatible signer.
 *
 * IMPORTANT:
 * AlgoKit expects `signer` to be a function (TransactionSigner),
 * not an object with a sign() method.
 */
export function createWeb3AuthSigner(account: AlgorandAccountFromWeb3Auth): TransactionSigner {
  const sk = account.secretKey
  const addr = account.address

  const secretKey: Uint8Array =
    sk instanceof Uint8Array
      ? sk
      : Array.isArray(sk)
      ? Uint8Array.from(sk)
      : (() => {
          throw new Error('Web3Auth secretKey is not a Uint8Array (or number[]).')
        })()

  return algosdk.makeBasicAccountTransactionSigner({
    addr,
    sk: secretKey,
  })
}

/**
 * Verify that a signed transaction was produced by the given Web3Auth account.
 *
 * Primarily useful for debugging, testing, and verification in mixed Web2/Web3 flows.
 */
export function verifyWeb3AuthSignature(
  signedTransaction: Uint8Array,
  account: AlgorandAccountFromWeb3Auth
): boolean {
  try {
    const decodedTxn = algosdk.decodeSignedTransaction(signedTransaction)
    const txnSigner = decodedTxn.sig?.signers?.[0] ?? decodedTxn.sig?.signer
    if (!txnSigner) return false

    const decodedAddress = algosdk.decodeAddress(account.address)
    return Buffer.from(txnSigner).equals(decodedAddress.publicKey)
  } catch {
    return false
  }
}
