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
    function run() external broadcast returns (address[1] memory) {
        // deploy the library to handle WebAuthm secp256r1 signature
        address webAuthnAddr = address(new WebAuthn256r1());
        console2.log("webAuthn", webAuthnAddr);

        // Return the addresses of the deployed contracts
        return [webAuthnAddr];
    }
}
