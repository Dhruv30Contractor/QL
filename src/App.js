import { Routes, Route } from "react-router-dom";
import "./global.css";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import PostDetails from "./pages/PostDetails";
import CreatePost from "./pages/CreatePost";
import LoginPage from "./pages/auth/Login";
import NotificationsPage from "./pages/Notification";
import Signup from "./pages/auth/Signup";
import EditPost from "./pages/EditPost";
import RepublishPost from './pages/RepublishPost';

function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<Signup />} />

      <Route path="/" element={<MainLayout />}>
        {/* Trending (Homepage) */}
        <Route index element={<Home mode="category" category="trending" />} />

        {/* Latest */}
        <Route
          path="latest"
          element={<Home mode="category" category="latest" />}
        />

        {/* Following */}
        <Route
          path="following"
          element={<Home mode="category" category="following" />}
        />

        {/* Interests */}
        <Route
          path="interests"
          element={<Home mode="category" category="interests" />}
        />

        {/* Inner Circle */}
        <Route
          path="inner-circle"
          element={<Home mode="category" category="inner circle" />}
        />

        {/* My Posts */}
        <Route
          path="my-posts"
          element={<Home mode="category" category="my posts" />}
        />

        {/* Saved Posts */}
        <Route
          path="saved-posts"
          element={<Home mode="category" category="saved posts" />}
        />

        {/* Scheduled Posts */}
        <Route
          path="scheduled-posts"
          element={<Home mode="category" category="scheduled posts" />}
        />

        {/* Other routes */}
        <Route path="post/:id" element={<PostDetails />} />
        <Route path="create-post" element={<CreatePost />} />
        <Route path="edit-post/:id" element={<EditPost />} />

        {/* Interest-based polls */}
        <Route path="interest/:topic" element={<Home mode="interest" />} />

        {/* Tag-based polls */}
        <Route path="tag/:tagName" element={<Home mode="tag" />} />

        {/* User's own polls */}
        <Route path="user/:username" element={<Home mode="user" />} />

        <Route path="notifications" element={<NotificationsPage />} />

        <Route path="/republish-post/:id" element={<RepublishPost />} />
      </Route>
    </Routes>
  );
}

export default App;
