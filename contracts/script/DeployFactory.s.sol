// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {EntryPoint} from "@account-abstraction/contracts/core/EntryPoint.sol";
import {WebAuthn256r1} from "../src/WebAuthn256r1.sol";
import {console2} from "@forge-std/console2.sol";
import {Test} from "@forge-std/Test.sol";
import {WebAuthnAccountFactory} from "../src/WebAuthnAccountFactory.sol";
import {Paymaster} from "../src/Paymaster.sol";
import {BaseScript} from "./Base.s.sol";

/// @notice This script can be used to deploy all the contracts needed on
///         a network with an entrypoint contract
contract DeployFactory is BaseScript, Test {
    address private immutable ENTRYPOINT_ADDRESS;
    address private constant BUNDLER =
        0xaE0bDc4eEAC5E950B67C6819B118761CaAF61946;
    address private constant LOGIN_SERVICE_ADDRESS =
        0x90F79bf6EB2c4f870365E785982E1f101E93b906;

    constructor() {
        ENTRYPOINT_ADDRESS = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;
    }

    modifier checkEntryPointExistence() {
        uint32 size;
        address target = ENTRYPOINT_ADDRESS;

        assembly ("memory-safe") {
            size := extcodesize(target)
        }
        require(size > 0, "no entrypoint in this network");

        _;
    }

    function run()
        external
        broadcast
        checkEntryPointExistence
        returns (address[2] memory)
    {
        // // get the entrypoint deployed on the network
        EntryPoint entrypoint = EntryPoint(payable(ENTRYPOINT_ADDRESS));
        console2.log("entrypoint", ENTRYPOINT_ADDRESS);

        // // deploy the library to handle WebAuthm secp256r1 signature
        address webAuthnAddr = 0xd7bCC6F6588ddb5CF2f64e19293B117d418AE34b; // address(new WebAuthn256r1());
        // console2.log("webAuthn", webAuthnAddr);

        // deploy the account factory
        WebAuthnAccountFactory webAuthnAccountFactory = new WebAuthnAccountFactory(
                entrypoint,
                webAuthnAddr,
                LOGIN_SERVICE_ADDRESS
            );
        console2.log("webAuthnAccountFactory", address(webAuthnAccountFactory));

        // // Deploy the paymaster. The sender is set as the owner of the paymaster
        // Paymaster paymaster = new Paymaster(entrypoint, msg.sender);
        // console2.log("paymaster", address(paymaster));
        // console2.log("paymaster owner", msg.sender);

        // // Add stake and deposit to the paymaster
        // paymaster.addStake{value: 0.001 ether}(60 * 10);
        // paymaster.deposit{value: 0.002 ether}();
        // console2.log("paymaster deposit", paymaster.getDeposit());

        // Feed the bundler
        // payable(BUNDLER).transfer(0.01 ether);
        // console2.log("bundler balance", BUNDLER.balance);

        // Return the addresses of the deployed contracts
        return [ENTRYPOINT_ADDRESS, address(webAuthnAccountFactory)];
    }
}
