document.getElementById('load-greeting').innerText = randomGreetingMessage()

if (window.self = !window.top) {
  document.getElementById('navbar').style.display = 'none';
}

var currentUser = JSON.parse(localStorage.getItem("currentUser")) || [];
console.log(currentUser['username'])

document.querySelectorAll("textarea").forEach(function(textarea) {
    textarea.style.height = textarea.scrollHeight + "px";
    textarea.style.overflowY = "auto";
  
    textarea.addEventListener("input", function() {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });
  });


    if (localStorage.getItem('messagesList')) {
        var messagesList = JSON.parse(localStorage.getItem("messagesList")) || [];
    }
  
    // A list of contextual responses based on keywords found in the input.
    var responseList = [
      { includes: "help", response: "Calculating..." },
      { includes: "hello", response: "Hi there! How can I assist you today?" },
      { includes: "hi", response: "Hello! What can I do for you?" },
      { includes: "how are you", response: "I'm doing great, thanks for asking!" },
      { includes: "create a frame", response: "Creating an iframe as requested." },
      { includes: "open url", response: "Your webpage has been opened." },
      { includes: "create a button", response: "Here's your button!" },
      { includes: "create a link", response: "The link has been created." },
      { includes: "create a div", response: "Your div is now ready." },
      { includes: "generate qr code", response: "Generating your QR code." },
      { includes: "set background", response: "Background changed." },
      { includes: "set text color", response: "Text color changed." },
      { includes: "set font size", response: "Font size updated." },
      { includes: "clear chat", response: "Chat cleared. Now, whats on your mind." },
      { includes: "show time", response: "Displaying current time." },
      { includes: "calculate", response: "Calculating..." },
      { includes: "login user", response: "Need help login in? Visit the 'Account Login' page." },
      { includes: "", response: "Sorry, I don't understand this. Try putting it in a different way." } // default response
    ];
  
    // --- Cached DOM Elements ---
    var messagesDiv = document.getElementById("messages");
    var inputField = document.getElementById("message-input");
    var sendButton = document.getElementById("send");
  
    // --- Helper Functions ---
  
    // Validate a URL.
    function isValidUrl(str) {
      try {
        new URL(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  
    // Save messages to localStorage.
    function saveMessages() {
      localStorage.setItem("messagesList", JSON.stringify(messagesList));
    }
  
    // Render the messagesList in the messages container.
    function renderMessages() {
      messagesDiv.innerHTML = "";
      document.getElementById('explore').style.transform = 'translate(-50%, 50%)'
      document.getElementById('chat-btn').style.display = 'none';
      document.getElementById('home-btn').style.display = 'block';
      messagesList.forEach(function (msg, index) {

      var fullButton = document.createElement('button');
      fullButton.classList.add('full-screen-element');
        fullButton.setAttribute('connected', 'element' + index)
        fullButton.innerHTML = `<i class="fa-solid fa-expand"></i>`;
        
        fullButton.addEventListener('click', function() {
            expandElement(index)
        });
        var el = document.createElement("div");
        el.setAttribute('message', index)
        el.classList.add("message");
  
        // Add source-based classes.
        if (msg.source === "human") el.classList.add("human-message");
        else if (msg.source === "ai") el.classList.add("ai-message");

        // Render element according to type.
        switch (msg.type) {
          case "text":
            var content = String(msg.content)
            el.textContent = msg.content;
            el.innerHTML = el.innerHTML + `<br></button><button onclick="deleteMessage(this, ${index})"><i class="fa-solid fa-trash"></i></button>`
            break;
  
          case "image":
            var img = document.createElement("img");
            img.src = msg.content;
            img.alt = "Human image message";
            el.appendChild(img);
            el.classList.add("human-image");
            break;
  
          case "iframe":
            var ifrm = document.createElement("iframe");
            ifrm.src = msg.content; // Set iframe source
            ifrm.classList.add('fullscreen-able');
            ifrm.id = 'element' + index; // Assign unique ID
            ifrm.width = "100%";
            ifrm.height = "300px";
            ifrm.style.border = "1px solid #ccc";         

            el.appendChild(ifrm);
            el.innerHTML = el.innerHTML + `<br><button onclick="deleteMessage(this, ${index})"><i class="fa-solid fa-trash"></i></button>`
            el.appendChild(fullButton);

            ifrm.onload = function() {
              if (!ifrm.contentDocument || !ifrm.contentWindow) {
                  console.log("Iframe content is not accessible or failed to load.");
                  deleteMessageInstant(index)
              } else {
                  console.log("Iframe loaded successfully!");
              }
          }; 

            break;
  
          case "button":
            var btn = document.createElement("button");
            btn.textContent = msg.content;
            btn.onclick = function () {
              notification("Button clicked: " + msg.content);
            };
            el.appendChild(btn);
            el.innerHTML = el.innerHTML + `<br><button onclick="deleteMessage(this, ${index})"><i class="fa-solid fa-trash"></i></button>`
            break;
  
          case "link":
            var a = document.createElement("a");
            a.href = msg.url;
            a.textContent = msg.text;
            a.target = "_blank";
            el.appendChild(a);
            el.innerHTML = el.innerHTML + `<br><button onclick="deleteMessage(this, ${index})"><i class="fa-solid fa-trash"></i></button>`
            break;
  
          case "div":
            var d = document.createElement("div");
            d.textContent = msg.content;
            d.style.border = "1px solid #ccc";
            d.style.padding = "5px";
            el.appendChild(d);
            el.innerHTML = el.innerHTML + `<br><button onclick="deleteMessage(this, ${index})"><i class="fa-solid fa-trash"></i></button>`
            break;
  
          case "qr":
            var imgqr = document.createElement("img");
            imgqr.id = 'element' + index;
            imgqr.classList.add('fullscreen-able')
            imgqr.src =
              "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" +
              encodeURIComponent(msg.content);
            el.appendChild(imgqr);
            el.innerHTML = el.innerHTML + `<br><button onclick="deleteMessage(this, ${index})"><i class="fa-solid fa-trash"></i></button>`
            el.appendChild(fullButton);
            break;

  
          default:
            el.textContent = msg.content;
            el.innerHTML = el.innerHTML + `<br><button onclick="deleteMessage(this, ${index})"><i class="fa-solid fa-trash"></i></button>`

        }
        var container = document.createElement('div');
        container.classList.add('message-container');
        messagesDiv.append(container)
        container.appendChild(el);
        if (el.querySelector('iframe')) {
          el.classList.add('has-iframe');
          container.classList.add('has-iframe');          
        }
      });
      window.scrollTo({
      top: messagesDiv.scrollHeight,
      left: 0,
      behavior: 'smooth'
  });
    }

    function getMessage(index) {
      var item =  messagesList[index]
      autoFillInput(item.content)

    }

    function deleteMessage(button, index) {
      button.innerHTML = `<i class="fa-solid fa-delete-left"></i> Click Again to Delete`;
      button.addEventListener('click', function() {
        messagesList.splice(index, 1);
        saveMessages();
        renderMessages();
      })
    }

    function deleteMessageInstant(index) {
        messagesList.splice(index, 1);
        saveMessages();
        renderMessages();
    }
  
    function processCommand(txt) {
      var lower = txt.toLowerCase();
      if (lower.startsWith("create a frame")) {
        // Example: "create a frame https://example.com"
        var url = txt.slice("create a frame".length).trim();
        if (isValidUrl(url))
          return [{ type: "iframe", content: url, source: "ai" }];
        else {
          notification("Invalid URL for iframe.", 'orange');
          return null;
        }
      } else if (lower.startsWith("create a button")) {
        // Example: "create a button Click Me"
        var btnText = txt.slice("create a button".length).trim();
        if (!btnText) {
          notification("Please provide text for the button.", 'orange');
          return null;
        }
        return [{ type: "button", content: btnText, source: "ai" }];
      } else if (lower.startsWith("create a link")) {
        var parts = txt.slice("create a link".length).trim().split("|");
        if (parts.length < 2) {
          notification("Please provide URL and link text separated by '|'.", 'tomato');
          return null;
        }
        var url = parts[0].trim(),
          linkText = parts[1].trim();
        if (!isValidUrl(url)) {
          notification("Invalid URL for link.", 'orange');
          return null;
        }
        return [{ type: "link", url: url, text: linkText, source: "ai" }];
      } else if (lower.startsWith("create a div")) {
        // Example: "create a div This is a custom div"
        var content = txt.slice("create a div".length).trim();
        if (!content) {
          notification("Please provide content for the div.", 'orange');
          return null;
        }
        return [{ type: "div", content: content, source: "ai" }];
      } else if (lower.startsWith("generate qr code")) {
        // Example: "generate a qr https://example.com" or any text to encode.
        var qrData = txt.slice("generate qr code".length).trim();
        if (!qrData) {
          notification("Please provide data for the QR code.", 'orange');
          return null;
        }
        return [{ type: "qr", content: qrData, source: "ai" }];
      }
      // Extra personal commands:
      else if (lower.startsWith("set background")) {
        var bgColor = txt.slice("set background".length).trim();
        if (!bgColor) {
          notification("Please provide a color.", 'orange');
          return null;
        }
        document.body.style.backgroundColor = bgColor;
        return [{ type: "text", content: "Background set to " + bgColor, source: "ai" }];
      } else if (lower.startsWith("set text color")) {
        var txtColor = txt.slice("set text color".length).trim();
        if (!txtColor) {
          notification("Please provide a text color.", 'orange');
          return null;
        }
        document.body.style.color = txtColor;
        return [{ type: "text", content: "Text color set to " + txtColor, source: "ai" }];
      } else if (lower.startsWith("set font size")) {
        var fontSize = txt.slice("set font size".length).trim();
        if (!fontSize) {
          notification("Please provide a font size (e.g., '16px').", 'orange');
          return null;
        }
        document.body.style.fontSize = fontSize;
        return [{ type: "text", content: "Font size set to " + fontSize, source: "ai" }];
      } else if (lower === "clear chat") {
        messagesList = [];
        saveMessages();
        renderMessages();
        return [];
      } else if (lower.startsWith("show time")) {
        var currentTime = new Date().toLocaleTimeString();
        return [{ type: "text", content: "Current time: " + currentTime, source: "ai" }];
      } else if (lower.startsWith("open url")) {
        var webpage = txt.slice("open url".length).trim();
        try {
          open(webpage, '_blank')
          return [{ type: "text", content: "Opened " + webpage, source: "ai" }]
        } catch (e) {
          return [{ type: "text", content: "Sorry, there was an error with message: " + e, source: "ai" }]
        }
      } else if (lower.startsWith("search youtube")) {
        var search = txt.slice("search youtube".length).trim();
        open(`https://youtube.com/search?q=${search}`, '_blank')
      } else if (lower.startsWith("search tiktok")) {
        var search = txt.slice("search tiktok".length).trim();
        open(`https://tiktok.com/search?q=${search}`, '_blank')
      } else if (lower.startsWith("search google")) {
        var search = txt.slice("search google".length).trim();
        open(`https://google.com/search?q=${search}`, '_blank')
      } else if (lower.startsWith('clear message')) {
        var index = txt.slice('clear message'.length).trim();
        deleteMessageInstant(index)
      }
      else if (lower.startsWith("search")) {
        var parts = txt.slice("create a link".length).trim().split("|");
        if (parts.length < 2) {
          notification("Please provide URL and link text separated by '|'.", 'orange', 'white');
          return null;
        }
        var url = parts[0].trim(),
          linkText = parts[1].trim();
        if (!isValidUrl(url)) {
          notification("Invalid URL for link.", 'orange', 'white');
          return null;
        }
        return [{ type: "link", url: url, text: linkText, source: "ai" }];
      } else if (lower.startsWith('login user')) {
        var parts = txt.slice('login user'.length).trim().split('with password');
        if (parts.length < 2) {
          notification('Please Enter username with password, like this: login user [user] with password [password]', 'orange', 'white')
          return null
        }
        var username = parts[0].trim();
        var password = parts[1].trim();
        return [{type: "text", content: loginUser(username, password), source: "ai"}];
      }
    }
  
    // Get a textual AI response based on the input using responseList.
    function getResponse(txt) {
      var lower = txt.toLowerCase();
      for (var i = 0; i < responseList.length; i++) {
        if (lower.includes(responseList[i].includes) && responseList[i].includes !== "")
          return responseList[i].response;
      }
      return responseList.find(function (e) {
        return e.includes === "";
      }).response;
    }
  
    // --- Send Message ---
  
    function sendMessage() {
        inputField.placeholder = 'Type to BlueAI'
        var txt = inputField.value.trim();
        inputField.value = '';
        console.log("User Input:", txt); // Debug input
        if (!txt) {
          notification("Please enter a message.", 'orange', 'white');
          return;
        }
      
        // Ensure messagesList is an array
        if (!Array.isArray(messagesList)) {
          console.error("messagesList is not an array. Resetting to an empty array.");
          messagesList = [];
        }
      
        if (txt.toLowerCase().startsWith("calculate")) {
            console.log("Processing math operation:", txt);
            const result = processMath(txt);
            messagesList.push({ source: "human", type: "text", content: txt });
            messagesList.push({ source: "ai", type: "text", content: result });
            saveMessages();
            renderMessages()
            return; // Exit after handling the math command
          }
          
      
        // Process general commands
        if (document.getElementById('select-mode').value == 'commands') {
          var commandOutput = processCommand(txt);
        }
        messagesList.push({ source: "human", type: "text", content: txt });
        setTimeout(function() {
        if (commandOutput) {
          if (Array.isArray(commandOutput)) {
            commandOutput.forEach(function (item) {
              messagesList.push(item);
            });
          } else {
            console.error("processCommand did not return an array:", commandOutput);
          }
      
          const aiResp = getResponse(txt);
          if (aiResp) {
            messagesList.push({ source: "ai", type: "text", content: aiResp });
          }
        } else {
          const aiResponse = getResponse(txt);
          messagesList.push({ source: "ai", type: "text", content: aiResponse });
        }
      
        // Save to localStorage and re-render
        saveMessages();
        renderMessages();
        inputField.value = ""; // Clear the input field
        inputField.focus(); // Keep focus on the input field
      }, 500)
    }      

      function processMath(command) {
        try {
            const expression = command.slice("calculate".length).trim();
            inputField.innerText = ''
            if (!expression) throw new Error("No expression provided.");
    
            // Safely evaluate mathematical expressions
            const result = new Function(`return (${expression})`)();
            return `The result of ${expression} is ${result}.`;
        } catch (err) {
            return "Invalid math expression. Try something like 'calculate 5 + 3'.";
        }
    }
    
  
    // --- Event Listeners ---
  
    // Send message if Enter is pressed (preventing newline) or if the send button is clicked.
    inputField.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
    sendButton.addEventListener("click", sendMessage);
  
    if (messagesList) {
        console.log(messagesList);
    }    

  let lastScrollY = window.scrollY;
  const container = document.getElementById('chatContainer');
  const showContainer = document.getElementById('showChatInput');
  let isHovering = false;

  // Detect hover
  container.addEventListener('mouseenter', () => {
      isHovering = true;
  });

  container.addEventListener('mouseleave', () => {
      isHovering = false;
  });
  
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY)  {
        container.style.transform = 'translate(-50%, 100%)';
        showContainer.style.transform = 'translate(-50%, 0%)';
    } else {
        container.style.transform = 'translate(-50%, 0%)';
        showContainer.style.transform = 'translate(-50%, 100%)';
    }
    

    // Update the last scroll position
    lastScrollY = currentScrollY - 5;
});


