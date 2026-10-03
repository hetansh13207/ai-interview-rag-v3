// =====================================================
// API
// =====================================================

const API_BASE_URL =
    "http://127.0.0.1:8000";


// =====================================================
// DOM
// =====================================================

const chatMessages =
    document.getElementById(
        "chatMessages"
    );

const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendButton =
    document.getElementById(
        "sendButton"
    );

const thinkingIndicator =
    document.getElementById(
        "thinkingIndicator"
    );

const timerElement =
    document.getElementById(
        "timer"
    );

const roleLabel =
    document.getElementById(
        "roleLabel"
    );

const interviewStatus =
    document.getElementById(
        "interviewStatus"
    );

const composerArea =
    document.getElementById(
        "composerArea"
    );

const completionPanel =
    document.getElementById(
        "completionPanel"
    );

const viewResultButton =
    document.getElementById(
        "viewResultButton"
    );

const messageCounter =
    document.getElementById(
        "messageCounter"
    );

const themeToggle =
    document.getElementById(
        "themeToggle"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


// =====================================================
// SESSION
// =====================================================

const sessionId =
    sessionStorage.getItem(
        "chatInterviewSessionId"
    );

const resumeId =
    sessionStorage.getItem(
        "chatInterviewResumeId"
    );

const storedRole =
    sessionStorage.getItem(
        "chatInterviewRole"
    );

const storedDuration =
    Number(
        sessionStorage.getItem(
            "chatInterviewDuration"
        )
    );


// =====================================================
// STATE
// =====================================================

let remainingSeconds =
    storedDuration > 0
        ? storedDuration * 60
        : 0;

let timerInterval =
    null;

let statusInterval =
    null;

let isSending =
    false;

let interviewCompleted =
    false;


// =====================================================
// SESSION VALIDATION
// =====================================================

if (!sessionId) {

    window.location.href =
        "index.html";
}


// =====================================================
// INITIAL SETUP
// =====================================================

if (storedRole) {

    roleLabel.textContent =
        storedRole;
}


applySavedTheme();


// =====================================================
// THEME
// =====================================================

function applySavedTheme() {

    const savedTheme =
        localStorage.getItem(
            "platform-theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-theme"
        );

        themeToggle.textContent =
            "☀";

    } else {

        document.body.classList.remove(
            "dark-theme"
        );

        themeToggle.textContent =
            "🌙";
    }
}


themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-theme"
        );


        const darkMode =
            document.body.classList.contains(
                "dark-theme"
            );


        localStorage.setItem(
            "platform-theme",
            darkMode
                ? "dark"
                : "light"
        );


        themeToggle.textContent =
            darkMode
                ? "☀"
                : "🌙";
    }
);


// =====================================================
// MESSAGE RENDERING
// =====================================================

function addMessage(
    role,
    content
) {

    if (!content) {
        return;
    }


    const row =
        document.createElement(
            "div"
        );

    row.className =
        `message-row ${role}`;


    const group =
        document.createElement(
            "div"
        );

    group.className =
        "message-group";


    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "message-avatar";


    avatar.textContent =
        role === "ai"
            ? "AI"
            : "YOU";


    const contentWrapper =
        document.createElement(
            "div"
        );

    contentWrapper.className =
        "message-content";


    const name =
        document.createElement(
            "span"
        );

    name.className =
        "message-name";


    name.textContent =
        role === "ai"
            ? "AI Interviewer"
            : "You";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    bubble.textContent =
        content;


    contentWrapper.appendChild(
        name
    );

    contentWrapper.appendChild(
        bubble
    );


    group.appendChild(
        avatar
    );

    group.appendChild(
        contentWrapper
    );


    row.appendChild(
        group
    );


    chatMessages.appendChild(
        row
    );


    scrollChatToBottom();
}


// =====================================================
// LOAD EXISTING SESSION
// =====================================================

async function loadInterview() {

    try {

        const response =
            await fetchWithAuth(
                `${API_BASE_URL}/interview/chat/${sessionId}/status`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Could not load interview session."
            );
        }


        remainingSeconds =
            data.remaining_seconds;


        updateTimer();


        if (data.completed) {

            completeInterview();

            return;
        }


        /*
         * The setup page already received the opening
         * AI message. Fetching the session itself is
         * not currently exposed by the backend, so we
         * use the opening message saved by the setup page
         * when available.
         */
        const openingMessage =
            sessionStorage.getItem(
                "chatInterviewOpeningMessage"
            );


        if (openingMessage) {

            addMessage(
                "ai",
                openingMessage
            );
        }


        startTimer();

        startStatusPolling();


        messageInput.focus();

    } catch (error) {

        showInterviewStatus(
            error.message ||
            "Could not load the interview."
        );

        disableComposer();
    }
}


