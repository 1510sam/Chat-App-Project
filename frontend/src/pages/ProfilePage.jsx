import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, Save, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateAvatar, updateUser, checkAuth } =
    useAuthStore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: "",
    email: "",
  });

  const [selectedImg, setSelectedImg] = useState(null);

  const isFirstLoading = useRef(true);

  useEffect(() => {
    checkAuth();

    if (authUser && isFirstLoading.current) {
      setUserData({
        username: authUser.username || "",
        email: authUser.email || "",
      });
      isFirstLoading.current = false;
    }
  }, [authUser, checkAuth]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);

      try {
        // Giữ nguyên authUser và chỉ cập nhật avatar
        await updateAvatar({ avatar: base64Image });
        navigate("/profile");
      } catch (error) {
        console.error("Avatar update failed:", error);
      }
    };
  };

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleUpdateUser = async () => {
    try {
      await updateUser(authUser._id, userData);
    } catch (error) {
      console.error("User update failed:", error);
    }
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold ">Profile</h1>
          <p className="mt-2">Your profile information</p>
        </div>
        {/* avatar upload section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={selectedImg || authUser.avatar || "/avatar.png"}
              alt="Profile"
              className="size-32 rounded-full object-cover border-4 "
            />
            <label
              htmlFor="avatar-upload"
              className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${
                    isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                  }
                `}
            >
              <Camera className="w-5 h-5 text-base-200" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUpdatingProfile}
              />
            </label>
          </div>

          <p className="text-sm text-zinc-400">
            {isUpdatingProfile
              ? "Uploading..."
              : "Click the camera icon to update your photo"}
          </p>
        </div>

        <div className="space-y-6 mt-6">
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </label>
            <input
              type="text"
              name="username"
              value={userData.username}
              onChange={handleInputChange}
              className="px-4 py-2.5 bg-base-200 rounded-lg border w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              className="px-4 py-2.5 bg-base-200 rounded-lg border w-full"
            />
          </div>

          <button
            onClick={handleUpdateUser}
            className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
            disabled={isUpdatingProfile}
          >
            <Save className="w-5 h-5" />
            {isUpdatingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="mt-6 bg-base-300 rounded-xl p-6">
          <h2 className="text-lg font-medium  mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-zinc-700">
              <span>Member Since</span>
              <span>{authUser.createdAt?.split("T")[0]}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Account Status</span>
              <span className="text-green-500">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
