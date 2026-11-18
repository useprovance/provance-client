import { getNetwork, signTransaction } from "@stellar/freighter-api";
import { BaseApiService } from "./api.service";

const NETWORKS: Record<string, { name: "mainnet" | "testnet"; passphrase: string; horizon: string; usdcIssuer: string }> = {
  "Public Global Stellar Network ; September 2015": { name: "mainnet", passphrase: "Public Global Stellar Network ; September 2015", horizon: "https://horizon.stellar.org", usdcIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
  "Test SDF Network ; September 2015": { name: "testnet", passphrase: "Test SDF Network ; September 2015", horizon: "https://horizon-testnet.stellar.org", usdcIssuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
};
export type StellarAsset = { code: string; issuer: string | null };
export type StellarOffer = { id: string; selling: StellarAsset; buying: StellarAsset; amount: string; price: string; lastModifiedAt: string };
export function knownUsdcIssuer(network: "mainnet" | "testnet"): string {
  return network === "testnet" ? NETWORKS["Test SDF Network ; September 2015"].usdcIssuer : NETWORKS["Public Global Stellar Network ; September 2015"].usdcIssuer;
}

class StellarOrdersService extends BaseApiService {
  private async networkConfig() {
    const result = await getNetwork();
    if (result.error) throw new Error(result.error.message);
    const config = NETWORKS[result.networkPassphrase];
    if (!config) throw new Error(`Unsupported Stellar network: ${result.network}`);
    return config;
  }

  async list(address: string): Promise<{ network: "mainnet" | "testnet"; offers: StellarOffer[] }> {
    const config = await this.networkConfig();
    try {
      const response = await this.api.get<{ network: "mainnet" | "testnet"; offers: StellarOffer[] }>(`/wallets/stellar/${address}/offers`, { params: { network: config.name } });
      return response.data;
    } catch (error) { throw this.handleError(error); }
  }

  async submit(address: string, selling: StellarAsset, buying: StellarAsset, amount: string, price: string, offerId = "0"): Promise<{ transactionHash: string; historySaved: boolean; action: "place" | "cancel" }> {
    if (!/^\d+(\.\d{1,7})?$/.test(amount) || (offerId === "0" && Number(amount) <= 0)) throw new Error("Enter a valid amount with up to 7 decimal places");
    if (!/^\d+(\.\d{1,7})?$/.test(price) || Number(price) <= 0) throw new Error("Enter a valid price greater than zero");
    const config = await this.networkConfig();
    const { Asset, Horizon, Operation, StrKey, TransactionBuilder } = await import("@stellar/stellar-sdk");
    const toAsset = (value: StellarAsset) => {
      if (!/^[a-zA-Z0-9]{1,12}$/.test(value.code)) throw new Error("Asset code must contain 1–12 letters or numbers");
      if (value.issuer === null && value.code === "XLM") return Asset.native();
      if (!value.issuer || !StrKey.isValidEd25519PublicKey(value.issuer)) throw new Error(`Enter a valid issuer address for ${value.code}`);
      return new Asset(value.code, value.issuer);
    };
    if (selling.code === buying.code && selling.issuer === buying.issuer) throw new Error("Choose two different assets");
    const server = new Horizon.Server(config.horizon);
    const account = await server.loadAccount(address);
    const tx = new TransactionBuilder(account, { fee: String(await server.fetchBaseFee()), networkPassphrase: config.passphrase })
      .addOperation(Operation.manageSellOffer({ selling: toAsset(selling), buying: toAsset(buying), amount, price, offerId }))
      .setTimeout(180)
      .build();
    const signed = await signTransaction(tx.toXDR(), { address, networkPassphrase: config.passphrase });
    if (signed.error) throw new Error(signed.error.message);
    if (signed.signerAddress !== address) throw new Error("Freighter signed with a different account. Select the linked wallet and try again.");
    try {
      const response = await this.api.post<{ transactionHash: string; historySaved: boolean; action: "place" | "cancel" }>("/wallets/stellar/offers/submit", { address, network: config.name, signedXdr: signed.signedTxXdr });
      return response.data;
    } catch (error) { throw this.handleError(error); }
  }
}

export const stellarOrdersService = new StellarOrdersService();
