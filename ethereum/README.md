## ERC20-Redeem: OnChain Balances

## Complexity Analysis

As new allocations are stored in this contract, and new users join the platform, the need for memory grows to accomodate the allocations.
In order to claim one's tokens, a transaction to the `claim` or `claimWeek` function must be executed - the gas required to do this increases with the number of allocations scales with the number of weeks of unclaimed allocations.  In the unlikely event that a user attempts to withdraw so many weeks of earnings that the transaction will not fit in a block _O(n)_, the user can redeem their claims on a week by week basis by calling `claimWeek`, which will only process a disbursement for one week's worth of funds.
