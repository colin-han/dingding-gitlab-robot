let message = {
  "success": "unknown",
  "content": undefined,
  "message": undefined,
};

exports.latestMessage = function latestMessage() {
  return message;
};
exports.pushMessage = function pushMessage(success, content, m) {
  console.log('save message................')
  message = {success, content, message: m};
};