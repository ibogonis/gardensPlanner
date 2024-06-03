import advantages from "../data/advantages";
import styles from "./Scheme.module.css";
import { v4 as uuidv4 } from "uuid";

export default function Scheme() {
  return (
    <div className={styles.scheme}>
      <div className={styles.titleCircle}>
        <div className={styles.yellow}></div>
        <h2>
          why do you <br /> need <span>plan</span>
        </h2>
      </div>

      <div className={styles.flex}>
        {advantages.map((el) => (
          <div key={uuidv4()}>
            <div className={styles.yellowCircle}></div>
            <p>{el.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