// =====================================================
// TIMER
// =====================================================

function formatTime(
    seconds
) {

    const safeSeconds =
        Math.max(
            0,
            Math.floor(seconds)
        );


    const minutes =
        Math.floor(
            safeSeconds / 60
        );


    const remaining =
        safeSeconds % 60;


    return (
        String(minutes).padStart(
            2,
            "0"
        ) +
        ":" +
        String(remaining).padStart(
            2,
            "0"
        )
    );
}


function updateTimer() {

    timerElement.textContent =
        formatTime(
            remainingSeconds
        );


    timerElement.classList.remove(
        "warning",
        "danger"
    );


    if (
        remainingSeconds <= 30 &&
        remainingSeconds > 10
    ) {

        timerElement.classList.add(
            "warning"
        );
    }


    if (
        remainingSeconds <= 10
    ) {

        timerElement.classList.add(
            "danger"
        );
    }
}


function startTimer() {

    stopTimer();


    timerInterval =
        setInterval(
            () => {

                if (
                    interviewCompleted
                ) {

                    stopTimer();

                    return;
                }


                remainingSeconds =
                    Math.max(
                        0,
                        remainingSeconds - 1
                    );


                updateTimer();


                if (
                    remainingSeconds <= 0
                ) {

                    completeInterview();
                }

            },
            1000
        );
}


function stopTimer() {

    if (
        timerInterval !== null
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }
}


// =====================================================
// BACKEND TIMER SYNC
// =====================================================

function startStatusPolling() {

    stopStatusPolling();


    statusInterval =
        setInterval(
            syncInterviewStatus,
            5000
        );
}


function stopStatusPolling() {

    if (
        statusInterval !== null
    ) {

        clearInterval(
            statusInterval
        );

        statusInterval =
            null;
    }
}


async function syncInterviewStatus() {

    if (
        interviewCompleted
    ) {

        return;
    }


    try {

        const response =
            await fetchWithAuth(
                `${API_BASE_URL}/interview/chat/${sessionId}/status`
            );


        const data =
            await response.json();


        if (!response.ok) {
            return;
        }


        remainingSeconds =
            data.remaining_seconds;


        updateTimer();


        if (data.completed) {

            completeInterview();
        }

    } catch (error) {

        /*
         * A temporary status request failure should not
         * immediately terminate the interview.
         *
         * The backend remains authoritative when the
         * next message is sent.
         */
        console.warn(
            "Interview status sync failed:",
            error
        );
    }
}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    if (
        isSending ||
        interviewCompleted
    ) {

        return;
    }


    const message =
        messageInput.value.trim();


    if (!message) {
        return;
    }


    if (
        remainingSeconds <= 0
    ) {

        completeInterview();

        return;
    }


    isSending =
        true;


    addMessage(
        "candidate",
        message
    );


    messageInput.value =
        "";

    updateCharacterCount();

    autoResizeTextarea();


    setComposerLoading(
        true
    );


    try {

        const response =
            await fetchWithAuth(
                `${API_BASE_URL}/interview/chat/message`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        session_id:
                            sessionId,

                        message:
                            message,
                    }),
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            if (
                response.status === 400 &&
                (
                    data.detail
                        ?.toLowerCase()
                        .includes(
                            "expired"
                        ) ||
                    data.detail
                        ?.toLowerCase()
                        .includes(
                            "completed"
                        )
                )
            ) {

                completeInterview();

                return;
            }


            throw new Error(
                data.detail ||
                "Failed to send your answer."
            );
        }


        /*
         * Always render the latest AI message FIRST.
         *
         * This is important when the candidate answers
         * the closing question. The backend returns:
         *
         *   final AI message
         *   completed = true
         *
         * We must display the final AI message before
         * showing the completed state.
         */
        const messages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];


        const latestAiMessage =
            [...messages]
                .reverse()
                .find(
                    (item) =>
                        item.role ===
                        "ai"
                );


        if (
            latestAiMessage &&
            latestAiMessage.content
        ) {

            addMessage(
                "ai",
                latestAiMessage.content
            );
        }


        /*
         * Only after rendering the final AI message
         * should we complete the interview.
         */
        if (data.completed) {

            completeInterview(
                "The interview is complete. "
                + "Your final report is being prepared."
            );

            return;
        }


        /*
         * Re-sync with the backend after every
         * normal interview response.
         */
        await syncInterviewStatus();

    } catch (error) {

        showInterviewStatus(
            error.message ||
            "Something went wrong while sending your answer."
        );

    } finally {

        isSending =
            false;

        setComposerLoading(
            false
        );


        if (
            !interviewCompleted
        ) {

            messageInput.focus();
        }
    }
}


