// Toggle password visibility
let closedlock = document.getElementById("closedlock");
let password = document.getElementById("password");

if (closedlock && password) {
  closedlock.onclick = function () {
    if (password.type == "password") {
      password.type = "text";
      closedlock.src = "image/bxs-lock-open.svg";
    } else {
      password.type = "password";
      closedlock.src = "image/bxs-lock.svg";
    }
  };
}

// Chat functionality
const socket = io();
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const chatBox = document.getElementById("chat-box");

// Connection logging
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);
});

// Message submission
form.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const message = input.value.trim();
  if (message === "") return;

  // Add temporary message to UI immediately
  const tempDiv = document.createElement("div");
  tempDiv.classList.add("msg", "you");
  tempDiv.innerHTML = `<strong>You:</strong> ${message}`;
  chatBox.appendChild(tempDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Emit message to server
  socket.emit("send_message", {
    sender: window.currentUserId,
    receiver: window.chatUserId,
    content: message,
  });

  input.value = ""; // Clear input
});

// Handle incoming messages
socket.on("receive_message", (message) => {
  console.log("Received message:", message);
  
  const isYou = message.sender === window.currentUserId;
  
  if (isYou) {
    // Find the temporary message and update it if needed
    const messages = chatBox.querySelectorAll('.msg.you');
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.dataset.persisted) {
      lastMessage.dataset.persisted = true;
      return;
    }
  }
  
  // Show message from other user
  const div = document.createElement("div");
  div.classList.add("msg", isYou ? "you" : "them");
  div.innerHTML = `<strong>${isYou ? "You" : window.chatUserName}:</strong> ${message.content}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Add this to script.js after the existing code

// Handle user status changes
socket.on('user-status-changed', ({ userId, online }) => {
  console.log(`User ${userId} is now ${online ? 'online' : 'offline'}`);
  
  // Update status in user list if on that page
  const userElement = document.querySelector(`[data-user-id="${userId}"]`);
  if (userElement) {
    const statusElement = userElement.querySelector('.user-status');
    if (statusElement) {
      statusElement.textContent = online ? 'Online' : 'Offline';
      statusElement.className = `user-status ${online ? 'online' : 'offline'}`;
      
      // Update last seen if going offline
      if (!online) {
        const lastSeenElement = userElement.querySelector('.last-seen');
        if (lastSeenElement) {
          lastSeenElement.textContent = `Last seen: Just now`;
        }
      } else {
        // Remove last seen if going online
        const lastSeenElement = userElement.querySelector('.last-seen');
        if (lastSeenElement) {
          lastSeenElement.remove();
        }
      }
    }
  }
  
  // Update status in chat if chatting with this user
  if (window.chatUserId === userId) {
    const chatStatusElement = document.getElementById('chat-status');
    if (chatStatusElement) {
      chatStatusElement.textContent = online ? 'Online' : 'Offline';
      chatStatusElement.className = `chat-status ${online ? 'online' : 'offline'}`;
    }
  }
});


function scrollchat(){
      $('#chat-container').animate({
        scrollTop:$('#chat-container').offset().top+ $('#chat-container')[0].scrollHeight
      },0);
}