function chat(show) {
  if (show) {
    container.style.transform = 'translate(-50%, 100%)';
    showContainer.style.transform = 'translate(-50%, 0%)';
  } else {
    container.style.transform = 'translate(-50%, 0%)';
    showContainer.style.transform = 'translate(-50%, 100%)';
  }
}

function showStartPage() {
  document.getElementById('home-btn').style.display = 'none';
  document.getElementById('chat-btn').style.display = 'unset';
  document.getElementById('explore').style.transform = 'translate(-50%, -50%)'
}

function randomGreetingMessage() {
  const messages = [
    "Hello",
    "Hi! I am your personal ai assistant, BlueAI",
    "Greetings, from BlueAI.",
    "What's up!",
    "What's on your mind, today?"
  ]
  var index = Math.floor(Math.random() * 5)

  return messages[index]
}

function autoFillInput(message, send = false) {
  document.getElementById('message-input').value = message;
  if (send) {
    setTimeout(sendMessage, 400)
  }
}

function togglePopup(element, forceClose) {
  document.querySelectorAll('.popup').forEach(popup => {
      popup.classList.remove('open');
  })
  var Element = document.getElementById(element);
  if (Element.classList.contains('open')) {
      Element.classList.remove('open');
  } else {
      Element.classList.add('open');
  }
  if (forceClose) {
      document.querySelectorAll('.popup').forEach(popup => {
          popup.classList.remove('open');
      });
  }
}

