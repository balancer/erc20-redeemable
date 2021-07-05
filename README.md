<p align="center">
  <a href="https://circleci.com/gh/balancer-labs/erc20-redeemable">
    <img src="https://circleci.com/gh/balancer-labs/erc20-redeemable.svg?style=svg&circle-token=9a37f7bd57941449ac54e9041a2693bdbc7ca40c" />
  </a>
</p>


## ERC20-Redeem

This implements an erc20 distribution scheme in which admin publish a merkle root of a token distribution and users can claim their tokens via merkle proofs.

## Context

Balancer has a weekly distribution of BAL tokens for liquidity providers. This process is called liquidity mining and its main objective is to distribute BAL governance tokens to stakeholders, achieving a healthy distribution in the space.  The calculation of rewards due to each liquidity provider in v1 is calculated off-chain using these scripts: [bal-mining-scripts](https://github.com/balancer-labs/bal-mining-scripts)

Initially, these tokens were distributed actively by Balancer Labs (disperse.app was used to send them) every Tuesday evening.   Distributing BAL with an ERC-20 mass transfer was very gas intensive.

Allowing users to retrieve their own BAL reduces the overhead of the transfer of BAL tokens.


## Directory structure

This repo contains a `/merkle` directory with smart contracts and a merkle tree library that powers the distribution, and `/client` that provides an interface to claiming BAL.

## User Stories

__Liquidity Provider__: As a balancer liquidity provider I earn tokens based on my contribution to my liquidity pools - so I navigate to balancer.exchange and click redeem to retrieve the tokens that are owed to me.  This sends a transaction to a smart contract which sends the tokens I am owed to my account.

__Balancer governance user__: As a balancer employee, I need to send users their accrued BAL based on the value of tokens in their pools.  I may want to restrict how long before a user can unlock their BAL

## Balancer v2

This method for distributing BAL will eventually be replaced with an on-chain distribution calculation in v2.  [v2 distributors](https://github.com/balancer-labs/balancer-v2-monorepo/tree/master/pkg/distributors)
