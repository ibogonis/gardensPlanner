import { Link } from "react-router-dom";
import articles from "../data/articles";

export default function Blog() {
  return (
    <main>
      {articles.map((el) => (
        <div key={el.id} className="card white-card">
          <div>
            <img src={el.image} alt="garden plan" />
          </div>
          <div className="text-card">
            <h4>{el.title}</h4>
            <p>{el.shortDescr}</p>
            <Link to={el.slug}>Read more</Link>
          </div>
        </div>
      ))}
    </main>
  );
}
