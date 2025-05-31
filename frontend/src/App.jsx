import React, { useEffect, useState } from "react";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import GroupChatBox from "./components/chatComponents/GroupChatBox";
import NotificationBox from "./components/NotificationBox";
import Loading from "./components/loading/Loading";

// Pages
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Error from "./pages/Error";
import MyProfile from "./pages/MyProfile";

// Redux Store
import store from "./redux/store";

// Layout Component
const AppLayout = () => {
  const [toastPosition, setToastPosition] = useState("bottom-left");

  const {
    isGroupChatBox,
    isNotificationBox,
    isLoading,
  } = useSelector((store) => store.condition);

  useEffect(() => {
    const updatePosition = () => {
      setToastPosition(window.innerWidth >= 600 ? "bottom-left" : "top-left");
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  return (
    <div className="bg-gradient-to-tr from-black via-blue-900 to-black text-white min-h-screen flex flex-col">
      {/* Toast Notifications */}
      <ToastContainer
        position={toastPosition}
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
        limit={3}
        toastStyle={{
          border: "1px solid #dadadaaa",
          textTransform: "capitalize",
        }}
      />

      {/* Header */}
      <Header />
      <div className="h-16 md:h-20" />

      {/* Main Content */}
      <main className="flex-1 min-h-[85vh] p-2 sm:p-4">
        <Outlet />
        {/* Overlays */}
        {isGroupChatBox && <GroupChatBox />}
        {isNotificationBox && <NotificationBox />}
      </main>

      {/* Loading Overlay */}
      {isLoading && <Loading />}

      {/* Sidebar */}
      <Sidebar />
    </div>
  );
};

// Define Routes
const routers = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: "profile", element: <MyProfile /> },
      { path: "signup", element: <SignUp /> },
      { path: "signin", element: <SignIn /> },
      { path: "*", element: <Error /> },
    ],
  },
]);

// App Entry
function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={routers} />
    </Provider>
  );
}

export default App;
