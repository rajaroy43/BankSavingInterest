const { ethers, network } = require("hardhat");

async function main() {

  const BankSaving = await ethers.getContractFactory("BankSaving");
  const ATRACTokenAddress = "0x98d9A611Ad1b5761bdC1dAAc42c48E4d54CF5882"
  const timePeriod = 5*60;//5 minutes
  const rewardPoolAmount = ethers.utils.parseUnits("10000", 18);
  const args = [ATRACTokenAddress,timePeriod,rewardPoolAmount]
  console.log(`Deploying BankSaving contract to ${network.name}` );
  const bankSaving = await BankSaving.deploy(...args);
  await bankSaving.deployed();
  const bankSavingAddress = bankSaving.address;
  console.log("BankSaving deployed to:", bankSavingAddress);
  const StakingToken = await ethers.getContractAt("IERC20",ATRACTokenAddress);
  console.log("Transering reward pool amount to bank saving contract");
  await StakingToken.transfer(bankSavingAddress,rewardPoolAmount);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
