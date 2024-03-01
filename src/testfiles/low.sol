

contract LOW {

    // L_group1
    function func1(uint256 _amount) public payable{
        // L-002
        bool _isNative = true;
        if (_isNative) {
            // Instance #1
            require(msg.value <= _amount);
            // Instance #2
            require(_amount >= msg.value);
            // if is not discovered. Should be improved later.
        }
        
        // L-005
        ERC721(address(1)).transferFrom(msg.sender, address(1), 1);
        
        // L-006
        _mint();

        // L-007

        


    }
    

}