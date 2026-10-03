/* =========================================================
   AI Interview RAG - Final Report
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

const sessionId = sessionStorage.getItem("chatInterviewSessionId");
const targetRole = sessionStorage.getItem("chatInterviewRole");
const duration = sessionStorage.getItem("chatInterviewDuration");


// =========================================================
// DOM Elements
// =========================================================

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const reportContent = document.getElementById("reportContent");

const errorMessage = document.getElementById("errorMessage");

const retryButton = document.getElementById("retryButton");
const backButton = document.getElementById("backButton");
const homeButton = document.getElementById("homeButton");
const newInterviewButton = document.getElementById("newInterviewButton");

const themeToggle = document.getElementById("themeToggle");


// =========================================================
// Theme
// =========================================================

function applyStoredTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }
}


function toggleTheme() {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
    );
}


themeToggle.addEventListener("click", toggleTheme);

applyStoredTheme();


// =========================================================
// Utility Functions
// =========================================================

function showLoading() {
    loadingState.classList.remove("hidden");
    errorState.classList.add("hidden");
    reportContent.classList.add("hidden");
}


function showError(message) {
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    reportContent.classList.add("hidden");

    errorMessage.textContent = message;
}


function showReport() {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    reportContent.classList.remove("hidden");
}


function formatScore(score) {
    if (typeof score !== "number") {
        return "—";
    }

    return Number.isInteger(score)
        ? score.toString()
        : score.toFixed(1);
}


function setScore(scoreElementId, barElementId, score) {
    const scoreElement = document.getElementById(scoreElementId);
    const barElement = document.getElementById(barElementId);

    if (typeof score !== "number") {
        scoreElement.textContent = "—";
        barElement.style.width = "0%";
        return;
    }

    scoreElement.textContent = `${formatScore(score)} / 10`;

    const percentage = Math.max(
        0,
        Math.min(100, score * 10)
    );

    barElement.style.width = `${percentage}%`;
}


function createListItem(text) {
    const li = document.createElement("li");

    li.textContent = text;

    return li;
}


function renderList(elementId, items, emptyMessage) {
    const container = document.getElementById(elementId);

    container.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
        container.appendChild(
            createListItem(emptyMessage)
        );

        return;
    }

    items.forEach(item => {
        if (typeof item === "string" && item.trim()) {
            container.appendChild(
                createListItem(item.trim())
            );
        }
    });

    if (container.children.length === 0) {
        container.appendChild(
            createListItem(emptyMessage)
        );
    }
}


// =========================================================
// Render Report
// =========================================================

function renderReport(report) {

    // -----------------------------------------
    // Header
    // -----------------------------------------

    const reportTitle = document.getElementById("reportTitle");
    const reportSubtitle = document.getElementById("reportSubtitle");

    reportTitle.textContent =
        targetRole
            ? `${targetRole} Interview`
            : "Technical Interview";

    const durationText =
        duration
            ? `${duration}-minute interview`
            : "Interview";

    reportSubtitle.textContent =
        `Final assessment from your ${durationText} conversation.`;


    // -----------------------------------------
    // Overall Score
    // -----------------------------------------

    document.getElementById("overallScore").textContent =
        formatScore(report.overall_score);


    // -----------------------------------------
    // Performance Scores
    // -----------------------------------------

    setScore(
        "technicalKnowledgeScore",
        "technicalKnowledgeBar",
        report.technical_knowledge_score
    );

    setScore(
        "roleRelevanceScore",
        "roleRelevanceBar",
        report.role_relevance_score
    );

    setScore(
        "problemSolvingScore",
        "problemSolvingBar",
        report.problem_solving_score
    );

    setScore(
        "communicationScore",
        "communicationBar",
        report.communication_score
    );

    setScore(
        "resumeUnderstandingScore",
        "resumeUnderstandingBar",
        report.resume_understanding_score
    );


    // -----------------------------------------
    // Strengths
    // -----------------------------------------

    renderList(
        "strengthsList",
        report.strengths,
        "No specific strengths were recorded."
    );


    // -----------------------------------------
    // Weaknesses
    // -----------------------------------------

    renderList(
        "weaknessesList",
        report.weaknesses,
        "No specific improvement areas were recorded."
    );


    // -----------------------------------------
    // Detailed Assessment
    // -----------------------------------------

    document.getElementById("technicalAssessment").textContent =
        report.technical_assessment ||
        "No technical assessment was provided.";


    document.getElementById("overallFeedback").textContent =
        report.overall_feedback ||
        "No overall feedback was provided.";


    // -----------------------------------------
    // Recommendation
    // -----------------------------------------

    document.getElementById("recommendation").textContent =
        report.recommendation ||
        "No recommendation was provided.";
}


// =========================================================
// Load Report
// =========================================================

async function loadReport() {

    if (!sessionId) {
        showError(
            "No interview session was found. Please complete an interview first."
        );

        return;
    }

    showLoading();

    try {

        const response = await fetchWithAuth(
            `${API_BASE_URL}/interview/chat/${sessionId}/result`
        );

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }


        if (!response.ok) {

            const message =
                data?.detail ||
                "Unable to load the interview report.";

            throw new Error(message);
        }


        renderReport(data);

        // Keep a local copy so the report can be reused
        // during the current browser session.
        sessionStorage.setItem(
            "chatInterviewResult",
            JSON.stringify(data)
        );

        showReport();
        
        saveChatHistory(sessionId, data);

    } catch (error) {

        console.error(
            "Failed to load interview report:",
            error
        );

        showError(
            error.message ||
            "Something went wrong while loading your report."
        );
    }
}


// =========================================================
// Navigation
// =========================================================

backButton.addEventListener("click", () => {
    window.location.href = "chat.html";
});


homeButton.addEventListener("click", () => {
    window.location.href = "../index.html";
});


newInterviewButton.addEventListener("click", () => {

    sessionStorage.removeItem(
        "chatInterviewSessionId"
    );

    sessionStorage.removeItem(
        "chatInterviewResumeId"
    );

    sessionStorage.removeItem(
        "chatInterviewRole"
    );

    sessionStorage.removeItem(
        "chatInterviewDuration"
    );

    sessionStorage.removeItem(
        "chatInterviewOpeningMessage"
    );

    sessionStorage.removeItem(
        "chatInterviewResult"
    );

    window.location.href = "index.html";
});


retryButton.addEventListener("click", loadReport);

async function saveChatHistory(sessionId, evaluation) {
    if (!window.Clerk || !window.Clerk.session) return;
    try {
        // Fetch full chat history
        const sessionRes = await fetchWithAuth(`${API_BASE_URL}/interview/chat/${sessionId}`);
        if (!sessionRes.ok) return;
        const sessionData = await sessionRes.json();
        
        const messages = sessionData.messages.map(message => ({
            role: message.role,
            content: message.content
        }));

        await fetchWithAuth(`${API_BASE_URL}/history/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, evaluation })
        });
    } catch (e) {
        console.error("Failed to save chat history:", e);
    }
}

// =========================================================
// Initial Load
// =========================================================

window.clerkReady
    .then(loadReport)
    .catch(error => {
        console.error(error);
        showError(
            error.message ||
            "Something went wrong while loading your report."
        );
    });