// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EzToken is ERC20 {
    constructor() ERC20("EZ Token", "EZT") {
    }

    function mint(uint256 supply) public {
        _mint(msg.sender, supply);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }
}
