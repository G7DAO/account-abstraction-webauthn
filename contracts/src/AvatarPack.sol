// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AvatarPack is ERC721, Ownable {
    uint256 public lastTokenId = 0;

    constructor() ERC721("AvatarPack", "JAP") {}

    function mint() external returns (uint256 tokenId) {
        lastTokenId++;
        _safeMint(msg.sender, lastTokenId);
        return lastTokenId;
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        return string(abi.encodePacked("ipfs://", tokenId));
    }

    function userTokens(address userWallet) public view returns (uint256[] memory) {
        uint256 balance = this.balanceOf(userWallet);
        if (balance == 0) {
            return new uint256[](0);
        }
        
        uint256[] memory res = new uint256[](balance);
        uint256 counter = 0;

        for (uint256 i = 1; i <= lastTokenId; i++) {
            if (this.ownerOf(i) == userWallet) {
                res[counter] = i;
                counter++;
            }

            if (counter == balance) {
                break;
            }
        }

        return res;
    }
}
