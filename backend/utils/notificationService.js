const Notification = require("../models/Notification");

const createNotification = async ({
  recipient,
  actor = null,
  type,
  title,
  message = "",
  link = "",
  metadata = {},
}) => {
  if (!recipient || !type || !title) {
    return null;
  }

  return Notification.create({
    recipient,
    actor,
    type,
    title,
    message,
    link,
    metadata,
  });
};

module.exports = {
  createNotification,
};
