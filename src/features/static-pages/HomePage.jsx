import Card from "../../shared/ui/Card/Card";
import mainContent from "../../shared/utils/data/mainPageContent";
import Scheme from "../../shared/ui/Scheme/Scheme";
import articles from "../../shared/utils/data/articles";
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
