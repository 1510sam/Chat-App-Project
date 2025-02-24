import { X } from "lucide-react";
import { Phone } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="avatar">
          <div className="size-10 rounded-full relative">
            <img
              src={selectedUser.avatar || "/avatar.png"}
              alt={selectedUser.username}
            />
          </div>
        </div>

        {/* User info */}
        <div>
          <h3 className="font-medium">{selectedUser.username}</h3>
          <p className="text-sm text-base-content/70">
            {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Close button */}
      <div className="flex justify-around items-center gap-4">
        <button>
          <Phone />
        </button>
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
