const user_socket = window.user_socket;

let currentChatId = -1;
let chats = {};
let chatID2userInfo = {}


function showSnackbar(msg) {
    var x = document.getElementById("snackbar");
    x.innerHTML = msg;
    x.className = "show";

    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
}

function createNewChat(userName, chatName, chatID) {
    var socket = io('https://web-chat-hqk4.onrender.com');
    socket.emit('chat-created', userName, chatName, chatID);

    socket.on('receive', (msg_tmp, chatID_tmp, userName_tmp, sender_tmp) => {

        if (sender_tmp != 'middle') {
            msg_tmp = userName_tmp + ': ' + msg_tmp;
        }

        if (chatID_tmp == currentChatId) {
            appendToChatBox(msg_tmp, sender_tmp)
        }

        chats[chatID_tmp].push({ message: msg_tmp, sender: sender_tmp });
    })

    currentChatId = chatID;
    chats[currentChatId] = [];
    chatID2userInfo[chatID] = {socket: socket, userName: userName};

    var historyList = document.getElementById('historyList');
    var newHistoryItem = document.createElement('li');
    newHistoryItem.dataset.chatId = currentChatId;

    // Create span for chat name
    var chatNameSpan = document.createElement('span');
    chatNameSpan.classList.add('history-name');
    chatNameSpan.textContent = chatName;
    newHistoryItem.appendChild(chatNameSpan);

    var deleteIcon = document.createElement('span');
    deleteIcon.classList.add('delete-icon');
    deleteIcon.onclick = function (event) {
        event.stopPropagation();
        deleteChat(newHistoryItem.dataset.chatId, socket);
    };
    newHistoryItem.appendChild(deleteIcon);

    newHistoryItem.onclick = function () {
        switchChat(newHistoryItem.dataset.chatId);
    };

    historyList.appendChild(newHistoryItem);

    switchChat(currentChatId);
    appendToChatBox(userName + '(you) created the chat', 'middle')
    appendToChatBox('Chat Link: ' + chatID, 'middle')

    chats[currentChatId].push({ message: userName + '(you) created the chat', sender: 'middle' });
    chats[currentChatId].push({ message: 'Chat Link: ' + chatID, sender: 'middle' });
}

function confirmNewChat() {
    var userName = document.getElementById('yourNameInput1').value.trim();
    var chatName = document.getElementById('newChatNameInput').value.trim();

    if (chatName && userName) {
        var chatID = document.getElementById("linkToCopy").innerHTML.trim();
        createNewChat(userName, chatName, chatID);

        document.getElementById('newchat-popup').style.display = 'none';
        document.getElementById('newChatNameInput').value = '';
        document.getElementById('yourNameInput1').value = '';
    }
}

user_socket.on('query-response', (output, userName, chatName, chatID) => {
    if (output === 'true') {

        var socket = io('https://web-chat-hqk4.onrender.com');
        socket.emit('chat-joined', userName, chatID);

        socket.on('receive', (msg_tmp, chatID_tmp, userName_tmp, sender_tmp) => {

            if (sender_tmp != 'middle') {
                msg_tmp = userName_tmp + ': ' + msg_tmp;
            }
    
            if (chatID_tmp == currentChatId) {
                appendToChatBox(msg_tmp, sender_tmp)
            }
    
            chats[chatID_tmp].push({ message: msg_tmp, sender: sender_tmp });
        })

        currentChatId = chatID;
        chats[currentChatId] = [];
        chatID2userInfo[chatID] = {socket: socket, userName: userName};

        var historyList = document.getElementById('historyList');
        var newHistoryItem = document.createElement('li');
        newHistoryItem.dataset.chatId = currentChatId;

        // Create span for chat name
        var chatNameSpan = document.createElement('span');
        chatNameSpan.classList.add('history-name');
        chatNameSpan.textContent = chatName;
        newHistoryItem.appendChild(chatNameSpan);

        var deleteIcon = document.createElement('span');
        deleteIcon.classList.add('delete-icon');
        deleteIcon.onclick = function (event) {
            event.stopPropagation();
            deleteChat(newHistoryItem.dataset.chatId, socket);
        };
        newHistoryItem.appendChild(deleteIcon);

        newHistoryItem.onclick = function () {
            switchChat(newHistoryItem.dataset.chatId);
        };

        historyList.appendChild(newHistoryItem);

        switchChat(currentChatId);

        document.getElementById('joinchat-popup').style.display = 'none';
        document.getElementById('joinChatNameInput').value = '';
        document.getElementById('yourNameInput2').value = '';
    }
    else {
        showSnackbar('Incorrect chat link');
    }
});