function expandElement(index) {
          const iframeElement = document.getElementById('element' + index);
            iframeElement.classList.add('expand');
            window.scrollTo({
              top: 0.45,
              left: 0,
              behavior: 'smooth'
            });
            document.getElementById('compress-btn').style.display = 'block';
}

function compressAll() {
  document.querySelectorAll('.fullscreen-able').forEach(element => {
    element.classList.remove('expand');
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      left: 0,
      behavior: 'smooth'
  });
  });
  document.getElementById('compress-btn').style.display = 'none';
}

function loginUser(username, password) {
  const usersJSON = localStorage.getItem('users');
  let users = [];
  if (usersJSON) {
      try {
          users = JSON.parse(usersJSON);
      } catch (error) {
          console.error('Error parsing users JSON:', error);
      }
  }

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      notification('Login successful!');
      // Redirect to the dashboard
      setTimeout(function() {
          return `${username} is logged in. Make sure to keep the messages safe as they contain your password. You can also delete them.`
      }, 2000);
  } else {
    return "Check your username and password. Something didn't match. To register a user, visit the 'Account Register' page "
  }
}

function notification(message, bgColor = 'white', txtColor = 'black', timeout = 4500) {
  var notification = document.getElementById('notification');

  notification.style.width = 'fit-content';
  notification.style.padding = '15px';
  notification.innerHTML = `${message}`;
  notification.style.backgroundColor = bgColor;
  notification.style.color = txtColor;

  setTimeout(function() {
    notification.style.width = '0';
    notification.style.padding = '0';
  }, timeout)

}

