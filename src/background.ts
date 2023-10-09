const savableUsers = new Map<string, User>();
type UserMessage = User & { type: "user" };
type SaveMessage = { type: "save" };

chrome.runtime.onMessage.addListener(
  (message: UserMessage, sender, respond) => {
    const { type, ...user } = message;
    if (type !== "user") return false;

    const canvas = new OffscreenCanvas(600, 105);
    const context = canvas.getContext("2d");

    const bioLines = splitLines(context, user.bio);
    canvas.height = 60 + bioLines.length * 20 + 5;

    context.fillStyle = "black";
    context.fillRect(-5, -5, canvas.width + 10, canvas.height + 10);

    // context.drawImage() // still need to grab the picture

    context.font = "15px PT Sans";
    context.fillStyle = "white";
    context.fillText(user.displayName, 64, 20);
    context.fillStyle = "rgb(113, 118, 123)";
    context.fillText(user.username, 64, 40);
    context.fillStyle = "white";

    let y = 60;
    for (const line of bioLines) {
      context.fillText(line, 64, y);
      y += 20;
    }

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

function splitLines(
  context: OffscreenCanvasRenderingContext2D,
  text: string
): string[] {
  context.font = "15px PT Sans";

  const MAX_WIDTH = 524;
  const lines = [text];
  while (MAX_WIDTH < context.measureText(lines.at(-1)).width) {
    const line = lines.pop();
    const splitIndices: number[] = [];
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char.match(/\s/)) splitIndices.push(i);
      // latin unicode codeblock
      if (char.match(/[\u0000-\u04ff]/)) continue;
      // CJK unicode code block
      const cjk =
        /[\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\u2CEB0-\u2EBEF\u30000-\u3134F\u31350-\u323AF\uF900-\uFAFF\u2F800-\u2FA1F]/;
      if (char.match(cjk)) splitIndices.push(i);
    }

    let i = 0;
    while (true) {
      let j = splitIndices.shift();
      if (MAX_WIDTH > context.measureText(line.slice(0, j)).width) i = j;
      else break;
    }
    lines.push(line.slice(0, i));
    lines.push(line.slice(i).trimStart());
  }

  return lines;
}
