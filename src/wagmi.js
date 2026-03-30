import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'PayChain',
  projectId: '923e9c8a4fa6edfc01e8425a9e562b07',
  chains: [base],
  transports: {
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/62zAvtV2BRufVH7KMsYmN`),
  },
});
