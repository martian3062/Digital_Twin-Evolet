"use client";

import React, { ReactNode } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import {
  polygonAmoy,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

// Mock Project ID for RainbowKit (User should replace with real one)
const projectId = 'b406e224133c542839d885be3c8d813ca'; 

const config = getDefaultConfig({
  appName: 'MedGenie Digital Twin',
  projectId,
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(),
  },
  ssr: true, 
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#8b5cf6', // Violet-500
            accentColorForeground: 'white',
            borderRadius: 'medium',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Contract Constants
export const MEDGENIE_ACCESS_ADDRESS = '0x8b5cf68b5cf68b5cf68b5cf68b5cf68b5cf68b5c'; // Placeholder
export { default as MedGenieABI } from './abi/MedGenieAccess.json';