function copyText(text) {
  navigator.clipboard.writeText(text);
  notification('Text Copied', 'cyan')
  
}

document.addEventListener('contextmenu', function(event) {
  event.stopPropagation();
  event.preventDefault();
  event.stopImmediatePropagation();

  const menu = document.getElementById('context-menu');
  const textToCopy = event.target.innerText;
  const messageNum = event.target.getAttribute('message');

  menu.innerHTML = '';

  if (window.getSelection().toString()) {
    const copyBtnSelected = document.createElement('button');
    copyBtnSelected.innerHTML = 'Copy';
    copyBtnSelected.addEventListener('click', function() {
      copyText(window.getSelection().toString());
    });
    menu.appendChild(copyBtnSelected);
  } else {
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = 'Copy';
    copyBtn.addEventListener('click', function() {
      copyText(textToCopy.toString());
    });

    if (event.target.classList.contains('message')) {
      menu.appendChild(copyBtn);

      const copyChatBtn = document.createElement('button');
      copyChatBtn.innerHTML = 'Copy into Chatbox';
      copyChatBtn.addEventListener('click', function() {
        getMessage(messageNum);
      });
      menu.appendChild(copyChatBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = 'Delete Message';
      deleteBtn.addEventListener('click', function() {
        deleteMessageInstant(messageNum);
      });
      menu.appendChild(deleteBtn);
    }
    const expandBtn = document.createElement('button');
    expandBtn.innerHTML = 'Expand Frame';
    expandBtn.addEventListener('click', function() {
      expandElement(messageNum);
    });
    if (event.target.querySelector('iframe')) {
      menu.appendChild(expandBtn);
    }
    if (event.target.querySelector('img')) {
      expandBtn.innerHTML = 'Expand Image';
      menu.append(expandBtn);
    }
    if (menu.innerHTML == '') {
      menu.innerHTML = `
      <button onclick="showStartPage()">Home Page</button>
      <button onclick="autoFillInput('clear chat')">Delete Chat</button>`
    }
  }

  menu.style.display = 'block';
  menu.style.left = `${event.pageX}px`;
  menu.style.top = `${event.pageY}px`;
});



document.addEventListener('click', function() {
  document.getElementById('context-menu').style.display = 'none';
})