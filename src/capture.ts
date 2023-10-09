const reactRoot = document.getElementById("react-root");

type CapturedUser = User & { status: "done" };
type ErrordCapture = { status: "failed" };
type CaptureStatus = CapturedUser | ErrordCapture;
const users = new Map<string, CaptureStatus>();

const observer = new MutationObserver(
  debounce(async () => {
    const list = document.querySelector('[aria-label="Timeline: Following"]');
    const user_cells: HTMLDivElement[] = Array.from(
      list.querySelectorAll('[data-testid="UserCell"]')
    );

    for (const element of user_cells) {
      const username = getUserName(element);
      const prior = users.get(username);

      if (prior && prior.status === "done") {
        highlighter(element, "green");
        continue;
      }

      if (!prior || prior.status === "failed") {
        highlighter(element, "orange");
      }

      try {
        const user = await captureUser(element);
        await chrome.runtime.sendMessage({ type: "user", ...user });
        users.set(username, { status: "done", ...user });
        highlighter(element, "green");
      } catch (error) {
        console.log(error);
        const username = getUserName(element);
        users.set(username, { status: "failed" });
        highlighter(element, "red");
      }
    }
  }, 500)
);

observer.observe(reactRoot, {
  subtree: true,
  childList: true,
  attributes: false,
});

function highlighter(node: HTMLDivElement, color: string) {
  node.style.boxShadow = `10px 0 ${color}, -10px 0 ${color}`;
}

function getUserName(node: HTMLDivElement) {
  const links = node.querySelectorAll("a");
  return links.item(2)?.textContent;
}

// the permissions are set to avoid SecurityError now, but `chrome.downloads` is `undefined`
async function captureUser(node: HTMLDivElement) {
  const username = getUserName(node);

  const links = node.querySelectorAll("a");
  const displayName = crawlTextWithEmoji(links.item(1));
  const bio =
    crawlTextWithEmoji(
      node.childNodes
        .item(0)
        .childNodes.item(1)
        .childNodes.item(1) as HTMLElement
    ) || "<Unable to grab bio>";
  const image = node
    .querySelector('[data-testid^="UserAvatar-Container"] img')
    ?.getAttribute("src");

  const user: User = { username, displayName, bio, image };

  return user;
}

function crawlTextWithEmoji(el: HTMLElement) {
  let text = "";
  const nodes = [el] as Node[];
  while (nodes.length > 0) {
    const node = nodes.shift();
    if (node === null) {
      continue;
    } else if (node.nodeType === Node.TEXT_NODE) {
      text = node.textContent + text;
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName.toLowerCase() === "img"
    ) {
      const emoji = (node as HTMLImageElement).getAttribute("alt");
      text = emoji + text;
    } else if (node.childNodes.length > 0) {
      node.childNodes.forEach((child) => nodes.unshift(child));
    }
  }

  return text;
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

type User = {
  username: string;
  displayName: string;
  bio: string;
  image: string;
};
