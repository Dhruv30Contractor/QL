import { useParams } from "react-router-dom";
import { useState } from "react";
import InterestPollList from "../components/pollLists/InterestPollList";
import TagPollList from "../components/pollLists/TagPollList";
import CategoryPollList from "../components/pollLists/CategoryPollList";
import UserProfile from "../components/pollLists/UserPollList";
import PostModal from "../components/PostModal";

const Home = ({ mode, category }) => {
  const { topic, tagName, username } = useParams();
  const [selectedPostId, setSelectedPostId] = useState(null);

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      {mode === "interest" && topic && (
        <InterestPollList topic={topic} onOpenModal={setSelectedPostId} />
      )}
      {mode === "tag" && tagName && (
        <TagPollList tag={tagName} onOpenModal={setSelectedPostId} />
      )}
      {mode === "user" && username && (
        <UserProfile onOpenModal={setSelectedPostId} />
      )}
      {mode === "category" && category && (
        <CategoryPollList category={category} onOpenModal={setSelectedPostId} />
      )}

      {selectedPostId && (
        <PostModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}
    </div>
  );
};

export default Home;   
