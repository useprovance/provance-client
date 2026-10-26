const C = {
   dark: "var(--ink-heavy)",
   ink: "var(--ink-dark)",
   charcoal: "var(--charcoal-light)",
   sand: "var(--sand-mid)",
   sandLight: "var(--sand)",
};

const HEX_PATH =
   "M 155.836 166.22 C 150.404 169.356 141.596 169.356 136.164 166.22 L 4.074 89.964 C -1.358 86.828 -1.358 81.743 4.074 78.607 L 136.164 2.352 C 141.596 -0.784 150.404 -0.784 155.836 2.352 L 287.926 78.607 C 293.358 81.743 293.358 86.828 287.926 89.964 Z";

function HexOutline({ uid }: { uid: string }) {
   return (
      <svg viewBox="0 0 292 169" width="100%" overflow="visible" role="presentation">
         <defs>
            <clipPath id={`clip-${uid}`}>
               <path d={HEX_PATH} transform="translate(0 0.215)" />
            </clipPath>
         </defs>
         <path d={HEX_PATH} fill={C.dark} fillOpacity="0.55" transform="translate(0 0.215)" />
         <path
            d={HEX_PATH}
            fill="transparent"
            stroke="#ffffff"
            strokeOpacity="0.45"
            strokeWidth="1"
            strokeDasharray="680.265 680.265"
            strokeDashoffset="0"
            clipPath={`url(#clip-${uid})`}
            transform="translate(0 0.215)"
         />
      </svg>
   );
}

function Label({ text }: { text: string }) {
   return (
      <div className="flex items-center w-full">
         <div className="w-[7px] h-[7px] rounded-full bg-sand-mid flex-shrink-0" />
         <div className="flex-1 h-px bg-sand-mid" />
         <div className="w-[7px] h-[7px] rounded-full bg-sand-mid flex-shrink-0" />
         <span className="text-[10px] font-bold tracking-[0.2em] text-sand whitespace-nowrap ml-2">{text}</span>
      </div>
   );
}

