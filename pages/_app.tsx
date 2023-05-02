import type { AppProps } from "next/app";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";
import Footer from "../componetns/Footer";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider>
      <Component {...pageProps} />
      <Footer />
    </ThirdwebProvider>
  );
}

export default MyApp;
