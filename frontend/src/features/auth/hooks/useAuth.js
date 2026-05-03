import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { getMe, login, logout, register } from "../services/auth.api.js";
import toast from "react-hot-toast";

export const useAuth = () => {
  const { user, setUser, loading, setLoading } = useContext(AuthContext);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const data = await login(email, password);
      setUser(data.user);
      toast.success(`Welcome back!`);
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (username, email, password) => {
    setLoading(true);
    try {
      const data = await register(username, email, password);
      toast.success("Account created successfully!");
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getAndSetUser = async () => {
      try {
        const data = await getMe();
        setUser(data.user);
      } catch (error) {
        // Not logged in — expected on first load
      } finally {
        setLoading(false);
      }
    };

    getAndSetUser();
  }, []);

  return {
    user,
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
  };
};
