import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'PayChain',
  projectId: '923e9c8a4fa6edfc01e8425a9e562b07',
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/62zAvtV2BRufVH7KMsYmN`),
  },
});