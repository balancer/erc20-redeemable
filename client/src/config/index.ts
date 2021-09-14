import homestead from '@/config/homestead.json';
import homesteadLido from '@/config/homestead-lido.json';
import arbitrum from '@/config/arbitrum.json';
import kovan from '@/config/kovan.json';

const configs = {
  production: { homestead, kovan, homesteadLido, arbitrum }
};
const env = process.env.VUE_APP_ENV || 'production';
const network = process.env.VUE_APP_NETWORK || 'homestead';

export default configs[env][network];
