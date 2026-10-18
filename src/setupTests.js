import "@testing-library/jest-dom/vitest";

// jsdom has no <dialog> API. Mirror just enough for Sheet.js: open attribute
// toggling and a "close" event.
const proto = typeof HTMLDialogElement !== "undefined" ? HTMLDialogElement.prototype : HTMLElement.prototype;
if (!proto.showModal) {
  proto.showModal = function showModal() {
    this.setAttribute("open", "");
  };
}
if (!proto.close) {
  proto.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

window.confirm = () => true;
window.HTMLElement.prototype.scrollIntoView = () => {};
