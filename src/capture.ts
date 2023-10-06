const reactRoot = document.getElementById("react-root");

const users = new Map<string, User>();

const observer = new MutationObserver(
  debounce(() => {
    const list = document.querySelector('[aria-label="Timeline: Following"]');
    const user_cells = Array.from(
      list.querySelectorAll('[data-testid="UserCell"]')
    )
      .filter((node: HTMLDivElement) => {
        const username = getUserName(node);
        if (username === undefined) return true;
        return !users.has(username);
      })
      .slice(0, 1);

    user_cells.forEach(async (element: HTMLDivElement) => {
      try {
        highlighter(element, "yellow");
        await captureUser(element);
        highlighter(element, "green");
      } catch (error) {
        console.log(error);
        users.delete(getUserName(element));
        highlighter(element, "red");
      }
    });
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

async function captureUser(node: HTMLDivElement) {
  const username = getUserName(node);
  const user: User = {};
  users.set(username, user);
  user.username = username;

  const links = node.querySelectorAll("a");
  const user_image = links.item(0).querySelector("img");
  user.imageSource = user_image.getAttribute("src");
  const display_name = crawlDisplayName(links.item(1));
  user.displayName = display_name;
  const bio =
    node.childNodes?.item(0)?.childNodes.item(1)?.childNodes.item(1)
      ?.textContent ?? "<Unable to grab bio>";
  user.bio = bio;

  const filename = `${username.slice(1)}.png`;
  await chrome.runtime.sendMessage({
    type: "user_object",
    filename,
    user,
  });
}

function crawlDisplayName(el: HTMLElement) {
  let name = "";
  const nodes = [el] as Node[];
  while (nodes.length > 0) {
    const node = nodes.shift();
    if (node.nodeType === Node.TEXT_NODE) {
      name = node.textContent + name;
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName.toLowerCase() === "img"
    ) {
      const emoji = (node as HTMLImageElement).getAttribute("alt");
      name = emoji + name;
    } else if (node.childNodes.length > 0) {
      node.childNodes.forEach((node) => nodes.unshift(node));
    }
  }

  return name;
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
  username?: string;
  displayName?: string;
  bio?: string;
  imageSource?: string;
};
