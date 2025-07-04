import "../styles/index.css";
import "../styles/App.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./index";

function MyApp({ Component, pageProps }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default MyApp;
