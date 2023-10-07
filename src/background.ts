const savableUsers = new Map<string, User>();
type UserMessage = User & { type: "user" };
type SaveMessage = { type: "save" };

chrome.runtime.onMessage.addListener(
  (message: UserMessage, sender, respond) => {
    if (message.type !== "user") return false;
    const { type, ...user } = message;
    const { username } = user;
    savableUsers.set(username, user);
    respond();
    return true;
  }
);
