import { useMemo, useState, type ChangeEvent } from "react";
import { Braces, Check, FileJson, Loader2, Search, ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EVM_SWAP_NETWORKS } from "@/services/evm-swap.service";
import { contractService, parseContractArgument, type ContractFunction, type ContractInspection, type ContractSimulation } from "@/services/contract.service";
import type { WalletRecord } from "@/services/wallet.service";

interface Props {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   wallet: WalletRecord;
   onSubmitted?: () => void;
}

export function EvmContractModal({ open, onOpenChange, wallet, onSubmitted }: Props) {
   const networks = wallet.chain === "base" ? EVM_SWAP_NETWORKS.filter((item) => item.id === 8453) : EVM_SWAP_NETWORKS;
   const [chainId, setChainId] = useState(networks[0]?.id ?? 1);
   const [address, setAddress] = useState("");
   const [abiText, setAbiText] = useState("");
   const [inspection, setInspection] = useState<ContractInspection | null>(null);
   const [selectedName, setSelectedName] = useState("");
   const [args, setArgs] = useState<string[]>([]);
   const [value, setValue] = useState("0");
   const [simulation, setSimulation] = useState<ContractSimulation | null>(null);
   const [simulatedAt, setSimulatedAt] = useState(0);
   const [hash, setHash] = useState<string | null>(null);
   const [busy, setBusy] = useState(false);

   const selected = useMemo<ContractFunction | undefined>(
      () => inspection?.functions.find((item) => item.name === selectedName),
      [inspection, selectedName],
   );
   const payable = selected?.stateMutability === "payable";
   const readOnly = selected?.stateMutability === "view" || selected?.stateMutability === "pure";

   function resetContract() {
      setInspection(null);
      setSelectedName("");
      setArgs([]);
      setSimulation(null);
      setHash(null);
   }

   async function readAbiFile(event: ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 250_000) { toast.error("ABI file is too large"); return; }
      try { setAbiText(await file.text()); resetContract(); }
      catch { toast.error("Could not read the ABI file"); }
   }

   async function inspect() {
      if (!address.trim()) { toast.error("Enter a contract address."); return; }
      setBusy(true);
      try {
         let abi: unknown | undefined;
         if (abiText.trim()) {
            try { abi = JSON.parse(abiText); }
            catch { toast.error("ABI must be valid JSON."); return; }
         }
         const next = await contractService.inspect(chainId, address.trim(), abi as never);
         setInspection(next);
         setSelectedName(next.functions[0]?.name ?? "");
         setArgs(new Array(next.functions[0]?.inputs.length ?? 0).fill(""));
         setSimulation(null);
         setHash(null);
         toast.success(next.verified ? "Verified ABI loaded" : "ABI loaded");
      } catch (error) {
         toast.error(error instanceof Error ? error.message : "Could not inspect contract");
      } finally { setBusy(false); }
   }

   function chooseFunction(name: string) {
      setSelectedName(name);
      const fn = inspection?.functions.find((item) => item.name === name);
      setArgs(new Array(fn?.inputs.length ?? 0).fill(""));
      setSimulation(null);
      setHash(null);
   }

   async function simulate() {
      if (!inspection || !selected) return;
      setBusy(true);
      try {
         const parsedArgs = selected.inputs.map((input, index) => parseContractArgument(input.type, args[index] ?? ""));
         const next = await contractService.simulate({
            chainId,
            address: inspection.address,
            from: wallet.address,
            abi: inspection.abi,
            functionName: selected.name,
            args: parsedArgs,
            value: payable ? value || "0" : "0",
         });
         setSimulation(next);
         setSimulatedAt(Date.now());
         setHash(null);
         toast.success(readOnly ? "Read call succeeded" : "Simulation succeeded");
      } catch (error) {
         setSimulation(null);
         toast.error(error instanceof Error ? error.message : "Simulation failed");
      } finally { setBusy(false); }
   }

   async function execute() {
      if (!simulation) return;
      if (Date.now() - simulatedAt > simulation.expiresInSeconds * 1000) {
         toast.error("This simulation expired. Simulate again before signing.");
         setSimulation(null);
         return;
      }
      setBusy(true);
      try {
         const result = await contractService.execute(simulation);
         setHash(result.hash);
         toast.success(`Contract call submitted: ${result.hash.slice(0, 10)}…`);
         onSubmitted?.();
         try { await contractService.waitForTransaction(simulation.chainId, result.hash); }
         catch { /* Activity reconciliation updates the final status later. */ }
      } catch (error) {
         toast.error(error instanceof Error ? error.message : "Contract call failed");
      } finally { setBusy(false); }
   }

   return (
      <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
         <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[620px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0 bg-[#141414] z-10">
               <div>
                  <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Contract action</DialogTitle>
                  <DialogDescription className="text-[11px] text-white/40 mt-1">Inspect, simulate, and sign a contract call. Simulation is a safety check, not a guarantee.</DialogDescription>
               </div>
               <button onClick={() => onOpenChange(false)} disabled={busy} aria-label="Close contract dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center disabled:opacity-40"><X size={14} className="text-white/70" /></button>
            </div>

            <div className="p-6 space-y-3.5">
               <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[11px] text-white/50">Network
                     <select value={chainId} onChange={(event) => { setChainId(Number(event.target.value)); resetContract(); }} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">
                        {networks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                     </select>
                  </label>
                  <label className="block text-[11px] text-white/50">Wallet
                     <input readOnly value={wallet.address} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[10px] text-white/60 font-mono outline-none" />
                  </label>
               </div>

               <label className="block text-[11px] text-white/50">Contract address
                  <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-2">
                     <input value={address} onChange={(event) => { setAddress(event.target.value); resetContract(); }} placeholder="0x…" className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white font-mono outline-none focus:border-white/30" />
                     <button type="button" onClick={() => void inspect()} disabled={busy || !address.trim()} className="flex items-center gap-1.5 border border-white/15 px-3 text-[10px] text-white/70 disabled:opacity-40">{busy ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}Load ABI</button>
                  </div>
               </label>

               <div className="border border-white/10 bg-white/[.02] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                     <p className="text-[11px] text-white/55">ABI JSON <span className="text-white/30">(optional if verified on Etherscan)</span></p>
                     <label className="flex items-center gap-1.5 text-[10px] text-white/55 cursor-pointer hover:text-white"><FileJson size={12} />Upload<input type="file" accept=".json,application/json" onChange={(event) => void readAbiFile(event)} className="hidden" /></label>
                  </div>
                  <textarea value={abiText} onChange={(event) => { setAbiText(event.target.value); resetContract(); }} rows={4} placeholder='[{"type":"function","name":"balanceOf",...}]' className="w-full bg-black/20 border border-white/10 px-3 py-2 text-[10px] text-white font-mono outline-none focus:border-white/30 resize-y" />
               </div>

               {inspection && (
                  <>
                     <div className="flex flex-wrap items-center gap-2 border border-white/10 bg-white/[.03] p-3 text-[11px]">
                        <ShieldCheck size={14} className={inspection.verified ? "text-emerald-300" : "text-amber-300"} />
                        <span className="text-white/70">{inspection.contractName || "Contract"}</span>
                        <span className={inspection.verified ? "text-emerald-300" : "text-amber-300"}>{inspection.verified ? "Source verified" : "Uploaded ABI"}</span>
                        <span className="text-white/35">· {inspection.functions.length} functions</span>
                     </div>

                     <label className="block text-[11px] text-white/50">Function
                        <select value={selectedName} onChange={(event) => chooseFunction(event.target.value)} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">
                           {inspection.functions.map((fn, index) => <option key={`${fn.name}-${index}`} value={fn.name}>{fn.name} · {fn.stateMutability}</option>)}
                        </select>
                     </label>

                     {selected && selected.inputs.length > 0 && (
                        <div className="space-y-2">
                           {selected.inputs.map((input, index) => (
                              <label key={`${input.name ?? "arg"}-${index}`} className="block text-[11px] text-white/50">{input.name || `arg${index + 1}`} <span className="text-white/30">({input.type})</span>
                                 <input value={args[index] ?? ""} onChange={(event) => setArgs((current) => current.map((item, argIndex) => argIndex === index ? event.target.value : item))} placeholder={input.type.startsWith("tuple") || input.type.endsWith("]") ? "JSON value" : input.type} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white font-mono outline-none focus:border-white/30" />
                              </label>
                           ))}
                        </div>
                     )}

                     {payable && (
                        <label className="block text-[11px] text-white/50">Value (wei)
                           <input inputMode="numeric" value={value} onChange={(event) => setValue(event.target.value.replace(/[^\d]/g, ""))} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white font-mono outline-none focus:border-white/30" />
                        </label>
                     )}

                     {simulation && (
                        <div className="border border-white/10 bg-white/[.03] p-3 text-[11px] space-y-1.5">
                           <p className="text-white/55">Simulation <span className="text-emerald-300">{readOnly ? "succeeded" : "succeeded; review gas before signing"}</span></p>
                           {simulation.gas && <p className="text-white/55">Estimated gas: <span className="text-white font-mono">{simulation.gas}</span></p>}
                           {simulation.result !== null && <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-[10px] text-white/70 bg-black/20 p-2">{JSON.stringify(simulation.result, null, 2)}</pre>}
                           <p className="text-[10px] text-white/30 font-mono break-all">Calldata: {simulation.data.slice(0, 42)}…</p>
                        </div>
                     )}

                     <p className="text-[10px] leading-relaxed text-white/35">Only use contracts and ABIs you trust. Simulation does not detect every malicious pattern. Verify the contract address, function, arguments, and value before signing.</p>

                     <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => void simulate()} disabled={busy || !selected} className="flex items-center justify-center gap-2 border border-white/15 text-white text-[11px] font-semibold px-3 py-3 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <Braces size={14} />}Simulate</button>
                        <button type="button" onClick={() => void execute()} disabled={busy || !simulation || readOnly || Boolean(hash)} className="flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[11px] font-bold px-3 py-3 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Sign and submit</button>
                     </div>
                  </>
               )}

               {hash && (
                  <div className="border border-white/10 bg-white/[.03] p-3 text-[11px]">
                     <p className="text-white/55">Submitted transaction</p>
                     <p className="font-mono text-white/80 break-all">{hash}</p>
                  </div>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
}
