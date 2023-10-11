// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@thirdweb-dev/contracts/prebuilts/account/non-upgradeable/Account.sol";
import "./JokAccountFactory.sol";

contract JokAccount is Account {
     constructor(
        IEntryPoint _entrypoint,
        address _factory
    ) Account(_entrypoint, _factory) {
        _disableInitializers();
    }

    function register(
        string calldata username,
        string calldata metadataURI
    ) external {
        require(msg.sender == address(this), "JokAccount: only account itself can register");
        // TODO should it be possible to update username?
        JokAccountFactory(factory).onRegistered(username, address(this));
        _setupContractURI(metadataURI);
    }
}