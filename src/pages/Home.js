import { useParams } from "react-router-dom";
import InterestPollList from "../components/pollLists/InterestPollList";
import TagPollList from "../components/pollLists/TagPollList";
import CategoryPollList from "../components/pollLists/CategoryPollList";
import UserProfile from "../components/pollLists/UserPollList";

const Home = ({ mode, category }) => {
  const { topic, tagName, username } = useParams();

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      {mode === "interest" && topic && <InterestPollList topic={topic} />}
      {mode === "tag" && tagName && <TagPollList tag={tagName} />}
      {mode === "user" && username && <UserProfile />}
      {mode === "category" && category && (
        <CategoryPollList category={category} />
      )}
    </div>
  );
};

export default Home;
