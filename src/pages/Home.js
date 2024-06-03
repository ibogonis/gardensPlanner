import Card from "../UI/Card";
import mainContent from "../data/mainPageContent";
import Scheme from "../UI/Scheme";
import articles from "../data/articles";
export default function Home() {
  return (
    <main>
      <Card {...mainContent} styles="white-card" />
      <Scheme />
      <div className="padding40">
        <h2 className="bottomBorder">
          from our <span>blog</span>
        </h2>
      </div>
      <Card {...articles[0]} styles="white-card" />
    </main>
  );
}
