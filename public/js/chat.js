/* eslint-disable no-undef */
const socket = io();

// Elements
const $messageForm = document.getElementById("message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector(
    "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Get the height of the new message
    const newMsgStyles = getComputedStyle($newMessage);
    const newMsgHeight =
        $newMessage.offsetHeight + parseInt(newMsgStyles.marginBottom);

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const contentHeight = $messages.scrollHeight;

    // how far has the user scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (contentHeight - newMsgHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute("disabled", "disabled");

    const msg = $messageFormInput.value;
    $messageFormInput.value = "";
    $messageFormInput.focus();

    socket.emit("message", msg, (error) => {
        if (error) {
            alert(error);
        } else {
            console.log("[*] Message delivered!");
        }
    });

    $messageFormButton.removeAttribute("disabled");
});

socket.on("message", ({ username, text, createdAt }) => {
    const html = Mustache.render(messageTemplate, {
        username,
        text,
        createdAt: moment(createdAt).format("h:mm a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", ({ username, url, createdAt }) => {
    const html = Mustache.render(locationTemplate, {
        username,
        link: url,
        createdAt: moment(createdAt).format("h:mm a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, { room, users });
    document.getElementById("sidebar").innerHTML = html;
});

$sendLocationButton.addEventListener("click", () => {
    // alert if the browser doesn't support geolocation
    if (!navigator.geolocation) {
        return alert("Your browser doesn't support geolocation!");
    }

    navigator.geolocation.getCurrentPosition((pos) => {
        // Disable the button while the location is fetched
        $sendLocationButton.setAttribute("disabled", "disabled");

        // Send an object with lat and long properties and setup acknowledgement function
        socket.emit(
            "sendLocation",
            {
                lat: pos.coords.latitude,
                long: pos.coords.longitude,
            },
            (ackError) => {
                if (ackError) {
                    console.log(ackError);
                } else {
                    console.log("[*] Location shared!");
                }
            }
        );

        // Re-enable the button after the server reply is received
        $sendLocationButton.removeAttribute("disabled");
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
