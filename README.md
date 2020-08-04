## ERC20-Reedem

This project implements a smart contract that distributes token rewards to participants throughout a week-long interval.
Admins add token allocations for each user to the contract, which then become claimable in the form of ERC20 tokens across the 7 days of the week, ensuring that a large distribution doesn't upset the market for tokens.

## Context

This project was completed for Balancer as a a candidate assessment.

Balancer has a weekly distribution of BAL tokens for liquidity providers. This process is called liquidity mining and its main objective is to distribute BAL governance tokens to many meaningful stakeholders, achieving a healthy distribution in the space.

Today these tokens are distributed actively by Balancer Labs (disperse.app is used to send them) every Tuesday evening. 

The community is discussing a lock-up mechanism for most of the tokens LPs receive. Having the code ready would speed up the governance process of implementing this change.

Currently BAL is distributed in a gas intensive ERC-20 mass transfer.   Allowing users to retrieve their own BAL reduces the overhead of the transfer of BAL tokens and allows additional logic to be attached to the new tokens, such as when they can be released.


## User Stories

__Liquidity Provider__: As a balancer liquidity provider I earn tokens based on my contribution to my liquidity pools - so I navigate to balancer.exchange and click redeem to retrieve the tokens that are owed to me.  This sends a transaction to a smart contract which sends the tokens I am owed to my account.

__Balancer governance user__: As a balancer employee, I need to send users their accrued BAL based on the value of tokens in their pools.  I may want to restrict how long before a user can unlock their BAL


## Complexity Analysis

As new allocations are stored in this contract, and new users join the platform, the need for memory grows to accomodate the allocations.
In order to claim one's tokens, a transaction to the `claim` or `claimWeek` function must be executed - the gas required to do this increases with the number of allocations scales with the number of weeks of unclaimed allocations.  In the unlikely event that a user attempts to withdraw so many weeks of earnings that the transaction will not fit in a block _O(n)_, the user can redeem their claims on a week by week basis by calling `claimWeek`, which will only process a disbursement for one week's worth of funds.

## Future Requirements

In the future, a user's rewards may be vested over time.  This would require adding an allocation more than 0-7 days in the future (most likely for a year). 
