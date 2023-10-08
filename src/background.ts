const savableUsers = new Map<string, User>();
type UserMessage = User & { type: "user" };
type SaveMessage = { type: "save" };

chrome.runtime.onMessage.addListener(
  (message: UserMessage, sender, respond) => {
    const { type, ...user } = message;
    if (type !== "user") return false;

    chrome.downloads.download({
      filename: `${user.username.slice(1)}.json`,
      url: `data:application/json,${encodeURIComponent(JSON.stringify(user))}`,
    });
    respond();
    return true;
  }
);
