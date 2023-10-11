/* eslint-disable @next/next/no-img-element */
import { useSDK } from "@metamask/sdk-react";
import { Signer } from "ethers";
import { useState } from "react";
import { Blocks } from "react-loader-spinner";
import {
  loginAccount,
  mmLoginAccount,
  registerAccount,
  walletConnect,
} from "../lib/wallet";
import styles from "../styles/Home.module.scss";
import { Connected } from "./connected";

export const Login = () => {
  const [username, setUsername] = useState("Guest");
  const [signer, setSigner] = useState<Signer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState("");
  const { sdk, connected, connecting, provider, chainId } = useSDK();

  const registerWallet = async () => {
    try {
      setIsLoading(true);
      const wallet = await registerAccount("super-hard-challenge", (status) =>
        setLoadingStatus(status)
      );
      if (!wallet) {
        throw new Error("Canceled");
      }

      const s = await wallet.getSigner();
      setSigner(s);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.error(e);
      setError((e as any).message);
    }
  };

  const connectWallet = async () => {
    // if (!username || !password) return;
    try {
      setIsLoading(true);
      const wallet = await loginAccount((status) => setLoadingStatus(status));
      const s = await wallet.getSigner();
      setSigner(s);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.error(e);
      // setError("");
      setError((e as any).message);
    }
  };

  const connectMetamaskWallet = async () => {
    try {
      setIsLoading(true);
      const wallet = await mmLoginAccount((status) => setLoadingStatus(status));
      if (!wallet) {
        throw new Error("Canceled");
      }

      const s = await wallet!.getSigner();
      setSigner(s);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.error(e);
      setError((e as any).message);
    }
  };

  const connectWalletConnect = async () => {
    try {
      setIsLoading(true);
      const wallet = await walletConnect((status) => setLoadingStatus(status));
      if (!wallet) {
        throw new Error("Canceled");
      }

      const s = await wallet!.getSigner();
      setSigner(s);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.error(e);
      setError((e as any).message);
    }
  };

  return username && signer ? (
    <>
      <Connected signer={signer} username={username} />
    </>
  ) : isLoading ? (
    <div className={styles.filler}>
      <Blocks
        visible={true}
        height="80"
        width="80"
        ariaLabel="blocks-loading"
        wrapperStyle={{}}
        wrapperClass="blocks-wrapper"
      />
      <p className={styles.label} style={{ textAlign: "center" }}>
        {loadingStatus}
      </p>
    </div>
  ) : error ? (
    <div className={styles.filler}>
      <p className={styles.label} style={{ textAlign: "center" }}>
        ❌ {error}
      </p>
      <button className={styles.button} onClick={() => setError("")}>
        Try again
      </button>
    </div>
  ) : (
    <>
      <div className={styles.row_center} style={{ marginTop: "2rem" }}>
        <h1 className={styles.title}>Simple user onboarding flow</h1>
      </div>
      <div className={styles.row_center} style={{ marginTop: "2rem" }}>
        <h2>Account Abstraction + WebAuthn</h2>
      </div>
      <div className={styles.filler}>
        <button className={styles.button} onClick={() => registerWallet()}>
          Register a new Account
        </button>

        <button className={styles.button} onClick={() => connectWallet()}>
          Login
        </button>
      </div>
    </>
  );
};
