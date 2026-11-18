import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  isConnected as isStellarWalletConnected,
  requestAccess,
  signMessage as signStellarMessage,
} from "@stellar/freighter-api";
import { Loader2, LockKeyhole, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { isAddress } from "viem";
import { goat } from "viem/chains";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EVM_SWAP_NETWORKS } from "@/services/evm-swap.service";
import {
  walletService,
  type AutomationPolicy,
  type AutomationPolicyRecipient,
  type AutomationPolicyToken,
  type AutomationPolicyUpdateInput,
  type WalletChain,
} from "@/services/wallet.service";

interface AutomationPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  walletChain: WalletChain;
}

type NetworkOption = { id: string; label: string };
type TokenRow = { network: string; address: string; code: string; issuer: string };
type RecipientRow = { network: string; address: string };

const EVM_POLICY_NETWORKS: NetworkOption[] = [...EVM_SWAP_NETWORKS, goat]
  .filter((chain, index, all) => all.findIndex((item) => item.id === chain.id) === index)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((chain) => ({ id: `eip155:${chain.id}`, label: `${chain.name} (${chain.id})` }));

const STELLAR_POLICY_NETWORKS: NetworkOption[] = [
  { id: "stellar:mainnet", label: "Stellar mainnet" },
  { id: "stellar:testnet", label: "Stellar testnet" },
];

const HOME_NETWORKS: Partial<Record<WalletChain, string>> = {
  evm: "eip155:1",
  base: "eip155:8453",
  goat: "eip155:2345",
  arc: "eip155:5042",
  stellar: "stellar:mainnet",
};

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100;
}

function tokenRowsFromPolicy(tokens: AutomationPolicyToken[]): TokenRow[] {
  return tokens.map((token) => "address" in token
    ? { network: token.network, address: token.address, code: "", issuer: "" }
    : { network: token.network, address: "", code: token.code, issuer: token.issuer });
}

function rejectedByWallet(message: string): boolean {
  const lower = message.toLowerCase();
  return message.includes("4001") || lower.includes("reject") || lower.includes("cancel") || lower.includes("denied");
}

