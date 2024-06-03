import Button from "./Button";
import { Link } from "react-router-dom";
export default function Card({
  title,
  text,
  textButton,
  image,
  styles,
  linkTo,
}) {
  return (
    <div className={`card ${styles}`}>
      <div className="card-content">
        <h2>{title}</h2>
        <p>{text}</p>
        <Link to={linkTo}>
          <Button textButton={textButton} />
        </Link>
      </div>
      <div className="card-image">
        <img src={image} alt={title} />
      </div>
    </div>
  );
}
