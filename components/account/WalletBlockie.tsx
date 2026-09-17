"use client";

import makeBlockie from "ethereum-blockies-base64";
import Image from "next/image";

export function WalletBlockie({ address, size = 48 }: { address: string; size?: number }) {
  const src = makeBlockie(address);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={address}
        width={size}
        height={size}
        className="rounded-md"
        style={{ imageRendering: "pixelated" }}
        unoptimized
      />
      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center">
        <Image src="/icons/stellar-xlm-logo.svg" alt="Stellar" width={16} height={16} />
      </div>
    </div>
  );
}
