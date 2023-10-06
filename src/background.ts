type UserObjectMessage = {
  type: "user_object";
  filename: string;
  user: User;
};

chrome.runtime.onMessage.addListener(
  (message: UserObjectMessage, sender, sendResponse) => {
    if (message.type !== "user_object") return false;

    createUserProfile(message.user)
      .then((url) => {
        console.log({ dataUrl: url });
        const filename = message.filename;
        chrome.downloads.download({ filename, url });
        sendResponse();
      })
      .catch((error) => {
        console.log(error);
        sendResponse();
      });
    return true;
  }
);

async function createUserProfile(user: User): Promise<string> {
  const canvas = new OffscreenCanvas(598, 130);
  const context = canvas.getContext("2d");

  context.fillStyle = "black";
  context.fillRect(-5, -5, canvas.width + 10, canvas.height + 10);

  const { username, displayName, bio, imageSource } = user;

  const profilePic = await getProfilePicture(imageSource);
  context.drawImage(profilePic, 12, 8, profilePic.width, profilePic.height);

  const col2 = 64;
  const col2width = canvas.width - col2 - 12;

  context.font = "15px Apple Color Emoji";

  context.fillStyle = "white";
  context.fillText(displayName, col2, 20, col2width);
  context.fillStyle = "#7176b";
  context.fillText(username, col2, 40, col2width);
  context.fillStyle = "white";
  context.fillText(bio, col2, 60, col2width);

  const blob = await canvas.convertToBlob({ type: "image/png" });

  return URL.createObjectURL(blob);
}

function getProfilePicture(src: string): Promise<any> {
  return fetch(src).then((response) => console.log(response));
}
