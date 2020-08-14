import homestead from '@/config/homestead.json';
import kovan from '@/config/kovan.json';

const configs = {
  production: { homestead, kovan }
};
const env = process.env.VUE_APP_ENV || 'production';
const network = process.env.VUE_APP_NETWORK || 'homestead';

export default configs[env][network];
