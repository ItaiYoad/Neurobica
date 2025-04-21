import { Notification, NotificationType } from "@/types";

interface EmotionNotificationProps {
  notification: Notification;
}

export function EmotionNotification({ notification }: EmotionNotificationProps) {
  // Determine styling based on notification type and emotional state
  const getNotificationStyle = () => {
    if (!notification.emotionalState) {
      return "bg-status-moderate bg-opacity-10 border border-status-moderate";
    }
    
    const color = notification.emotionalState.color;
    return `bg-status-${color} bg-opacity-10 border border-status-${color}`;
  };

  const getIconStyle = () => {
    if (!notification.emotionalState) {
      return "text-status-moderate";
    }
    
    const color = notification.emotionalState.color;
    return `text-status-${color}`;
  };

  // Determine icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.FeedbackLoop:
        return "fas fa-exclamation-circle";
      case NotificationType.ContextBased:
        return "fas fa-heart";
      case NotificationType.ConversationBased:
        return "fas fa-comment-dots";
      default:
        return "fas fa-bell";
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-center">
        <div className={`${getNotificationStyle()} rounded-lg p-3 max-w-md`}>
          <div className="flex items-start">
            <div className={`mr-3 mt-0.5 ${getIconStyle()}`}>
              <i className={getIcon()}></i>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{notification.title}</div>
              <p className="text-sm mt-1 text-gray-600">{notification.message}</p>
              
              {notification.options && notification.options.length > 0 && (
                <div className="mt-2 flex space-x-2">
                  {notification.options.map((option, index) => (
                    <button 
                      key={index}
                      className="px-3 py-1 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