// =====================================================
// COMPOSER LOADING
// =====================================================

function setComposerLoading(
    loading
) {

    if (loading) {

        sendButton.disabled =
            true;

        messageInput.disabled =
            true;

        thinkingIndicator.classList.remove(
            "hidden"
        );

        scrollChatToBottom();

    } else {

        thinkingIndicator.classList.add(
            "hidden"
        );


        if (
            !interviewCompleted
        ) {

            sendButton.disabled =
                false;

            messageInput.disabled =
                false;
        }
    }
}


// =====================================================
// DISABLE COMPOSER
// =====================================================

function disableComposer() {

    messageInput.disabled =
        true;

    sendButton.disabled =
        true;

    messageInput.placeholder =
        "Interview is no longer active.";
}


// =====================================================
// INTERVIEW COMPLETION
// =====================================================

function completeInterview(
    statusMessage
) {

    if (
        interviewCompleted
    ) {

        return;
    }


    interviewCompleted =
        true;

    document
    .querySelector(".chat-app")
    .classList.add(
        "interview-completed"
    );

    stopTimer();

    stopStatusPolling();

    disableComposer();


    thinkingIndicator.classList.add(
        "hidden"
    );


    showInterviewStatus(
        statusMessage ||
        "The interview time has ended. "
        + "Your final report is being prepared."
    );


    composerArea.classList.add(
        "hidden"
    );


    completionPanel.classList.remove(
        "hidden"
    );
}


// =====================================================
// RESULT BUTTON
// =====================================================

viewResultButton.addEventListener(
    "click",
    async () => {

        if (!sessionId) {
            return;
        }

        viewResultButton.disabled = true;
        viewResultButton.innerHTML = "Preparing Report...";

        try {

            const response = await fetchWithAuth(
                `${API_BASE_URL}/interview/chat/${sessionId}/result`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Could not generate the final report."
                );
            }

            sessionStorage.setItem(
                "chatInterviewResult",
                JSON.stringify(data)
            );

            // Go to the new report page
            window.location.href = "result.html";

        } catch (error) {

            viewResultButton.disabled = false;
            viewResultButton.innerHTML = "View Final Report →";

            showInterviewStatus(
                error.message ||
                "Could not generate the final report."
            );
        }
    }
);


// =====================================================
// TEXTAREA
// =====================================================

function autoResizeTextarea() {

    messageInput.style.height =
        "auto";


    const newHeight =
        Math.min(
            messageInput.scrollHeight,
            160
        );


    messageInput.style.height =
        `${newHeight}px`;
}


function updateCharacterCount() {

    const length =
        messageInput.value.length;


    messageCounter.textContent =
        `${length} / 5000`;
}


messageInput.addEventListener(
    "input",
    () => {

        updateCharacterCount();

        autoResizeTextarea();
    }
);


// =====================================================
// KEYBOARD
// =====================================================

messageInput.addEventListener(
    "keydown",
    (event) => {

        /*
         * Enter sends the message.
         *
         * Shift + Enter creates a new line.
         */
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


// =====================================================
// SEND BUTTON
// =====================================================

sendButton.addEventListener(
    "click",
    sendMessage
);


// =====================================================
// BACK BUTTON
// =====================================================

backButton.addEventListener(
    "click",
    (event) => {

        if (
            !interviewCompleted &&
            chatMessages.children.length > 0
        ) {

            const leave =
                window.confirm(
                    "Leave this interview? Your current session will remain incomplete."
                );


            if (!leave) {

                event.preventDefault();
            }
        }
    }
);


// =====================================================
// STATUS MESSAGE
// =====================================================

function showInterviewStatus(
    message
) {

    interviewStatus.textContent =
        message;

    interviewStatus.classList.remove(
        "hidden"
    );
}


// =====================================================
// CHAT SCROLL
// =====================================================

function scrollChatToBottom() {

    requestAnimationFrame(
        () => {

            chatMessages.scrollTop =
                chatMessages.scrollHeight;
        }
    );
}


// =====================================================
// SAVE OPENING MESSAGE
// =====================================================

/*
 * The setup page receives the opening AI message from
 * /interview/chat/start. Save it before navigating to
 * chat.html.
 *
 * This value is consumed by loadInterview().
 */


// =====================================================
// INITIALIZE
// =====================================================

window.clerkReady.then(loadInterview);