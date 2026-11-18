import { getNetwork, signTransaction } from "@stellar/freighter-api";
import { BaseApiService } from "./api.service";

const PUBLIC_NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015";
const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const NETWORKS: Record<string, { passphrase: string; horizon: string }> = {
  [PUBLIC_NETWORK_PASSPHRASE]: { passphrase: PUBLIC_NETWORK_PASSPHRASE, horizon: "https://horizon.stellar.org" },
  [TESTNET_PASSPHRASE]: { passphrase: TESTNET_PASSPHRASE, horizon: "https://horizon-testnet.stellar.org" },
};

class StellarTransferService extends BaseApiService {
async sendNative(source: string, destination: string, amount: string, issuedAsset?: { code: string; issuer: string }): Promise<string> {
  if (!/^\d+(\.\d{1,7})?$/.test(amount) || Number(amount) <= 0) {
    throw new Error("Enter an amount greater than zero with up to 7 decimal places");
  }

  const walletNetwork = await getNetwork();
  if (walletNetwork.error) throw new Error(walletNetwork.error.message);
  const network = NETWORKS[walletNetwork.networkPassphrase as keyof typeof NETWORKS];
  if (!network) throw new Error(`Unsupported Stellar network: ${walletNetwork.network}`);

  const { Asset, Horizon, Operation, StrKey, TransactionBuilder } = await import("@stellar/stellar-sdk");
  if (!StrKey.isValidEd25519PublicKey(destination)) throw new Error("Enter a valid Stellar public address");
  if (issuedAsset && (!/^[a-zA-Z0-9]{1,12}$/.test(issuedAsset.code) || !StrKey.isValidEd25519PublicKey(issuedAsset.issuer))) {
    throw new Error("Enter a valid Stellar asset code and issuer address");
  }
  const server = new Horizon.Server(network.horizon);
  const account = await server.loadAccount(source);
  const transaction = new TransactionBuilder(account, {
    fee: String(await server.fetchBaseFee()),
    networkPassphrase: network.passphrase,
  })
    .addOperation(Operation.payment({ destination, asset: issuedAsset ? new Asset(issuedAsset.code, issuedAsset.issuer) : Asset.native(), amount }))
    .setTimeout(180)
    .build();

  const signed = await signTransaction(transaction.toXDR(), {
    address: source,
    networkPassphrase: network.passphrase,
  });
  if (signed.error) throw new Error(signed.error.message);
  if (signed.signerAddress !== source) throw new Error("Freighter signed with a different account. Select the linked wallet and try again.");

  try {
    const response = await this.api.post<{ transactionHash: string }>("/wallets/stellar/transfer/submit", {
      address: source,
      signedXdr: signed.signedTxXdr,
    });
    return response.data.transactionHash;
  } catch (error) {
    throw this.handleError(error);
  }
}
}

export const stellarTransferService = new StellarTransferService();
