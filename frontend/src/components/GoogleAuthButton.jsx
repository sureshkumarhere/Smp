import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addAuth } from "../redux/slices/authSlice";

const GoogleAuthButton = ({ text = "signin_with" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error("Failed to receive Google credential");
      return;
    }

    const toastId = toast.loading("Verifying with Google...");

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const json = await res.json();
      toast.dismiss(toastId);

      if (res.ok && json.token) {
        localStorage.setItem("token", json.token);
        dispatch(addAuth(json.data));
        navigate("/");
        toast.success(json.message || "Signed in with Google successfully!");
      } else {
        toast.error(json.message || "Google Authentication failed");
      }
    } catch (err) {
      console.error("Google Auth error:", err);
      toast.dismiss(toastId);
      toast.error("Failed to authenticate with Google server");
    }
  };

  const handleError = () => {
    toast.error("Google Sign-In was cancelled or failed");
  };

  if (!clientId || clientId === "your_google_client_id_here") {
    return (
      <div className="w-full p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs text-center">
        <span>Google OAuth configured. Add </span>
        <code className="bg-black/40 px-1 py-0.5 rounded text-white">VITE_GOOGLE_CLIENT_ID</code>
        <span> in .env to activate Google login.</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full my-2">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        text={text}
        theme="filled_black"
        shape="pill"
        size="large"
      />
    </div>
  );
};

export default GoogleAuthButton;
