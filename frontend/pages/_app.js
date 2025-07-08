import '../src/styles/index.css';
import '../src/styles/App.css';
import { AuthProvider } from './index';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
