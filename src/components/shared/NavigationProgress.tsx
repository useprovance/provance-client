import { useEffect, useRef } from "react";
import { useNavigation } from "react-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, minimum: 0.15, trickle: true, trickleSpeed: 150 });

const DISPLAY_THRESHOLD_MS = 50;

export default function NavigationProgress() {
   const navigation = useNavigation();
   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   useEffect(() => {
      if (navigation.state === "loading") {
         timerRef.current = setTimeout(() => NProgress.start(), DISPLAY_THRESHOLD_MS);
      } else {
         if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
         }
         NProgress.done();
      }

      return () => {
         if (timerRef.current) clearTimeout(timerRef.current);
      };
   }, [navigation.state]);

   return null;
}
