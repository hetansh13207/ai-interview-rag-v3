// =====================================================
// API
// =====================================================

const API_BASE_URL =
    "http://127.0.0.1:8000";


// =====================================================
// DOM
// =====================================================

const statusElement =
    document.getElementById("status");

const themeToggle =
    document.getElementById("themeToggle");

const resumeFile =
    document.getElementById("resumeFile");

const resumeDropzone =
    document.getElementById("resumeDropzone");

const uploadTitle =
    document.getElementById("uploadTitle");

const uploadDescription =
    document.getElementById(
        "uploadDescription"
    );

const uploadButton =
    document.getElementById("uploadButton");

const profileSection =
    document.getElementById(
        "profileSection"
    );

const candidateName =
    document.getElementById(
        "candidateName"
    );

const targetRoles =
    document.getElementById(
        "targetRoles"
    );

const skills =
    document.getElementById(
        "skills"
    );

const experience =
    document.getElementById(
        "experience"
    );

const projects =
    document.getElementById(
        "projects"
    );

const targetRole =
    document.getElementById(
        "targetRole"
    );

const customRole =
    document.getElementById(
        "customRole"
    );

const durationOptions =
    document.querySelectorAll(
        ".duration-option"
    );

const startInterviewButton =
    document.getElementById(
        "startInterviewButton"
    );

const setupSection =
    document.getElementById(
        "setupSection"
    );

const startedSection =
    document.getElementById(
        "startedSection"
    );

const startedRole =
    document.getElementById(
        "startedRole"
    );

const startedDuration =
    document.getElementById(
        "startedDuration"
    );

const openingMessage =
    document.getElementById(
        "openingMessage"
    );

const continueButton =
    document.getElementById(
        "continueButton"
    );


// =====================================================
// STATE
// =====================================================

let currentResumeId =
    null;

let currentProfile =
    null;

let selectedDuration =
    null;

let currentSessionId =
    null;


// =====================================================
// STATUS
// =====================================================

function showStatus(message) {

    statusElement.textContent =
        message;

    statusElement.classList.remove(
        "hidden"
    );
}


function hideStatus() {

    statusElement.classList.add(
        "hidden"
    );
}


// =====================================================
// THEME
// =====================================================

const savedTheme =
    localStorage.getItem(
        "platform-theme"
    );


if (savedTheme === "dark") {

    document.body.classList.add(
        "dark-theme"
    );

    themeToggle.textContent =
        "☀ Light";
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

        if (darkMode) {

            themeToggle.textContent =
                "☀ Light";

            localStorage.setItem(
                "platform-theme",
                "dark"
            );

        } else {

            themeToggle.textContent =
                "🌙 Dark";

            localStorage.setItem(
                "platform-theme",
                "light"
            );
        }
    }
);


// =====================================================
// SAFE TEXT
// =====================================================

function displayValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "Not provided";
    }


    if (Array.isArray(value)) {

        if (!value.length) {
            return "Not provided";
        }


        return value
            .map((item) => {

                if (
                    item !== null &&
                    typeof item === "object"
                ) {

                    return Object.values(item)
                        .filter(Boolean)
                        .join(" — ");
                }


                return String(item);

            })
            .join("\n");
    }


    if (typeof value === "object") {

        return Object.values(value)
            .filter(Boolean)
            .join(" — ");
    }


    return String(value);
}

// =====================================================
// PROFILE
// =====================================================

function formatExperience(experienceList) {

    if (
        !Array.isArray(experienceList) ||
        experienceList.length === 0
    ) {

        return "Not provided";
    }


    return experienceList
        .map((item) => {

            const company =
                item.company || "Unknown company";

            const role =
                item.role || "Unknown role";

            const description =
                item.description ||
                "No description provided.";

            return `${role} at ${company}\n${description}`;

        })
        .join("\n\n");
}


function formatProjects(projectList) {

    if (
        !Array.isArray(projectList) ||
        projectList.length === 0
    ) {

        return "Not provided";
    }


    return projectList
        .map((item) => {

            const name =
                item.name || "Unnamed project";

            const technologies =
                Array.isArray(item.technologies)
                    ? item.technologies.join(", ")
                    : "Technologies not provided";

            const description =
                item.description ||
                "No description provided.";

            return `${name}\nTechnologies: ${technologies}\n${description}`;

        })
        .join("\n\n");
}


function displayProfile(profile) {

    currentProfile =
        profile;

    candidateName.textContent =
        displayValue(
            profile.name
        );

    targetRoles.textContent =
        displayValue(
            profile.target_roles
        );

    skills.textContent =
        displayValue(
            profile.skills
        );

    experience.textContent =
        formatExperience(
            profile.experience
        );

    projects.textContent =
        formatProjects(
            profile.projects
        );

    profileSection.classList.remove(
        "hidden"
    );
}

// =====================================================
// LOCK RESUME
// =====================================================

