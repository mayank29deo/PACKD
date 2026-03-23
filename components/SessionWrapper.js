'use client';
import { SessionProvider } from 'next-auth/react';
import GuidedTour from './GuidedTour';

export default function SessionWrapper({ children, session }) {
  return (
    <SessionProvider session={session}>
      {children}
      <GuidedTour />
    </SessionProvider>
  );
}
