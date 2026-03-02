import { useParams } from "react-router-dom";
import articles from "../../../shared/utils/data/articles";
import NotFoundPage from "../../static-pages/NotFoundPage";
import { v4 as uuidv4 } from "uuid";

export default function Article() {
  const params = useParams();
  const article = articles.find((article) => article.slug === params.slug);

  if (!article) {
    return <NotFoundPage />;
  }

  const text = article.description;
  return (
    <>
      <h1>{article.title}</h1>
      <img src={article.image} alt="woodenField" className="articleImage" />
      {text.map((el) => (
        <p key={uuidv4()}>{el}</p>
      ))}
    </>
  );
}
