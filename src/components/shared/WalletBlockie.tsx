import makeBlockie from "ethereum-blockies-base64";

export function WalletBlockie({ address, size = 48 }: { address: string; size?: number }) {
   const src = makeBlockie(address) as string;

   return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
         <img
            src={src}
            alt={address}
            width={size}
            height={size}
            className="rounded-md"
            style={{ imageRendering: "pixelated", width: size, height: size }}
         />
         <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
            <img src="/icons/stellar-xlm-logo.svg" alt="Stellar" className="w-3.5 h-3.5" />
         </div>
      </div>
   );
}
