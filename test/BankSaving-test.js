const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
use(solidity);
describe("Bank Saving", function () {
  let bankSaving,testToken,timePeriod,depositAmount,account1,account2,rewardPoolAmount;
  beforeEach(async()=> {
    const accounts = await ethers.getSigners()
    account1 = accounts[0]
    account2 = accounts[1]
    const BankSavingContract = await ethers.getContractFactory("BankSaving");
    const TestErc20 = await ethers.getContractFactory("TestErc20");
    testToken = await TestErc20.deploy();
    timePeriod = 5*60;//5 minutes
    rewardPoolAmount = ethers.utils.parseUnits("1000", 18);
    const args = [testToken.address,timePeriod,rewardPoolAmount]
    bankSaving = await BankSavingContract.deploy(...args);
    await testToken.transfer(bankSaving.address,rewardPoolAmount)
    const approveAmount = ethers.utils.parseUnits("1000000000000", 18);
    await testToken.approve(bankSaving.address,approveAmount)
    depositAmount = ethers.utils.parseUnits("1000", 18);

  });

  describe('Depositing Token', () => {
    it("Should deposit  token to staking token ",async()=>{
       await expect(bankSaving.deposit(depositAmount))
      .emit(bankSaving,"TokenDeposit")
      .withArgs(account1.address,depositAmount)
    });

    it("Should not deposit  token to staking token without approving ",async()=>{
      await testToken.transfer(account2.address,depositAmount)
      await expect(bankSaving.connect(account2).deposit(depositAmount))
        .to.be.revertedWith("ERC20: transfer amount exceeds allowance")
    });

    it("Should not deposit  token After T has passed  ",async()=>{
      await ethers.provider.send("evm_increaseTime", [timePeriod]);
      await ethers.provider.send("evm_mine");
      await expect(bankSaving.deposit(depositAmount))
        .to.be.revertedWith("no more deposits are allowed")
    });

    it("Should not withdraw  during lock time period  ",async()=>{
      await expect(bankSaving.withdraw())
        .to.be.revertedWith("users cannot withdraw their tokens")
    });
  })
  

  describe('Withdrawing Token', () => {
    beforeEach(async()=>{
      await bankSaving.deposit(depositAmount);
      await ethers.provider.send("evm_increaseTime", [2*timePeriod]);
      await ethers.provider.send("evm_mine");
    })
    it("Should withdraw  token from interval t0+2T to t0+3T  ",async()=>{
      const R1 = rewardPoolAmount.div(5)//20% 
      const rewardAmount = depositAmount.mul(R1).div(depositAmount);//total staked here is depositAmount
      const receivedReward = depositAmount.add(rewardAmount)
      await expect(bankSaving.withdraw())
        .emit(bankSaving,"TokenWithdrawn")
        .withArgs(account1.address,receivedReward)
    });

    it("Should withdraw  token from interval t0+3T to t0+4T  ",async()=>{
      await ethers.provider.send("evm_increaseTime", [timePeriod]);
      await ethers.provider.send("evm_mine");
      const R1 = rewardPoolAmount.div(5)//20% 
      const R2 = rewardPoolAmount.mul(30).div(100)
      const rewardAmount = depositAmount.mul(R1.add(R2)).div(depositAmount);//total staked here is depositAmount
      const receivedReward = depositAmount.add(rewardAmount)
      await expect(bankSaving.withdraw())
        .emit(bankSaving,"TokenWithdrawn")
        .withArgs(account1.address,receivedReward)
    });

    it("Should withdraw  token after t0+4T   ",async()=>{
      await ethers.provider.send("evm_increaseTime", [2*timePeriod]);
      await ethers.provider.send("evm_mine");
      const R1 = rewardPoolAmount.div(5)//20% 
      const R2 = rewardPoolAmount.mul(30).div(100)
      const R3 = rewardPoolAmount.mul(50).div(100)
      const rewardAmount = depositAmount.mul(R1.add(R2).add(R3)).div(depositAmount);//total staked here is depositAmount
      const receivedReward = depositAmount.add(rewardAmount)
      await expect(bankSaving.withdraw())
        .emit(bankSaving,"TokenWithdrawn")
        .withArgs(account1.address,receivedReward)
    });
  })

  describe('Extracting all reward  Token by owner', () => {
    beforeEach(async()=>{
      await ethers.provider.send("evm_increaseTime", [4*timePeriod]);
      await ethers.provider.send("evm_mine");
    })

    it("Should extract tokens after 4T passed  ",async()=>{
      const remainingReward = rewardPoolAmount;
      await expect(bankSaving.extractAllRewardToken())
        .emit(bankSaving,"BankExtractRewardToken")
        .withArgs(account1.address,remainingReward)
    });

    it("Should not extract tokens after 4T passed by non admin  ",async()=>{
      const remainingReward = rewardPoolAmount;
      await expect(bankSaving.connect(account2).extractAllRewardToken())
        .to.be.revertedWith("Ownable: caller is not the owner")
    });

  })

});
