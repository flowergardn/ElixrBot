import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";

const Elixr: AppType = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default api.withTRPC(Elixr);
