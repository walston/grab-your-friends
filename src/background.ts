const savableUsers = new Map<string, User>();
type UserMessage = User & { type: "user" };
type SaveMessage = { type: "save" };

chrome.runtime.onMessage.addListener(
  (message: UserMessage, sender, respond) => {
    const { type, ...user } = message;
    if (type !== "user") return false;

    const canvas = new OffscreenCanvas(600, 100);
    const context = canvas.getContext("2d");

    context.fillStyle = "black";
    context.fillRect(-5, -5, 605, 105);

    context.font = "15px PT Sans, 15px Apple Color Emoji";
    context.fillStyle = "white";
    context.fillText(user.displayName, 64, 20, 524);
    context.fillStyle = "rgb(113, 118, 123)";
    context.fillText(user.username, 64, 40, 524);
    context.fillStyle = "white";
    context.fillText(user.bio, 64, 60, 524);

    canvas
      .convertToBlob({ type: "image/png" })
      .then(blobToDataUrl)
      .then((url) => {
        chrome.downloads.download({
          filename: `${user.username.slice(1)}.png`,
          url,
        });
        respond();
      });

    return true;
  }
);

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const file = new FileReader();

    file.addEventListener("load", (reader) =>
      resolve(reader.target.result as string)
    );
    file.addEventListener("error", reject);
    file.readAsDataURL(blob);
  });
}
