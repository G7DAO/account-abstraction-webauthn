forge script script/Deploy4337FriendlyNetwork.s.sol --private-key 0xdbe2b933bb7d57444cdba9c71b5ceb79b60dc455ad691d856e6e4025cf542caa --broadcast -vvv --rpc-url https://base-goerli.publicnode.com --verify --verifier-url https://api-goerli.basescan.org/api


forge script script/DeployFactory.s.sol \
    --private-key 0xdbe2b933bb7d57444cdba9c71b5ceb79b60dc455ad691d856e6e4025cf542caa \
    --broadcast -vvv --rpc-url https://sepolia.base.org


forge script script/WebAuthn.s.sol \
    --private-key 0xdbe2b933bb7d57444cdba9c71b5ceb79b60dc455ad691d856e6e4025cf542caa \
    --broadcast -vvv --rpc-url https://sepolia.base.org \
    --verify --verifier-url https://api-sepolia.basescan.org/api \
    --etherscan-api-key MFEFZQ6IBU2IPRD8YTW4EN2BYKPRQUPP4R 


forge verify-contract 0x8Ad159a275AEE56fb2334DBb69036E9c7baCEe9b src/WebAuthn256r1.sol:WebAuthn256r1 --watch


forge verify-contract --verifier sourcify 

0x8Ad159a275AEE56fb2334DBb69036E9c7baCEe9b