export function AutomationPolicyModal({ open, onOpenChange, walletAddress, walletChain }: AutomationPolicyModalProps) {
  const isStellar = walletChain === "stellar";
  const networkOptions = isStellar ? STELLAR_POLICY_NETWORKS : EVM_POLICY_NETWORKS;
  const homeNetwork = networkOptions.find((option) => option.id === HOME_NETWORKS[walletChain]);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [policy, setPolicy] = useState<AutomationPolicy | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [approvalThresholdUsd, setApprovalThresholdUsd] = useState("100");
  const [dailyLimitUsd, setDailyLimitUsd] = useState("500");
  const [maxTransactionUsd, setMaxTransactionUsd] = useState("500");
  const [allowedNetworks, setAllowedNetworks] = useState<string[]>([]);
  const [tokenRows, setTokenRows] = useState<TokenRow[]>([]);
  const [allowExternalRecipients, setAllowExternalRecipients] = useState(false);
  const [recipientRows, setRecipientRows] = useState<RecipientRow[]>([]);

  const applyPolicy = useCallback((next: AutomationPolicy) => {
    setPolicy(next);
    setError("");
    setEnabled(next.enabled);
    setApprovalThresholdUsd(String(next.approvalThresholdUsd));
    setDailyLimitUsd(String(next.dailyLimitUsd));
    setMaxTransactionUsd(String(next.maxTransactionUsd));
    setAllowedNetworks(next.allowedNetworks);
    setTokenRows(tokenRowsFromPolicy(next.allowedTokens));
    setAllowExternalRecipients(next.allowExternalRecipients);
    setRecipientRows(next.allowedRecipients.map((recipient) => ({ network: recipient.network, address: recipient.address })));
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    void walletService.getAutomationPolicy(walletAddress)
      .then((next) => { if (!cancelled) applyPolicy(next); })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load the automation policy");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, walletAddress, applyPolicy]);

  const selectedNetworkOptions = networkOptions.filter((option) => allowedNetworks.includes(option.id));

  function networkChoices(current: string): NetworkOption[] {
    const choices = networkOptions.filter((option) => allowedNetworks.includes(option.id) || option.id === current);
    return choices.length > 0 ? choices : networkOptions;
  }

  function toggleNetwork(id: string) {
    const removing = allowedNetworks.includes(id);
    setAllowedNetworks(removing
      ? allowedNetworks.filter((network) => network !== id)
      : [...allowedNetworks, id]);
    if (removing) {
      setTokenRows((rows) => rows.filter((row) => row.network !== id));
      setRecipientRows((rows) => rows.filter((row) => row.network !== id));
    }
  }

  function addToken() {
    const network = selectedNetworkOptions[0]?.id;
    if (!network) return;
    setTokenRows((rows) => [...rows, { network, address: "", code: "", issuer: "" }]);
  }

  function addRecipient() {
    const network = selectedNetworkOptions[0]?.id;
    if (!network) return;
    setRecipientRows((rows) => [...rows, { network, address: "" }]);
  }

  async function signPolicyMessage(message: string): Promise<string> {
    if (isStellar) {
      const connection = await isStellarWalletConnected();
      if (connection.error) throw new Error(connection.error.message);
      if (!connection.isConnected) throw new Error("No compatible Stellar wallet found. Install Freighter to continue.");
      const access = await requestAccess();
      if (access.error) throw new Error(access.error.message);
      if (!access.address) throw new Error("Freighter did not return an address");
      if (access.address !== walletAddress) throw new Error("Switch Freighter to the linked Stellar account before signing");
      const signed = await signStellarMessage(message, { address: access.address });
      if (signed.error) throw new Error(signed.error.message);
      if (signed.signerAddress !== access.address || !signed.signedMessage) {
        throw new Error("Freighter signed with a different account or returned no signature");
      }
      return typeof signed.signedMessage === "string" ? signed.signedMessage : signed.signedMessage.toString("base64");
    }

    const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!eth) throw new Error("No EVM wallet found. Install MetaMask or another EIP-1193 wallet.");
    const accounts = await eth.request({ method: "eth_requestAccounts" }) as string[];
    const active = accounts.find((account) => account.toLowerCase() === walletAddress.toLowerCase());
    if (!active) throw new Error("Switch your EVM wallet to the linked account before signing");
    const signature = await eth.request({ method: "personal_sign", params: [message, active] });
    if (typeof signature !== "string" || !/^0x[0-9a-fA-F]{130}$/.test(signature)) {
      throw new Error("Wallet returned an invalid policy signature");
    }
    return signature;
  }

  async function buildInput(): Promise<Omit<AutomationPolicyUpdateInput, "challengeId" | "signature">> {
    const approval = Number(approvalThresholdUsd);
    const daily = Number(dailyLimitUsd);
    const maxTransaction = Number(maxTransactionUsd);
    if (!Number.isFinite(approval) || approval < 0) throw new Error("Enter a valid approval threshold");
    if (!Number.isFinite(daily) || daily <= 0) throw new Error("Enter a valid daily limit");
    if (!Number.isFinite(maxTransaction) || maxTransaction <= 0) throw new Error("Enter a valid per-transaction limit");
    if (enabled && allowedNetworks.length === 0) throw new Error("Select at least one allowed network before enabling automation");
    if (approval > maxTransaction) throw new Error("Approval threshold cannot exceed the per-transaction limit");
    if (maxTransaction > daily) throw new Error("Per-transaction limit cannot exceed the daily limit");

    let tokens: AutomationPolicyToken[] = [];
    if (tokenRows.length > 0) {
      if (isStellar) {
        const { StrKey } = await import("@stellar/stellar-sdk");
        tokens = tokenRows.map((row) => {
          if (!allowedNetworks.includes(row.network)) throw new Error("Each token network must be an allowed network");
          if (!/^[a-zA-Z0-9]{1,12}$/.test(row.code.trim())) throw new Error("Enter a valid Stellar asset code");
          if (!StrKey.isValidEd25519PublicKey(row.issuer.trim())) throw new Error("Enter a valid Stellar asset issuer");
          return { network: row.network, code: row.code.trim(), issuer: row.issuer.trim() };
        });
      } else {
        tokens = tokenRows.map((row) => {
          if (!allowedNetworks.includes(row.network)) throw new Error("Each token network must be an allowed network");
          if (!isAddress(row.address.trim())) throw new Error("Enter a valid token contract address");
          return { network: row.network, address: row.address.trim() };
        });
      }
    }

    let recipients: AutomationPolicyRecipient[] = [];
    if (allowExternalRecipients) {
      if (recipientRows.length === 0) throw new Error("Add at least one allowed recipient before allowing external recipients");
      if (isStellar) {
        const { StrKey } = await import("@stellar/stellar-sdk");
        recipients = recipientRows.map((row) => {
          if (!allowedNetworks.includes(row.network)) throw new Error("Each recipient network must be an allowed network");
          if (!StrKey.isValidEd25519PublicKey(row.address.trim())) throw new Error("Enter a valid Stellar recipient address");
          return { network: row.network, address: row.address.trim() };
        });
      } else {
        recipients = recipientRows.map((row) => {
          if (!allowedNetworks.includes(row.network)) throw new Error("Each recipient network must be an allowed network");
          if (!isAddress(row.address.trim())) throw new Error("Enter a valid EVM recipient address");
          return { network: row.network, address: row.address.trim() };
        });
      }
    }

    return {
      walletAddress,
      enabled,
      approvalThresholdUsd: roundUsd(approval),
      dailyLimitUsd: roundUsd(daily),
      maxTransactionUsd: roundUsd(maxTransaction),
      allowedNetworks,
      allowedTokens: tokens,
      allowExternalRecipients,
      allowedRecipients: recipients,
    };
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const input = await buildInput();
      setStatus("Preparing policy challenge…");
      const challenge = await walletService.createAutomationPolicyChallenge(input);
      setStatus("Sign the policy message in your wallet…");
      const signature = await signPolicyMessage(challenge.message);
      setStatus("Saving signed policy…");
      const updated = await walletService.updateAutomationPolicy({ ...input, challengeId: challenge.challengeId, signature });
      applyPolicy(updated);
      toast.success("Automation policy saved");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save the automation policy";
      if (rejectedByWallet(message)) {
        setError("Signature request cancelled. The policy was not changed.");
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[620px] [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Automation policy</DialogTitle>
            <DialogDescription className="text-[11px] text-white/40 mt-1">Set signed limits and allowlists for this wallet. Saving does not send a transaction.</DialogDescription>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} disabled={busy} aria-label="Close automation policy dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center disabled:opacity-40"><X size={14} className="text-white/70" /></button>
        </div>

        <form onSubmit={(event) => void handleSave(event)} className="flex max-h-[78vh] flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-3 border border-white/8 bg-white/[0.02] px-3 py-2 text-[10px] text-white/45">
              <span className="truncate font-mono">{walletAddress}</span>
              <span className="shrink-0 uppercase tracking-wider">{walletChain}</span>
            </div>

            <div className="border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2 text-[10px] leading-relaxed text-amber-100/70">
              This policy is stored and signed, but unattended execution is not enabled yet. It will not place trades until the automation runner enforces it.
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-[11px] text-white/40"><Loader2 size={13} className="animate-spin" />Loading policy…</div>
            ) : (
              <>
                <label className="flex items-center justify-between gap-4 border border-white/10 bg-white/[0.02] px-4 py-3">
                  <span>
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white"><ShieldCheck size={13} />Automation enabled</span>
                    <span className="mt-1 block text-[10px] text-white/40">When off, the policy is saved but automatic actions remain disabled.</span>
                  </span>
                  <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="size-4 shrink-0 accent-[#e5c185]" />
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block text-[10px] text-white/50">Approval threshold (USD)
                    <input inputMode="decimal" value={approvalThresholdUsd} onChange={(event) => setApprovalThresholdUsd(event.target.value)} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-white outline-none focus:border-white/30" />
                  </label>
                  <label className="block text-[10px] text-white/50">Per-transaction limit (USD)
                    <input inputMode="decimal" value={maxTransactionUsd} onChange={(event) => setMaxTransactionUsd(event.target.value)} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-white outline-none focus:border-white/30" />
                  </label>
                  <label className="block text-[10px] text-white/50">Daily limit (USD)
                    <input inputMode="decimal" value={dailyLimitUsd} onChange={(event) => setDailyLimitUsd(event.target.value)} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-white outline-none focus:border-white/30" />
                  </label>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-white">Allowed networks</p>
                      <p className="mt-0.5 text-[10px] text-white/40">{allowedNetworks.length} selected. At least one is required to enable automation.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {homeNetwork && !allowedNetworks.includes(homeNetwork.id) && <button type="button" onClick={() => setAllowedNetworks((current) => [...current, homeNetwork.id])} className="text-[10px] text-white/50 hover:text-white">Select {homeNetwork.label}</button>}
                      {allowedNetworks.length > 0 && <button type="button" onClick={() => { setAllowedNetworks([]); setTokenRows([]); setRecipientRows([]); }} className="text-[10px] text-white/35 hover:text-white">Clear</button>}
                    </div>
                  </div>
                  <div className="mt-2 grid max-h-44 grid-cols-1 gap-1 overflow-y-auto border border-white/10 bg-black/10 p-2 sm:grid-cols-2">
                    {networkOptions.map((option) => (
                      <label key={option.id} className="flex items-center gap-2 px-1 py-1 text-[10px] text-white/60">
                        <input type="checkbox" checked={allowedNetworks.includes(option.id)} onChange={() => toggleNetwork(option.id)} className="size-3 shrink-0 accent-[#e5c185]" />
                        <span className="truncate">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-white">Allowed tokens</p>
                      <p className="mt-0.5 text-[10px] text-white/40">Optional. Token rows must use a selected network.</p>
                    </div>
                    <button type="button" onClick={addToken} disabled={selectedNetworkOptions.length === 0} title={selectedNetworkOptions.length === 0 ? "Select a network first" : "Add a token"} className="flex items-center gap-1 border border-white/15 px-2.5 py-1.5 text-[10px] text-white/70 disabled:opacity-35"><Plus size={11} />Add token</button>
                  </div>
                  {tokenRows.length === 0 ? <p className="mt-2 text-[10px] text-white/35">No token allowlist. Native asset transfers remain constrained by the limits and recipients below.</p> : <div className="mt-2 space-y-2">
                    {tokenRows.map((row, index) => (
                      <div key={index} className={`grid gap-2 border border-white/8 bg-white/[0.02] p-2.5 ${isStellar ? "sm:grid-cols-[140px_100px_1fr_auto]" : "sm:grid-cols-[150px_1fr_auto]"}`}>
                        <select value={row.network} onChange={(event) => setTokenRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, network: event.target.value } : item))} className="bg-[#1b1b1b] border border-white/10 px-2 py-1.5 text-[10px] text-white outline-none">
                          {networkChoices(row.network).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </select>
                        {isStellar ? (
                          <>
                            <input value={row.code} onChange={(event) => setTokenRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, code: event.target.value } : item))} placeholder="Asset code" className="bg-white/5 border border-white/10 px-2 py-1.5 text-[10px] text-white outline-none" />
                            <input value={row.issuer} onChange={(event) => setTokenRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, issuer: event.target.value } : item))} placeholder="Issuer (G…)" className="bg-white/5 border border-white/10 px-2 py-1.5 text-[10px] text-white font-mono outline-none" />
                          </>
                        ) : (
                          <input value={row.address} onChange={(event) => setTokenRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, address: event.target.value } : item))} placeholder="Token contract (0x…)" className="bg-white/5 border border-white/10 px-2 py-1.5 text-[10px] text-white font-mono outline-none" />
                        )}
                        <button type="button" onClick={() => setTokenRows((rows) => rows.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove token" className="flex items-center justify-center text-white/30 hover:text-red-300"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>}
                </div>

                <div>
                  <label className="flex items-center justify-between gap-4 border border-white/10 bg-white/[0.02] px-4 py-3">
                    <span>
                      <span className="block text-[11px] font-semibold text-white">Allow external recipients</span>
                      <span className="mt-1 block text-[10px] text-white/40">Off means automatic transfers can only return to this wallet’s own addresses.</span>
                    </span>
                    <input type="checkbox" checked={allowExternalRecipients} onChange={(event) => { setAllowExternalRecipients(event.target.checked); if (!event.target.checked) setRecipientRows([]); }} className="size-4 shrink-0 accent-[#e5c185]" />
                  </label>
                  {allowExternalRecipients && <div className="mt-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-white/40">Required recipient allowlist</p>
                      <button type="button" onClick={addRecipient} disabled={selectedNetworkOptions.length === 0} title={selectedNetworkOptions.length === 0 ? "Select a network first" : "Add a recipient"} className="flex items-center gap-1 border border-white/15 px-2.5 py-1.5 text-[10px] text-white/70 disabled:opacity-35"><Plus size={11} />Add recipient</button>
                    </div>
                    {recipientRows.length === 0 ? <p className="mt-2 text-[10px] text-white/35">Add at least one recipient before saving.</p> : <div className="mt-2 space-y-2">
                      {recipientRows.map((row, index) => (
                        <div key={index} className="grid gap-2 border border-white/8 bg-white/[0.02] p-2.5 sm:grid-cols-[150px_1fr_auto]">
                          <select value={row.network} onChange={(event) => setRecipientRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, network: event.target.value } : item))} className="bg-[#1b1b1b] border border-white/10 px-2 py-1.5 text-[10px] text-white outline-none">
                            {networkChoices(row.network).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                          </select>
                          <input value={row.address} onChange={(event) => setRecipientRows((rows) => rows.map((item, itemIndex) => itemIndex === index ? { ...item, address: event.target.value } : item))} placeholder={isStellar ? "Recipient (G…)" : "Recipient (0x…)"} className="bg-white/5 border border-white/10 px-2 py-1.5 text-[10px] text-white font-mono outline-none" />
                          <button type="button" onClick={() => setRecipientRows((rows) => rows.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove recipient" className="flex items-center justify-center text-white/30 hover:text-red-300"><Trash2 size={13} /></button>
                        </div>
                      ))}
                    </div>}
                  </div>}
                </div>

                {policy?.persisted ? (
                  <div className="border border-white/8 bg-white/[0.02] px-3 py-2 text-[10px] text-white/45">
                    <p>Signed policy hash <span className="font-mono text-white/70">{policy.policyHash?.slice(0, 16)}…</span></p>
                    <p className="mt-1">Signed {policy.signedAt ? new Date(policy.signedAt).toLocaleString() : "—"} · Updated {policy.updatedAt ? new Date(policy.updatedAt).toLocaleString() : "—"}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-white/35">No signed policy for this wallet yet. The defaults are shown until you save.</p>
                )}

                {error && <p className="border border-red-400/20 bg-red-400/5 px-3 py-2 text-[10px] text-red-300">{error}</p>}
                {busy && status && <p className="text-[10px] text-white/40">{status}</p>}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 bg-white/[0.02] px-6 py-4">
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-white/35">Saving requires a wallet signature and does not send a transaction.</p>
              {policy?.persisted && <button type="button" onClick={() => applyPolicy(policy)} disabled={busy || loading} className="text-[10px] text-white/40 hover:text-white disabled:opacity-35">Revert</button>}
            </div>
            <button type="submit" disabled={busy || loading} className="flex items-center justify-center gap-2 bg-sand px-4 py-2.5 text-[11px] font-bold text-ink-dark disabled:opacity-50">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <LockKeyhole size={13} />}
              {busy ? status || "Working…" : "Sign & save policy"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
