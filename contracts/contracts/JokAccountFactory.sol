// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@thirdweb-dev/contracts/prebuilts/account/utils/BaseAccountFactory.sol";
import "./JokAccount.sol";

contract JokAccountFactory is BaseAccountFactory  {
    event Registered(string username, address account);
    mapping(string => address) public accountOfUsername;

    constructor(
        IEntryPoint _entrypoint
    )
        BaseAccountFactory(
            address(new JokAccount(_entrypoint, address(this))), address(_entrypoint)
        )
    {}

    function _initializeAccount(
        address _account,
        address _admin,
        bytes calldata _data
    ) internal override {
        JokAccount(payable(_account)).initialize(_admin, _data);
    }

    function onRegistered(string calldata username, address account) external {
        // TODO only from account contact
        require(accountOfUsername[username] == address(0), "JokAccountFactory: username already registered");
        accountOfUsername[username] = account;
        emit Registered(username, account);
    }
}