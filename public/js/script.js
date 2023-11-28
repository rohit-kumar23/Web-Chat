window.user_socket = io('https://web-chat-hqk4.onrender.com');

const user_name = 'Rohit';
user_socket.emit('new-user-joined', user_name);

user_socket.on('output-ID', output => {
    document.getElementById("linkToCopy").innerHTML = output;
});

function showNewChatForm() {
    document.getElementById('newchat-popup').style.display = 'block';
    document.getElementById("yourNameInput1").focus();

    user_socket.emit('process-ID');
}

function hideNewChatForm() {
    document.getElementById('newchat-popup').style.display = 'none';
    document.getElementById('yourNameInput1').value = '';
    document.getElementById('newChatNameInput').value = '';
}

function showJoinChatForm() {
    document.getElementById('joinchat-popup').style.display = 'block';
    document.getElementById("yourNameInput2").focus();
}

function hideJoinChatForm() {
    document.getElementById('joinchat-popup').style.display = 'none';
    document.getElementById('yourNameInput2').value = '';
    document.getElementById('joinChatNameInput').value = '';
}

document.addEventListener("DOMContentLoaded", function () {
    const copyButton = document.getElementById("copyButton");
    const linkToCopy = document.getElementById("linkToCopy");

    copyButton.addEventListener("click", function (e) {
        navigator.clipboard.writeText(linkToCopy.innerHTML)
            .then(() => {
                // console.log('Text copied to clipboard');
            })
            .catch(err => {
                // console.error('Failed to copy text: ', err);
            });

        copyButton.classList.add("copy-link-active");
        setTimeout(() => {
            copyButton.classList.remove("copy-link-active");
        }, 150);
    });
});

