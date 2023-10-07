const reactRoot = document.getElementById("react-root");

const users = new Map<string, User>();

const observer = new MutationObserver(
  debounce(() => {
    const list = document.querySelector('[aria-label="Timeline: Following"]');
    const user_cells = Array.from(
      list.querySelectorAll('[data-testid="UserCell"]')
    ).filter((node: HTMLDivElement) => {
      const username = getUserName(node);
      if (username === undefined) return true;
      return !users.has(username);
    });

    user_cells.forEach(async (element: HTMLDivElement) => {
      try {
        highlighter(element, "gold");
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

  const links = node.querySelectorAll("a");
  const displayName = crawlTextWithEmoji(links.item(1));
  const bio =
    crawlTextWithEmoji(
      node.childNodes
        .item(0)
        .childNodes.item(1)
        .childNodes.item(1) as HTMLElement
    ) || "<Unable to grab bio>";

  const user = { username, displayName, bio };
  users.set(username, user);

  console.log(user);

  chrome.runtime.sendMessage({ ...user, type: "user" });
}

function crawlTextWithEmoji(el: HTMLElement) {
  let name = "";
  const nodes = [el] as Node[];
  while (nodes.length > 0) {
    const node = nodes.shift();
    if (node === null) {
    } else if (node.nodeType === Node.TEXT_NODE) {
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
  username: string;
  displayName: string;
  bio: string;
};