function joinChat(userName, chatID) {
    if (chats.hasOwnProperty(chatID)) {
        showSnackbar('Already joined');

        document.getElementById('joinchat-popup').style.display = 'none';
        document.getElementById('joinChatNameInput').value = '';
        document.getElementById('yourNameInput2').value = '';
        return;
    }

    user_socket.emit('query-chatID', userName, chatID);
}

function confirmJoinChat() {
    var userName = document.getElementById('yourNameInput2').value.trim();
    var chatID = document.getElementById('joinChatNameInput').value.trim();

    if (userName && chatID) {
        joinChat(userName, chatID);
    }
}

document.getElementById("yourNameInput1").addEventListener("keydown", function (event) {
    if (event.key === 'Enter' & !event.shiftKey) {
        document.getElementById("newChatNameInput").focus();
        event.preventDefault();
    }
});

document.getElementById("yourNameInput2").addEventListener("keydown", function (event) {
    if (event.key === 'Enter' & !event.shiftKey) {
        document.getElementById("joinChatNameInput").focus();
        event.preventDefault();
    }
});

document.getElementById("newChatNameInput").addEventListener("keydown", function (event) {
    if (event.key === 'Enter' & !event.shiftKey) {
        confirmNewChat();
        event.preventDefault();
    }
});

document.getElementById("joinChatNameInput").addEventListener("keydown", function (event) {
    if (event.key === 'Enter' & !event.shiftKey) {
        confirmJoinChat();
        event.preventDefault();
    }
});

document.getElementById("userInput").addEventListener("keydown", function (event) {
    if (event.key === 'Enter' & !event.shiftKey) {
        sendMessage();
        event.preventDefault();
    }
});






function switchChat(chatId) {
    document.querySelectorAll('#historyList li').forEach(function (item) {
        item.classList.remove('active');
    });

    document.querySelector(`li[data-chat-id="${chatId}"]`).classList.add('active');

    var chatBox = document.getElementById('chatBox');
    var chatMessages = chatBox.getElementsByClassName('chat-message');
    while (chatMessages.length > 0) {
        chatMessages[0].parentNode.removeChild(chatMessages[0]);
    }


    hideEmptyChatMessage();
    chats[chatId].forEach(function (messageData) {
        appendToChatBox(messageData.message, messageData.sender);
    });
    currentChatId = chatId;

    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
    var input = document.getElementById('userInput');
    var message = input.value.trim();
    if (message) {
        if (currentChatId == -1) {
            return;
        }

        appendToChatBox(message, 'you');
        chats[currentChatId].push({ message: message, sender: 'you' });

        input.value = '';

        chatID2userInfo[currentChatId].socket.emit('send', message, currentChatId, chatID2userInfo[currentChatId].userName);

        var chatBox = document.getElementById('chatBox');
        chatBox.scrollTop = chatBox.scrollHeight;

    }
}

function appendToChatBox(content, sender) {
    var chatBox = document.getElementById('chatBox');
    var newMessage = document.createElement('div');
    newMessage.textContent = content;
    newMessage.classList.add(sender, 'chat-message');
    chatBox.appendChild(newMessage);
}

function deleteChat(chatId, socket) {
    socket.emit('chat-leaved', chatId, chatID2userInfo[chatId].userName);
    delete chats[chatId];
    delete chatID2userInfo[chatId];

    var chatItem = document.querySelector('li[data-chat-id="' + chatId + '"]');
    if (chatItem) {
        chatItem.remove();
    }
    if (currentChatId === chatId) {
        currentChatId = -1;

        showEmptyChatMessage();
    }

    if (Object.keys(chats).length === 0) {
        clearHistory();
    }
}

function hideEmptyChatMessage() {
    document.getElementById('empty-chat').style.display = 'none';

    document.getElementById('inputArea').style.display = 'flex';
}

function showEmptyChatMessage() {
    document.getElementById('inputArea').style.display = 'none';

    document.getElementById('empty-chat').style.display = 'flex';
}

function clearHistory() {
    for (let chatId in chatID2userInfo) {
        if (chatID2userInfo.hasOwnProperty(chatId)) {
            let userInfo = chatID2userInfo[chatId];
            userInfo.socket.emit('chat-leaved', chatId, userInfo.userName);
        }
    }
    
    chats = {};
    chatID2userInfo = {};
    currentChatId = -1;

    var historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    var chatBox = document.getElementById('chatBox');
    var chatMessages = chatBox.getElementsByClassName('chat-message');
    while (chatMessages.length > 0) {
        chatMessages[0].parentNode.removeChild(chatMessages[0]);
    }

    showEmptyChatMessage();
}


clearHistory()
