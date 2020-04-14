window.addEventListener('DOMContentLoaded', ready);
function ready(event) {
  document.addEventListener('contextmenu', disableContextMenu);
}
function disableContextMenu(event) {
  event.preventDefault();
}