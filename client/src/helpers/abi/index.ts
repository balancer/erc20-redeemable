import { abi as Multicall } from '@/helpers/abi/Multicall.json';
import { abi as IERC20 } from '@/../../merkle/build/contracts/IERC20.json';
import { abi as MerkleProof } from '@/../../merkle/build/contracts/MerkleProof.json';
import { abi as MerkleRedeem } from '@/../../merkle/build/contracts/MerkleRedeem.json';
import { abi as Migrations } from '@/../../merkle/build/contracts/Migrations.json';
import { abi as TToken } from '@/../../merkle/build/contracts/TToken.json';

export default {
  Multicall,
  IERC20,
  MerkleProof,
  MerkleRedeem,
  Migrations,
  TToken
};
