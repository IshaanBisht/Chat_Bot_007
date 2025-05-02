const sessionDataTag = document.getElementById('session-data');
const sessionData = JSON.parse(sessionDataTag.textContent);

window.currentUserId = sessionData.currentUserId;
window.chatUserId = sessionData.chatUserId;
window.chatUserName = sessionData.chatUserName;

console.log('Current user ID:', window.currentUserId);
console.log('Chat user ID:', window.chatUserId);
