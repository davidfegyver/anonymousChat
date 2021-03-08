socket = io.connect();

//pages
const landingPage = document.getElementById("landingPage");
const chatPage = document.getElementById("chatPage");
const searching = document.getElementById("searching");
const waiting = document.getElementById("waitingPage");
//landingPage elements
const startBtn = document.getElementById("startBtn");
const username = document.getElementById("name");

//chatpage elements
const messageInput = document.getElementById("messageText");
const messages = document.getElementById("messages");
const btnSend = document.getElementById("sendBtn");
const nextBtn = document.getElementById("next");
const exitBtn = document.getElementById("exit");

//waitingPage element
// Notification
const toastBody = document.getElementById("toastBody");
const toastName = document.getElementById("toastName");


startBtn.addEventListener("click", () => {
  if (username.value.trim().length) {
    socket.emit("login", username.value);
    chatPage.style.display = "none";
    landingPage.style.display = "none";
    searching.style.display = "block";
  } else username.focus();
});
btnSend.addEventListener("click", sendMessageHander);
messageInput.addEventListener("keyup", sendMessageHander)
nextBtn.addEventListener("click", () => {
  chatPage.style.display = "none";
  landingPage.style.display = "none";
  searching.style.display = "block";
  socket.emit("findAnotherPair");
});
exitBtn.addEventListener("click", () => {
  chatPage.style.display = "none";
  landingPage.style.display = "none";
  searching.style.display = "none"
  waiting.style.display = "block"
  socket.emit("exitChat");
});




function displayNewMsg(msg, direction) {
  msg = xssFilters.inHTMLData(msg)
  if (direction === "left") {
    messages.innerHTML += `<div class="d-flex justify-content-start mb-4"><div class="msg_container">${msg}</div></div></div>`;
  } else {
    messages.innerHTML += `<div class="d-flex justify-content-end mb-4"><div class="msg_container_send">${msg}</div></div></div>`;
  }
}

function sendMessageHander(e) {
  var msg = messageInput.value;
  if (msg.trim().length) {
    if (isNaN(e.keyCode) || e.keyCode === 13) {
      messageInput.value = "";
      socket.emit("postMsg", msg);
      displayNewMsg(msg, "right");
    }
  }
}

function displayNotification(msg, type) {
  toastName.innerText = type;
  toastBody.innerText = msg;
  $('.toast').toast('show');
}

socket.once("connect_error", function () {
  displayNotification("Nincs internetkapcsolat", "WARN");
});
socket.on("connect", () => {
  username.focus();
});
socket.on("disconnect", (reason) => {
  displayNotification("Lecsatlakozva a szerverről!", "WARN");
});
socket.on("reconnect", () => {
  displayNotification("Újracsatlakozva!", "INFO");
});
socket.on("reconnecting", () => {
  displayNotification("Újracsatlakozás...", "INFO");
});
socket.on("gotAPair", (otherUser) => {
  messages.innerHTML = '';
  chatPage.style.display = "block";
  landingPage.style.display = "none";
  searching.style.display = "none"
  document.getElementById("otherUser").textContent = otherUser;
});
socket.on("newMsg", (msg) => {
  displayNewMsg(msg, "left");
});
socket.on("userCount", function (userCount) {
  document.getElementById("onlineCount").textContent = `Online Felhasználók: ${userCount}`;
});
socket.on("notification", (msg, code) => {
  displayNotification(msg, code);
});