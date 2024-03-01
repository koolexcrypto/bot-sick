// import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract test {
    uint256 a;

    uint256 maxDebtRate;
    uint24 poolFee;

    // event testEvent(uint104);

    uint256[] private arrayWithNoPop;

    uint256[] private arrayWithNoPop2;

    address gov;

    // function f(
    //     uint256 _x,
    //     uint256 _amount2,
    //     address contract_,
    //     uint24 unsafeDowncastDif
    // ) public nonReentrant {
    //     //         uint i;
    //     //         i++;
    //     //         for(uint x=0; x < 10 ; x ++){
    //     //             a--;
    //     //             {
    //     //               uint256 b = 1;
    //     //             }
    //     //         }
    //     //         {
    //     //             a++;
    //     //         }
    //     //     if(_amount2 > 1){
    //     //     }
    //     //      token.approve(address(1), 0) ;

    //     //     bytes data;
    //     // if(contract_.code.length > 0){

    //     //  }
    //     //     // (bool success, bytes memory result) = contract_.call(data);

    //     //     // contract_.call(data);

    //     //     contract_.call{value:10,gas:1}(data);

    //         // contract_.call{value:10}(data);

    //     //     require(_x < 100) ;

    //     //     maxDebtRate = _x;

    //     // uint256 unsafeDowncast= 5;
    //     uint224 unsafeDowncast = 5;
    //     uint8 x = uint224(unsafeDowncast);
    //     // uint8(unsafeDowncast);

    //     uint256 bal = ERC20(address(1)).balanceOf(address(1));
    //     ERC20(address(1)).safeTransferFrom(msg.sender, address(1), 1);
    //     uint256 balAfter = ERC20(address(1)).balanceOf(address(1));

    //     // uint256 dec = ERC20(address(1)).decimals();


    //     //   uint256 _btcPrice = uint256(BTC_FEED.latestAnswer()) * 1e10;


    //         arrayWithNoPop.push(1);

    //         //   arrayWithNoPop2.push(0);


    // }

    struct AccrueInfo {
        uint64 debtRate;
    }

    function popArray() public{
            //   arrayWithNoPop.pop();

    // uint256 annumDebtRate = 3;
    // uint64 annumDebtRate1 = uint64(annumDebtRate / 31536000); //per second
    //     uint8 x = uint8(annumDebtRate1);
        // AccrueInfo memory _accrueInfo;
        // _accrueInfo.debtRate = uint64(annumDebtRate / 31536000); //per second

            // bytes32 _digest; bytes32 _s ;bytes32 _r; uint8 _v;
            // address _signatory = ecrecover(_digest, _v, _r, _s);

        //    uint24 _collateralLiquidated = getLiquidationFee(uint192(0), address(0));


    }

    //    function setPoolFee(uint24 _newFee) external onlyOwner {
    //        emit PoolFee(poolFee, _newFee);
    //        require(_newFee < 100 && _newFee > 0);
    //        poolFee = _newFee;
    //   }

    // function f2(uint256 _amount) public /*onlyOwner*/ {
    //     //send
    //     bool _isNative = true;
    //     if (_isNative) {
    //         // require(msg.value <= _amount);
    //         // require(_amount >= msg.value);
    //         // _mint();
    //         ERC721 token;
    //         uint256 tId;
    //         uint256 _amount2;
    //         // require(ERC20(address(1)).transferFrom(msg.sender,address(1),1));
    //         // if(_amount2 > 1){
    //         // }
    //         if(_amount2 > 1){
    //              tId = 1;
    //             ERC20(address(1)).transferFrom(msg.sender,address(1),_amount2);
    //         }

    //         // ERC20(address(1)).transferFrom(msg.sender,address(1),1);
    //         token.approve(address(1), 0);
    //         //   token.approve(address(1),1);

    //         token.approve(address(1),_amount2);
    //         token.approve(address(1), 0);

    //         // ERC20(address(1)).approve(address(1),0);

    //         // if (msg.value <= _amount) revert();
    //         // if (_amount >= msg.value ) revert();
    //         // _sendNative(_srcOft, _amount, _dstChainId, _slippage);
    //     } else {
    //         if (msg.value == 0) revert();
    //         // _sendToken(_srcOft, _amount, _dstChainId, _slippage, _ercData);
    //     }

    //      if(_amount2 > 0){
    //     }
    // }

    // function tokenURI(
    //     uint256 _tokenId
    // ) public view override returns (string memory) {
    //     // if(tokenURIs[_tokenId] > 0){}
    //      _requireMinted(_tokenId);
    //     // _ownerOf(tokenId) != address(0);
    //                 bytes32 _digest; bytes32 _s ;bytes32 _r; uint8 _v;
    //         address _signatory = ecrecover(_digest, _v, _r, _s);

    //     return tokenURIs[_tokenId];
    // }
    
       function liquidate(
           address[] calldata users,
        //    uint256[] calldata maxBorrowParts,
           bytes calldata collateralToAssetSwapData,
           address addr
      ) external {
            // if(addr != address(0)){

            // }
            gov = addr;
        }









}
