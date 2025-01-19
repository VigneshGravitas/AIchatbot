import type { AppProps } from 'next/app';
import { TeamsWrapper } from '../components/TeamsWrapper';

export default function App({ Component, pageProps }: AppProps) {
  const isTeamsEnvironment = typeof window !== 'undefined' && window.parent !== window.self;

  if (isTeamsEnvironment) {
    return (
      <TeamsWrapper>
        <Component {...pageProps} />
      </TeamsWrapper>
    );
  }

  return <Component {...pageProps} />;
}
