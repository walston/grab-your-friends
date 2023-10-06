const reactRoot = document.getElementById("react-root");

const users = new Map<string, User>();

const observer = new MutationObserver(
  debounce(() => {
    const list = document.querySelector('[aria-label="Timeline: Following"]');
    console.log(list);
    const user_cells = Array.from(
      list.querySelectorAll('[data-testid="UserCell"]')
    ).filter((node: HTMLDivElement) => {
      const username = getUserName(node);
      if (username === undefined) return true;
      return !users.has(username);
    });

    user_cells.forEach(async (element: HTMLDivElement) => {
      try {
        highlighter(element, "yellow");
        await captureUser(element);
        highlighter(element, "green");
      } catch (error) {
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
  user.image = user_image.getAttribute("src");
  const display_name = links.item(1).textContent; // this can be improved if we can translate image urls to unicode code points
  user.displayName = display_name;
  const bio = node.childNodes
    .item(0)
    .childNodes.item(1)
    .childNodes.item(1).textContent;
  user.bio = bio;

  const filename = `${username.slice(1)}.png`;

  console.log(filename, user);
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
  image?: string;
};
