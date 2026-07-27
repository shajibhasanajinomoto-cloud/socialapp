const { Expo } = require("expo-server-sdk");
const User = require("../models/User");

const expo = new Expo();

/**
 * Sends a push notification to a user by their MongoDB user ID.
 * Silently does nothing if the user has no registered push token
 * (e.g. hasn't granted notification permission, or hasn't opened
 * the app since this feature was added).
 */
async function sendPushToUser(userId, { title, body, data }) {
  try {
    const user = await User.findById(userId).select("pushToken");
    if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) return;

    const messages = [
      {
        to: user.pushToken,
        sound: "default",
        title,
        body,
        data: data || {},
        priority: "high",
        channelId: data?.type === "call" ? "calls" : "default",
      },
    ];

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error("Failed to send push notification:", err.message);
  }
}

module.exports = { sendPushToUser };
