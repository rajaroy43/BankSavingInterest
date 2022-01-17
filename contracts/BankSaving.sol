// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract BankSaving is Ownable{
  IERC20 stakingToken;
  uint256 timePeriod;//Constant TimePeriod(T)
  uint256 t0;
  uint256 R1;
  uint256 R2;
  uint256 R3;
  uint256 totalStaked;
  mapping(address=>uint256) public userDeposits;

  //EVENTS
  event TokenDeposit(address indexed user, uint256 amount);
  event TokenWithdrawn(address indexed user,uint256 receivedReward);
  event BankExtractRewardToken(address owner,uint256 amount);

//stakingtoken and _rewardPoolAmount is in erc20 18 decimals
  constructor(address _stakingToken, uint256 _timePeriod,uint256 _rewardPoolAmount)  {
        stakingToken = IERC20(_stakingToken);
        timePeriod = _timePeriod;
        t0 = block.timestamp;
        R1 = (_rewardPoolAmount*20)/100;
        R2 = (_rewardPoolAmount*30)/100;
        R3 = _rewardPoolAmount - R1 -R2 ;
    }

    function deposit(uint256 _amount)public{
        require(t0 + timePeriod > block.timestamp,"no more deposits are allowed");
		bool success = stakingToken.transferFrom(msg.sender, address(this), _amount);
		require(success,"Token transfer failed");
        userDeposits[msg.sender] += _amount;
        totalStaked += _amount;
        emit TokenDeposit(msg.sender,_amount);
    }

    function withdraw()public{
        require(block.timestamp >= t0+2*timePeriod,"users cannot withdraw their tokens");
        uint256 rewardAmount;
        uint256 userStakedAmount = userDeposits[msg.sender];
        if(block.timestamp> t0+4*timePeriod){
        //receive the full reward of R (R1+R2+R3) proportionally to their ratio of tokens in the total pool 
            uint256 R1PropotionalAmount = (userStakedAmount*R1) /totalStaked;
            uint256 R2PropotionalAmount = (userStakedAmount*R2) /totalStaked;
            uint256 R3PropotionalAmount = (userStakedAmount*R3) /totalStaked;
            rewardAmount = R1PropotionalAmount + R2PropotionalAmount + R3PropotionalAmount;
            R1 -= R1PropotionalAmount;
            R2 -= R2PropotionalAmount;
            R3 -= R3PropotionalAmount;

        }
        else if(block.timestamp >= t0+3*timePeriod && block.timestamp < t0+4*timePeriod){
            uint256 R1PropotionalAmount = (userStakedAmount*R1) /totalStaked ;
            uint256 R2PropotionalAmount = (userStakedAmount*R2) /totalStaked;
            rewardAmount = R1PropotionalAmount + R2PropotionalAmount;
            R1 -= R1PropotionalAmount;
            R2 -= R2PropotionalAmount;
        }
        else{
            //20% of R amount
            //withdraw user rewards 
            rewardAmount = (userStakedAmount  * R1 )/totalStaked;
            R1 -= rewardAmount;
        }
        uint256 receivedReward = userStakedAmount + rewardAmount;
        totalStaked -= userStakedAmount;
        userDeposits[msg.sender] -= userStakedAmount;
        bool success = stakingToken.transfer(msg.sender,receivedReward);
        require(success,"Token transfer failed");
        emit TokenWithdrawn(msg.sender,receivedReward);
    }

    function extractAllRewardToken() public onlyOwner{
        require(block.timestamp > t0+4*timePeriod,"Time not passed for extracting all reward token");
        require(totalStaked ==0 ,"All deposits not withdrawn yet");
        uint256  remainingReward = R1+R2+R3;
        R1 = 0;
        R2 = 0;
        R3 = 0;
        bool success = stakingToken.transfer(msg.sender,remainingReward);
        require(success,"Token transfer failed");
        emit BankExtractRewardToken(owner(),remainingReward);
    }
}