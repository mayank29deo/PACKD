import './globals.css';
import { AppProvider } from '../lib/AppContext';
import SessionWrapper from '../components/SessionWrapper';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'PACKD — Find Your Pack. Own Your Sport.',
  description: 'The operating system for your active life. Community-first, sport-agnostic platform for athletes in Bangalore.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-packd-bg text-packd-text min-h-screen">
        <SessionWrapper>
          <AppProvider>
            {children}
          </AppProvider>
        </SessionWrapper>
        <Analytics />
      </body>
    </html>
  );
}
