import { useState } from "react";
import { Wallet, Copy, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { WalletBlockie } from "@/components/shared/WalletBlockie";
import { WalletPickerModal } from "@/components/shared/WalletPickerModal";

type WalletRow = {
   id: string;
   address: string;
   chain: string;
};

const DUMMY_WALLETS: WalletRow[] = [
   { id: "1", address: "GDWBNK2WL5B2F45GAHKQUA6DN2WJ6ZIH6FVVZBVBHRL2AXBOIJ2VQ5QI", chain: "stellar" },
];


function Card({ children }: { children: React.ReactNode }) {
   return (
      <div className="border border-white/8 bg-[#161616] rounded-lg overflow-hidden divide-y divide-white/8">
         {children}
      </div>
   );
}

export default function WalletPage() {
   const [wallets, setWallets] = useState<WalletRow[]>(DUMMY_WALLETS);
   const [pickerOpen, setPickerOpen] = useState(false);

   async function handleConnected(address: string, chain: "evm" | "stellar") {
      setWallets((prev) => [...prev, { id: Date.now().toString(), address, chain }]);
   }

   return (
      <div className="p-8 h-full overflow-y-auto">
         {/* Title */}
         <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-orange/15 shrink-0">
               <Wallet className="size-4 text-orange" />
            </div>
            <h1 className="text-2xl font-semibold text-white font-manrope">Wallet</h1>
         </div>

         <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-[13px] text-white/40">Wallets linked to your account for on-chain payments and agent interactions.</p>
            <button
               onClick={() => setPickerOpen(true)}
               className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 shrink-0 transition-colors cursor-pointer"
               style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
               <Plus size={13} strokeWidth={2.5} />
               Add Wallet
            </button>
         </div>

         <div className="mt-6 max-w-lg">
            <Card>
               {wallets.map((w) => (
                  <div key={w.id} className="flex items-center gap-4 px-5 py-4">
                     <WalletBlockie address={w.address} size={44} />
                     <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white font-mono truncate">
                           {w.address.slice(0, 6)}...{w.address.slice(-6)}
                        </p>
                        <p className="text-[11px] text-white/40 mt-0.5 uppercase tracking-wider">{w.chain}</p>
                     </div>
                     <button
                        onClick={() => {
                           void navigator.clipboard.writeText(w.address);
                           toast.success("Address copied");
                        }}
                        className="text-white/30 hover:text-white transition-colors cursor-pointer"
                     >
                        <Copy size={16} strokeWidth={1.5} />
                     </button>
                  </div>
               ))}
            </Card>
         </div>

         <WalletPickerModal
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onConnected={handleConnected}
         />
      </div>
   );
}
