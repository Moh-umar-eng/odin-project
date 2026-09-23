const dialog = document.getElementById("profileModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

// 1. Open modal using showModal() (NOT .show(), which lacks modal accessibility)
openBtn.addEventListener("click", () => {
  dialog.showModal();
});

// 2. Explicit close buttons
closeBtn.addEventListener("click", () => dialog.close());
cancelBtn.addEventListener("click", () => dialog.close("canceled"));

// 3. Click outside to dismiss (clicks on the backdrop hit the dialog element itself)
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  const isInDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isInDialog) {
    dialog.close("backdrop-clicked");
  }
});

// 4. Handle close event and process returnValue
dialog.addEventListener("close", () => {
  console.log(`Dialog closed with status: ${dialog.returnValue}`);
  // Returning focus to the trigger button is handled natively by browsers
});