export default function HeroGraphic() {
   return (
      <div className="relative w-[90%] max-w-[560px] aspect-[0.617647]">
         <div className="absolute left-1/2 -translate-x-px top-[4%] bottom-[0%] w-[2px] bg-sand-mid opacity-60 pointer-events-none" />

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[100%] flex items-center justify-center">
            <div className="w-[7px] h-[7px] rounded-full bg-sand-mid" />
         </div>

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[83.5%] w-[76%]">
            <HexOutline uid="bottom" />
         </div>

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[82%] w-[43%]">
            <svg viewBox="0 0 294 187" width="100%" overflow="visible" role="presentation">
               <path
                  d="M 154 159.89 C 149.553 162.445 142.447 162.445 138 159.89 L 0 80.89 L 137.972 1.909 C 142.416 -0.636 149.583 -0.636 154.027 1.909 L 292 80.89 Z"
                  fill={C.dark} stroke={C.sandLight} strokeWidth="1" strokeDasharray="669.298 669.298" strokeDashoffset="0" strokeLinecap="round" strokeLinejoin="round" transform="translate(1 1.11)"
               />
               <path
                  d="M 292 19.599 C 292 21.344 290.799 23.018 288.661 24.252 L 154.06 101.957 C 149.609 104.527 142.391 104.527 137.94 101.957 L 3.339 24.252 C 1.201 23.018 0 21.344 0 19.599 L 0 0 L 137.5 79 C 142.334 81.777 149.666 81.777 154.5 79 L 292 0 Z"
                  fill={C.ink} stroke={C.sandLight} strokeWidth="1" strokeDasharray="713.645 713.645" strokeDashoffset="0" strokeLinecap="round" strokeLinejoin="round" transform="translate(1 82)"
               />
            </svg>
         </div>

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[76%] w-[43%]">
            <svg viewBox="0 0 294 187" width="100%" overflow="visible" role="presentation">
               <path
                  d="M 97 104.75 C 94.198 106.107 89.802 106.107 87 104.75 L 0 50.057 L 87.115 1.014 C 89.915 -0.338 94.085 -0.338 96.885 1.014 L 184 50.057 Z"
                  fill={C.dark} stroke={C.sandLight} strokeWidth="1" strokeDasharray="425.817 425.817" strokeDashoffset="0" strokeLinecap="round" strokeLinejoin="round" transform="translate(55 62.75)"
               />
               <path
                  d="M 184 19.5 C 184 21.245 182.638 23.266 180.5 24.5 L 100.06 70.957 C 95.609 73.527 88.391 73.527 83.94 70.957 L 3.5 24.5 C 1.362 23.266 0 21.245 0 19.5 L 0 0 L 83.5 48 C 88.334 50.777 95.666 50.777 100.5 48 L 184 0 Z"
                  fill={C.ink} stroke={C.sandLight} strokeWidth="1" strokeDasharray="464.594 464.594" strokeDashoffset="0" strokeLinecap="round" strokeLinejoin="round" transform="translate(55 113)"
               />
            </svg>
         </div>

         <div className="absolute -translate-x-1/2 -translate-y-1/2 top-[77%] left-[71%] w-[43%] z-10">
            <Label text="MATCH" />
         </div>

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[64%] w-[76%]">
            <HexOutline uid="mid-lower" />
         </div>

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[59%] w-[45%]">
            <svg viewBox="0 0 292 216" width="100%" overflow="visible" role="presentation">
               <path
                  d="M 291.285 113.085 L 184.667 174.636 L 39.025 152.107 L 0 68.028 L 132.606 0 L 291.106 70 Z M 181.459 69.986 C 161.78 58.626 129.875 58.626 110.196 69.986 C 90.517 81.347 90.517 99.766 110.196 111.127 C 129.875 122.488 161.78 122.488 181.459 111.127 C 201.138 99.766 201.138 81.347 181.459 69.986 Z"
                  fill={C.ink} fillRule="evenodd" stroke={C.sandLight} strokeWidth="1" strokeDasharray="982.807 982.807" strokeDashoffset="0" transform="translate(0.394 41)"
               />
               <path
                  d="M 291 106.508 L 184.486 168 L 38.986 145.492 L 0 61.492 L 106.513 0 L 252.013 22.508 Z M 181.282 63.449 C 161.622 52.099 129.748 52.099 110.088 63.449 C 90.428 74.799 90.428 93.201 110.088 104.551 C 129.748 115.901 161.622 115.901 181.282 104.551 C 200.942 93.201 200.942 74.799 181.282 63.449 Z"
                  fill={C.dark} fillRule="evenodd" stroke={C.sandLight} strokeWidth="1" strokeDasharray="979.646 979.646" strokeDashoffset="0" transform="translate(0.394 3.477)"
               />
               <path d="M 0 0 L 0 44 L 39 128 L 39 84 Z" fill={C.charcoal} stroke={C.sandLight} strokeWidth="1" strokeDasharray="273.224 273.224" strokeDashoffset="0" transform="translate(0.5 65)" />
               <path d="M 0 0 L 145.5 22.5 L 145.5 66.5 L 0 44 Z" fill={C.dark} stroke={C.sandLight} strokeWidth="1" strokeDasharray="382.459 382.459" strokeDashoffset="0" transform="translate(39.5 149)" />
               <line x1="146" y1="215" x2="146" y2="300" stroke="var(--sand-mid)" strokeWidth="1.5" strokeOpacity="0.8" />
            </svg>
         </div>

         <div className="absolute -translate-x-1/2 -translate-y-1/2 top-[57%] left-[71%] w-[43%]">
            <Label text="HIRE" />
         </div>

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[43%] w-[76%]">
            <HexOutline uid="mid-upper" />
         </div>

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[36%] w-[43%]">
            <svg viewBox="0 0 298 299" width="100%" overflow="visible" role="presentation">
               <path d="M 147.5 0 C 228.962 0 295 66.038 295 147.5 C 295 228.962 228.962 295 147.5 295 C 66.038 295 0 228.962 0 147.5 C 0 66.038 66.038 0 147.5 0 Z" fill={C.ink} stroke={C.sandLight} strokeWidth="1" strokeDasharray="926.9 926.9" strokeDashoffset="0" transform="translate(2 2)" />
               <path d="M 138.982 0 C 215.756 0 277.993 62.29 278 139.132 C 277.452 159.117 263.978 179.095 237.392 194.457 C 210.243 210.143 174.634 218 139 218 C 103.366 218 67.757 210.143 40.608 194.457 C 14.229 179.214 0.759 159.429 0.015 139.6 L 0 139.132 C 0.007 62.29 62.209 0 138.982 0 Z" fill={C.dark} stroke="none" transform="translate(10 8.5)" />
               <path d="M 138.982 0 C 215.756 0 277.993 62.29 278 139.132 C 277.452 159.117 263.978 179.095 237.392 194.457 C 210.243 210.143 174.634 218 139 218 C 103.366 218 67.757 210.143 40.608 194.457 C 14.229 179.214 0.759 159.429 0.015 139.6 L 0 139.132 C 0.007 62.29 62.209 0 138.982 0 Z" fill={C.dark} stroke={C.sandLight} strokeWidth="1" strokeDasharray="784.918 784.918" strokeDashoffset="0" transform="translate(10 8.5)" />
               <path d="M 44.494 0 C 69.073 0 88.998 20.001 89 44.675 C 88.825 51.093 84.511 57.507 76 62.44 C 67.308 67.477 55.908 70 44.5 70 C 33.092 70 21.692 67.477 13 62.44 C 4.555 57.546 0.243 51.193 0.005 44.826 L 0 44.675 C 0.002 20.001 19.916 0 44.494 0 Z" fill={C.charcoal} stroke={C.sandLight} strokeWidth="1" strokeDasharray="251.596 251.596" strokeDashoffset="0" transform="translate(104 104.5)" />
               <line x1="149" y1="297" x2="149" y2="418" stroke="var(--sand-mid)" strokeWidth="1.5" strokeOpacity="0.8" />
            </svg>
         </div>

         <div className="absolute -translate-x-1/2 -translate-y-1/2 top-[36%] left-[71%] w-[43%] z-10">
            <Label text="EXECUTE" />
         </div>

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[23%] w-[76%]">
            <HexOutline uid="top" />
         </div>

         <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[14%] w-[34%]">
            <svg viewBox="0 0 292 299" width="100%" overflow="visible" role="presentation">
               <path d="M 292 84.5 L 146 167.948 L 0 85.5 L 146.14 0 Z" fill={C.charcoal} stroke={C.sandLight} strokeWidth="1" strokeDasharray="673.719 673.719" strokeDashoffset="0" />
               <path d="M 144.692 212.802 L 0 0 L 145.192 82.302 Z" fill={C.dark} stroke={C.sandLight} strokeWidth="1" strokeDasharray="554.731 554.731" strokeDashoffset="0" transform="translate(0.808 85.698)" />
               <path d="M 0 213.802 L 0.5 83.302 L 146.15 0 Z" fill={C.ink} stroke={C.sandLight} strokeWidth="1" strokeDasharray="557.271 557.271" strokeDashoffset="0" transform="translate(145.5 84.698)" />
               <line x1="146" y1="84.5" x2="146" y2="-55" stroke="var(--sand-mid)" strokeWidth="1.5" strokeOpacity="0.8" />
               <circle cx="146" cy="-55" r="4" fill="var(--sand-mid)" />
               <line x1="146" y1="298.5" x2="146" y2="455" stroke="var(--sand-mid)" strokeWidth="1.5" strokeOpacity="0.8" />
               <circle cx="146" cy="455" r="4" fill="var(--sand-mid)" />
            </svg>
         </div>

         <div className="absolute -translate-x-1/2 -translate-y-1/2 top-[15%] left-[71%] w-[43%]">
            <Label text="EARN" />
         </div>
      </div>
   );
}
