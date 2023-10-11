import { NextPage } from "next";
import { Login } from "../components/login";
import styles from "../styles/Home.module.scss";

const Home: NextPage = () => {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Login />
      </div>
    </main>
  );
};

export default Home;
