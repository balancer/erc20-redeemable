import { WebSocketProvider } from '@ethersproject/providers';
import config from '@/config';

const wsProvider = new WebSocketProvider(config.alchemyWsUrl);

export default wsProvider;
