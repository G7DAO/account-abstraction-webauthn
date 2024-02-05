// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import {EntryPoint} from "@account-abstraction/contracts/core/EntryPoint.sol";
import {WebAuthn256r1} from "../src/WebAuthn256r1.sol";
import {console2} from "@forge-std/console2.sol";
import {Test} from "@forge-std/Test.sol";
import {WebAuthnAccountFactory} from "../src/WebAuthnAccountFactory.sol";
import {Paymaster} from "../src/Paymaster.sol";
import {BaseScript} from "./Base.s.sol";

contract DeployAnvil is BaseScript, Test {
    function run() external broadcast returns (address[4] memory) {
        // deploy the library contract and return the address
        EntryPoint entryPoint = new EntryPoint();
        console2.log("entrypoint", address(entryPoint));

        address webAuthnAddr = address(new WebAuthn256r1());
        console2.log("webAuthn", webAuthnAddr);
        WebAuthnAccountFactory webAuthnAccountFactory = new WebAuthnAccountFactory(
                entryPoint,
                webAuthnAddr,
                0x90F79bf6EB2c4f870365E785982E1f101E93b906
            );

        console2.log("webAuthnAccountFactory", address(webAuthnAccountFactory));

        Paymaster paymaster = new Paymaster(entryPoint, msg.sender);
        console2.log("paymaster", address(paymaster));
        console2.log("paymaster owner", msg.sender);

        paymaster.addStake{value: 1 wei}(60 * 10);
        paymaster.deposit{value: 10 ether}();
        console2.log("paymaster deposit", paymaster.getDeposit());

        EntryPoint.DepositInfo memory depositInfo = entryPoint.getDepositInfo(
            address(paymaster)
        );
        console2.log("paymaster staked", depositInfo.staked);
        console2.log("paymaster stake", depositInfo.stake);
        console2.log("paymaster deposit", depositInfo.deposit);
        console2.log("paymaster unstakeDelaySec", depositInfo.unstakeDelaySec);
        console2.log("paymaster withdrawTime", depositInfo.withdrawTime);

        return [
            address(entryPoint),
            webAuthnAddr,
            address(paymaster),
            address(webAuthnAccountFactory)
        ];
    }
}
