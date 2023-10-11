import {
  SmartContract,
  ThirdwebSDKProvider,
  useAddress,
  useClaimNFT,
  useContract,
  useOwnedNFTs,
  useTotalCirculatingSupply,
  useTransferNFT,
} from "@thirdweb-dev/react";
import { Signer } from "ethers";
import { useEffect, useState } from "react";
import { Blocks } from "react-loader-spinner";
import { shortenIfAddress } from "../lib/addresses";
import {
  DEV_CAT_CONTRACT,
  NOUNCE_CONTRACT,
  THIRDWEB_API_KEY,
  chain,
} from "../lib/constants";
import styles from "../styles/Home.module.scss";

export const Connected = ({
  username,
  signer,
}: {
  username: string;
  signer: Signer;
}) => {
  return (
    <ThirdwebSDKProvider
      signer={signer}
      activeChain={chain}
      clientId={THIRDWEB_API_KEY || ""}
    >
      <ConnectedInner username={username} />
    </ThirdwebSDKProvider>
  );
};

const ConnectedInner = ({ username }: { username: string }) => {
  const address = useAddress();
  const { contract: contractJok } = useContract(DEV_CAT_CONTRACT);
  const { contract: contractNounce } = useContract(NOUNCE_CONTRACT);
  const [isNounsMode, setNounceMode] = useState(true);

  const contract = isNounsMode ? contractNounce : contractJok;

  const { mutate: claim, isLoading: claimLoading } = useClaimNFT(contract);
  const { mutate: transfer, isLoading: transferLoading } =
    useTransferNFT(contract);
  const {
    data: ownedNFTs,
    isLoading: nftsLoading,
    refetch,
  } = useOwnedNFTs(contract, address);
  const [activeItems, setActiveItems] = useState<string[]>([]);
  const [selectedCloth, setSelectedCloth] = useState(
    isNounsMode
      ? "/assets/packs/nouns/3-heads/1.png"
      : "/assets/packs/common/clothes/22.png"
  );

  const availableClothes = isNounsMode
    ? [
        "/assets/packs/nouns/3-heads/8.png",
        "/assets/packs/nouns/3-heads/9.png",
        "/assets/packs/nouns/3-heads/10.png",
      ]
    : [
        "/assets/packs/common/clothes/2.png",
        "/assets/packs/common/clothes/4.png",
        "/assets/packs/common/clothes/7.png",
        "/assets/packs/common/clothes/24.png",
        "/assets/packs/common/clothes/29.png",
      ];

  useEffect(() => {
    const lastSaved = localStorage.getItem(address!);
    if (!lastSaved) {
      randomAvatar();
    } else {
      setItems(JSON.parse(lastSaved));
    }
  }, [address]);

  function randomAvatar() {
    const x = isNounsMode
      ? [
          "/assets/packs/nouns/1-bodies/" +
            (Math.floor(Math.random() * 30) + 1) +
            ".png",
          "/assets/packs/nouns/2-accessories/" +
            (Math.floor(Math.random() * 42) + 1) +
            ".png",
          selectedCloth,
          "/assets/packs/nouns/4-glasses/" +
            (Math.floor(Math.random() * 15) + 1) +
            ".png",
          "",
        ]
      : [
          "/assets/packs/common/skin/" +
            (Math.floor(Math.random() * 16) + 1) +
            ".png",
          "/assets/packs/common/mouth/" +
            (Math.floor(Math.random() * 15) + 1) +
            ".png",
          "/assets/packs/common/eyes/" +
            (Math.floor(Math.random() * 14) + 1) +
            ".png",
          "/assets/packs/common/eyebrows/" +
            (Math.floor(Math.random() * 14) + 1) +
            ".png",
          selectedCloth,
          "", // "/assets/packs/common/accessories/1.png",
          "/assets/packs/common/hair/" +
            (Math.floor(Math.random() * 19) + 1) +
            ".png",
        ];

    setItems(x);
  }

  function setItems(items: string[]) {
    localStorage.setItem(address!, JSON.stringify(items));

    setActiveItems(items);
  }

  function updateCloth(url: string) {
    setSelectedCloth(url);

    const x = [...activeItems];
    if (isNounsMode) {
      x[2] = url;
    } else {
      x[4] = url;
    }

    setItems(x);
  }

  return (
    <>
      <h1 className={styles.title} style={{ marginTop: "2rem" }}>
        Welcome <span className={styles.gradientText1}>{username}</span>
      </h1>
      <div className={styles.toggle}>
        <div>Design System: </div>
        <button
          className={
            isNounsMode ? styles.active + " " + styles.button : styles.button
          }
          onClick={() => {
            setNounceMode(true);
            setSelectedCloth(
              "/assets/packs/nouns/3-heads/" +
                (Math.floor(Math.random() * 7) + 1) +
                ".png"
            );
          }}
        >
          Nouns
        </button>
        <button
          className={
            !isNounsMode ? styles.active + " " + styles.button : styles.button
          }
          onClick={() => {
            setNounceMode(false);
            setSelectedCloth("/assets/packs/common/clothes/22.png");
          }}
        >
          Jok
        </button>
      </div>
      <hr className={styles.divider} />
      <p className={styles.label}>
        Smart Wallet Address:{" "}
        <a
          href={`https://thirdweb.com/${chain.slug}/${address}`}
          target="_blank"
        >
          {shortenIfAddress(address)}
        </a>
      </p>
      <div className={styles.filler}>
        {nftsLoading || claimLoading || transferLoading ? (
          <>
            <Blocks
              visible={true}
              height="80"
              width="80"
              ariaLabel="blocks-loading"
              wrapperStyle={{}}
              wrapperClass="blocks-wrapper"
            />
            <p>
              {nftsLoading
                ? "Loading your account..."
                : claimLoading
                ? "Claiming..."
                : "Transfering..."}
            </p>
          </>
        ) : true ? (
          <>
            <div className={styles.avatar}>
              {activeItems.map((x, i) => (x ? <img key={i} src={x} /> : <></>))}
            </div>
            {/* <ThirdwebNftMedia metadata={ownedNFTs[0].metadata} /> */}
            <p>Your Avatar</p>
            <p className={styles.description} style={{ fontWeight: "bold" }}>
              Your Identity
            </p>
            <button
              className={styles.button}
              style={{
                marginTop: 0,
                width: "130px",
                borderRadius: "0 5px 5px 0",
              }}
              onClick={() => randomAvatar()}
            >
              Randomize
            </button>

            <hr className={styles.divider} />

            <div>
              <h2>Clothes</h2>
              <div className={styles.clothes}>
                {availableClothes.map((x, i) => {
                  const isOwned = ownedNFTs
                    ?.map((x) => x.metadata.id)
                    .includes(i.toString());

                  return (
                    <div key={i} className={styles.clothesContainer}>
                      <div
                        className={
                          isOwned ? styles.available : styles.notAvailable
                        }
                        onClick={() => {
                          if (!isOwned) {
                            return;
                          }

                          updateCloth(x);
                        }}
                      >
                        {!isNounsMode && (
                          <img src="/assets/packs/common/skin/2.png" />
                        )}
                        <img src={x} />
                      </div>

                      {isOwned && (
                        <button
                          className={styles.button}
                          onClick={() => {
                            const walletAddress = prompt(
                              "To Wallet Address / ENS"
                            );
                            if (!walletAddress) {
                              return;
                            }

                            transfer(
                              {
                                to: walletAddress,
                                tokenId: i,
                                amount: 1,
                              },
                              {
                                onSuccess: async () => {
                                  // wait for 1 sec before refetching
                                  await new Promise((resolve) =>
                                    setTimeout(resolve, 1000)
                                  );
                                  await refetch();
                                },
                                onError: (err) =>
                                  alert((err as any).reason || err),
                              }
                            );
                          }}
                        >
                          Transfer
                        </button>
                      )}

                      {!isOwned && (
                        <button
                          className={styles.button}
                          onClick={() =>
                            claim(
                              {
                                quantity: 1,
                                tokenId: i,
                              },
                              {
                                onSuccess: async () => {
                                  alert("Claim successful");
                                  // wait for 1 sec before refetching
                                  await new Promise((resolve) =>
                                    setTimeout(resolve, 1000)
                                  );
                                  await refetch();
                                },
                                onError: (err) => {
                                  let reason = (err as any).reason || err;
                                  if (reason == "!Qty") {
                                    reason =
                                      "Already claimed max number of DevCats!";
                                  }
                                  alert(reason);
                                },
                              }
                            )
                          }
                        >
                          Claim
                        </button>

                        // <button
                        //   className={styles.button}
                        //   style={{
                        //     marginTop: 0,
                        //     width: "100px",
                        //     borderRadius: "0 5px 5px 0",
                        //   }}
                        //   onClick={() => {}}
                        // >
                        //   Claim
                        // </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* <p style={{ color: "#999" }}>
              view on{" "}
              <a
                href={`https://testnets.opensea.io/assets/base-goerli/${DEV_CAT_CONTRACT.toLowerCase()}/${
                  ownedNFTs[0].metadata.id
                }`}
                target="_blank"
              >
                OpenSea
              </a>
            </p> */}

            <hr className={styles.divider} />
            <div className={styles.row_center} style={{ width: "100%" }}>
              {/* <input
                type="text"
                placeholder="Transfer to wallet address / ENS"
                className={styles.input}
                style={{ borderRadius: "5px 0 0 5px" }}
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              /> */}
              {/* <button
                className={styles.button}
                style={{
                  marginTop: 0,
                  width: "130px",
                  borderRadius: "0 5px 5px 0",
                }}
                onClick={() =>
                  transfer(
                    {
                      to: transferTo,
                      tokenId: ownedNFTs[0].metadata.id,
                      amount: 1,
                    },
                    {
                      onSuccess: async () => {
                        alert("Transfer successful");
                        // wait for 1 sec before refetching
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1000)
                        );
                        await refetch();
                      },
                      onError: (err) => alert((err as any).reason || err),
                    }
                  )
                }
              >
                Transfer
              </button> */}
            </div>
          </>
        ) : (
          <>
            <p className={styles.description}>Claim your Token</p>
            <button
              className={styles.button}
              onClick={() =>
                claim(
                  {
                    quantity: 1,
                    tokenId: 0,
                  },
                  {
                    onSuccess: async () => {
                      alert("Claim successful");
                      // wait for 1 sec before refetching
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                      await refetch();
                    },
                    onError: (err) => {
                      let reason = (err as any).reason || err;
                      if (reason == "!Qty") {
                        reason = "Already claimed max number of DevCats!";
                      }
                      alert(reason);
                    },
                  }
                )
              }
            >
              Claim
            </button>
          </>
        )}
      </div>
      <TotalClaimed contract={contract} />
    </>
  );
};

const TotalClaimed = ({
  contract,
}: {
  contract: SmartContract | undefined;
}) => {
  const { data: totalClaimed } = useTotalCirculatingSupply(contract, 0);
  const { data: totalClaimed2 } = useTotalCirculatingSupply(contract, 1);
  const { data: totalClaimed3 } = useTotalCirculatingSupply(contract, 2);
  const { data: totalClaimed4 } = useTotalCirculatingSupply(contract, 3);
  const { data: totalClaimed5 } = useTotalCirculatingSupply(contract, 4);

  console.log(
    totalClaimed,
    totalClaimed2,
    totalClaimed3,
    totalClaimed4,
    totalClaimed5
  );
  const total =
    (totalClaimed?.toNumber() ?? 0) +
    (totalClaimed2?.toNumber() ?? 0) +
    (totalClaimed3?.toNumber() ?? 0) +
    (totalClaimed4?.toNumber() ?? 0) +
    (totalClaimed5?.toNumber() ?? 0);

  return (
    <div className={styles.column_center} style={{ marginBottom: "2rem" }}>
      <p style={{ color: "#999" }}>
        <b>{total?.toString() || "-"}</b> T-Shirts have been claimed
      </p>
      <p className={styles.label} style={{ color: "#999", marginTop: "5px" }}>
        Contract:{" "}
        <a
          href={`https://goerli.etherscan.io/address/${DEV_CAT_CONTRACT}`}
          target="_blank"
        >
          {shortenIfAddress(DEV_CAT_CONTRACT)}
        </a>
      </p>
    </div>
  );
};