function lockResumeUpload() {

    resumeFile.disabled =
        true;

    uploadButton.classList.add(
        "disabled"
    );

    resumeDropzone.classList.add(
        "locked"
    );

    uploadTitle.textContent =
        resumeFile.files[0]?.name ||
        "Resume processed successfully";

    uploadDescription.textContent =
        "Your resume has been processed and is locked for this interview.";

    uploadButton.textContent =
        "Uploaded ✓";
}


// =====================================================
// ENABLE SETUP
// =====================================================

function enableInterviewSetup() {

    targetRole.disabled =
        false;

    durationOptions.forEach(
        (option) => {

            option.disabled =
                false;
        }
    );
}


// =====================================================
// RESUME UPLOAD
// =====================================================

resumeFile.addEventListener(
    "change",
    async () => {

        const file =
            resumeFile.files[0];

        if (!file) {
            return;
        }

        hideStatus();

        if (
            file.type !==
            "application/pdf"
        ) {

            resumeFile.value =
                "";

            showStatus(
                "Only PDF files are supported. Please choose a resume PDF."
            );

            return;
        }


        uploadButton.textContent =
            "Processing...";

        uploadButton.style.pointerEvents =
            "none";

        showStatus(
            "Processing your resume. This may take a moment..."
        );


        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        try {

            const response =
                await fetchWithAuth(
                    `${API_BASE_URL}/resume/upload`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Resume processing failed."
                );
            }


            currentResumeId =
                data.resume_id;


            displayProfile(
                data.profile
            );


            lockResumeUpload();

            enableInterviewSetup();

            showStatus(
                "Resume processed successfully. Choose your target role and interview duration."
            );

        } catch (error) {

            resumeFile.value =
                "";

            uploadButton.textContent =
                "Choose PDF";

            uploadButton.style.pointerEvents =
                "";

            showStatus(
                error.message ||
                "Could not process the resume."
            );
        }
    }
);


// =====================================================
// DURATION
// =====================================================

durationOptions.forEach(
    (option) => {

        option.addEventListener(
            "click",
            () => {

                durationOptions.forEach(
                    (item) => {

                        item.classList.remove(
                            "selected"
                        );
                    }
                );


                option.classList.add(
                    "selected"
                );


                selectedDuration =
                    Number(
                        option.dataset.duration
                    );


                updateStartButton();
            }
        );
    }
);


// =====================================================
// ROLE VALUE
// =====================================================

function getSelectedRole() {

    return targetRole.value.trim();
}

// =====================================================
// START BUTTON
// =====================================================

function updateStartButton() {

    const role =
        getSelectedRole();

    startInterviewButton.disabled =
        !currentResumeId ||
        !role ||
        !selectedDuration;
}


targetRole.addEventListener(
    "input",
    updateStartButton
);


// =====================================================
// START INTERVIEW
// =====================================================

startInterviewButton.addEventListener(
    "click",
    async () => {

        const role =
            getSelectedRole();


        if (
            !currentResumeId ||
            !role ||
            !selectedDuration
        ) {

            return;
        }


        startInterviewButton.disabled =
            true;

        startInterviewButton.textContent =
            "Starting...";

        hideStatus();


        try {

            const response =
                await fetchWithAuth(
                    `${API_BASE_URL}/interview/chat/start`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            resume_id:
                                currentResumeId,

                            target_role:
                                role,

                            duration_minutes:
                                selectedDuration,
                        }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Could not start the interview."
                );
            }


            currentSessionId =
                data.session_id;


            const firstAiMessage =
                data.messages?.find(
                    (message) =>
                        message.role ===
                        "ai"
                );
            
            if (firstAiMessage) {

                sessionStorage.setItem(
                    "chatInterviewOpeningMessage",
                    firstAiMessage.content
                );
            }


            startedRole.textContent =
                data.target_role;


            startedDuration.textContent =
                `${data.duration_minutes} minutes`;


            openingMessage.textContent =
                firstAiMessage?.content ||
                "Your interview is ready.";


            setupSection.classList.add(
                "hidden"
            );

            startedSection.classList.remove(
                "hidden"
            );


            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

        } catch (error) {

            startInterviewButton.disabled =
                false;

            startInterviewButton.textContent =
                "Start Interview →";

            showStatus(
                error.message ||
                "Could not start the interview."
            );
        }
    }
);


// =====================================================
// CONTINUE
// =====================================================

continueButton.addEventListener(
    "click",
    () => {

        if (!currentSessionId) {
            return;
        }


        sessionStorage.setItem(
            "chatInterviewSessionId",
            currentSessionId
        );


        sessionStorage.setItem(
            "chatInterviewResumeId",
            currentResumeId
        );


        sessionStorage.setItem(
            "chatInterviewRole",
            getSelectedRole()
        );


        sessionStorage.setItem(
            "chatInterviewDuration",
            String(selectedDuration)
        );


        window.location.href =
            "chat.html";
    }
);