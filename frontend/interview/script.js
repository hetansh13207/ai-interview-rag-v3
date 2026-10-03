// =========================================================
// API
// =========================================================

const API_BASE_URL =
    "http://127.0.0.1:8000";


// =========================================================
// DOM ELEMENTS
// =========================================================

// General

const resumeForm =
    document.getElementById("resumeForm");

const resumeFile =
    document.getElementById("resumeFile");

const uploadButton =
    document.getElementById("uploadButton");

const statusElement =
    document.getElementById("status");

const themeToggle =
    document.getElementById("themeToggle");


// Setup

const setupSection =
    document.getElementById("setupSection");

const profileSection =
    document.getElementById("profileSection");

const candidateName =
    document.getElementById("candidateName");

const targetRoles =
    document.getElementById("targetRoles");

const skills =
    document.getElementById("skills");

const experience =
    document.getElementById("experience");

const projects =
    document.getElementById("projects");

const targetRoleInput =
    document.getElementById("targetRole");

const generatePlanButton =
    document.getElementById("generatePlanButton");

const startInterviewButton =
    document.getElementById("startInterviewButton");


// Interview plan

const interviewPlanPreview =
    document.getElementById(
        "interviewPlanPreview"
    );

const questionCountPreview =
    document.getElementById(
        "questionCountPreview"
    );

const topicPreview =
    document.getElementById(
        "topicPreview"
    );


// Interview

const interviewSection =
    document.getElementById(
        "interviewSection"
    );

const questionTopic =
    document.getElementById(
        "questionTopic"
    );

const questionProgress =
    document.getElementById(
        "questionProgress"
    );

const interviewQuestion =
    document.getElementById(
        "interviewQuestion"
    );

const candidateAnswer =
    document.getElementById(
        "candidateAnswer"
    );

const submitAnswerButton =
    document.getElementById(
        "submitAnswerButton"
    );


// Results

const resultsSection =
    document.getElementById(
        "resultsSection"
    );

const reportDate =
    document.getElementById(
        "reportDate"
    );

const reportCandidate =
    document.getElementById(
        "reportCandidate"
    );

const reportRole =
    document.getElementById(
        "reportRole"
    );

const finalScore =
    document.getElementById(
        "finalScore"
    );

const scoreLabel =
    document.getElementById(
        "scoreLabel"
    );

const questionsAnswered =
    document.getElementById(
        "questionsAnswered"
    );

const correctnessReportScore =
    document.getElementById(
        "correctnessReportScore"
    );

const technicalDepthReportScore =
    document.getElementById(
        "technicalDepthReportScore"
    );

const clarityReportScore =
    document.getElementById(
        "clarityReportScore"
    );

const correctnessSummary =
    document.getElementById(
        "correctnessSummary"
    );

const technicalDepthSummary =
    document.getElementById(
        "technicalDepthSummary"
    );

const claritySummary =
    document.getElementById(
        "claritySummary"
    );

const overallAssessment =
    document.getElementById(
        "overallAssessment"
    );

const overallStrengths =
    document.getElementById(
        "overallStrengths"
    );

const overallWeaknesses =
    document.getElementById(
        "overallWeaknesses"
    );


// =========================================================
// APPLICATION STATE
// =========================================================

let currentResumeId =
    null;

let currentProfile =
    null;

let currentInterviewPlan =
    null;

let currentInterviewState =
    null;

let interviewAnalyses = [];


// =========================================================
// STATUS
// =========================================================

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


// =========================================================
// SAFE TEXT
// =========================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =========================================================
// PROFILE DISPLAY
// =========================================================

function displayProfile(profile) {

    currentProfile =
        profile;


    candidateName.textContent =
        profile.name || "-";


    targetRoles.textContent =
        profile.target_roles?.length
            ? profile.target_roles.join(", ")
            : "-";


    skills.textContent =
        profile.skills?.length
            ? profile.skills.join(", ")
            : "-";


    experience.innerHTML =
        "";


    if (
        profile.experience &&
        profile.experience.length
    ) {

        profile.experience.forEach(
            (item) => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "experience-item";


                div.innerHTML = `
                    <strong>
                        ${escapeHtml(
                            item.role ||
                            "Role"
                        )}
                    </strong>

                    ${
                        item.company
                            ? ` — ${escapeHtml(
                                item.company
                            )}`
                            : ""
                    }

                    <br>

                    ${escapeHtml(
                        item.description ||
                        ""
                    )}
                `;


                experience.appendChild(
                    div
                );

            }
        );

    } else {

        experience.textContent =
            "No experience listed.";
    }


    projects.innerHTML =
        "";


    if (
        profile.projects &&
        profile.projects.length
    ) {

        profile.projects.forEach(
            (item) => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "project-item";


                div.innerHTML = `
                    <strong>
                        ${escapeHtml(
                            item.name ||
                            "Project"
                        )}
                    </strong>

                    <br>

                    ${
                        item.technologies?.length
                            ? `Technologies: ${escapeHtml(
                                item.technologies.join(", ")
                            )}<br>`
                            : ""
                    }

                    ${escapeHtml(
                        item.description ||
                        ""
                    )}
                `;


                projects.appendChild(
                    div
                );

            }
        );

    } else {

        projects.textContent =
            "No projects listed.";
    }


    profileSection.classList.remove(
        "hidden"
    );
}


// =========================================================
// CREATE INTERVIEW PLAN
// =========================================================

async function createInterviewPlanPreview() {

    const targetRole =
        targetRoleInput.value.trim();


    if (!targetRole) {

        showStatus(
            "Please enter a target role."
        );

        targetRoleInput.focus();

        return false;
    }


    if (!currentProfile) {

        showStatus(
            "Please upload your resume first."
        );

        return false;
    }


    generatePlanButton.disabled =
        true;


    generatePlanButton.textContent =
        "Generating Plan...";


    interviewPlanPreview.classList.remove(
        "hidden"
    );


    questionCountPreview.textContent =
        "Preparing your personalized interview...";


    topicPreview.innerHTML =
        "";


    try {

        const response =
            await fetchWithAuth(
                `${API_BASE_URL}/interview/plan`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        profile:
                            currentProfile,

                        target_role:
                            targetRole
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to create interview plan."
            );
        }


        currentInterviewPlan =
            data.plan;


        questionCountPreview.textContent =
            `${currentInterviewPlan.total_questions} questions will be asked in this interview.`;


        const topics =
            currentInterviewPlan.topics ||
            [];


        topics.forEach(
            (topic) => {

                const li =
                    document.createElement(
                        "li"
                    );


                li.textContent =
                    topic;


                topicPreview.appendChild(
                    li
                );

            }
        );


        startInterviewButton.classList.remove(
            "hidden"
        );


        generatePlanButton.textContent =
            "Regenerate Interview Plan";


        showStatus(
            "Interview plan created successfully."
        );


        return true;


    } catch (error) {

        currentInterviewPlan =
            null;


        startInterviewButton.classList.add(
            "hidden"
        );


        showStatus(
            `Error: ${error.message}`
        );


        return false;


    } finally {

        generatePlanButton.disabled =
            false;
    }
}


// =========================================================
// RESUME UPLOAD
// =========================================================

resumeForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        hideStatus();


        const file =
            resumeFile.files[0];


        if (!file) {

            showStatus(
                "Please select a resume PDF."
            );

            return;
        }


        if (
            file.type !==
            "application/pdf"
        ) {

            showStatus(
                "Please select a valid PDF file."
            );

            return;
        }


        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        uploadButton.disabled =
            true;


        uploadButton.textContent =
            "Uploading...";


        try {

            const response =
                await fetchWithAuth(
                    `${API_BASE_URL}/resume/upload`,
                    {
                        method: "POST",

                        body: formData
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Resume upload failed."
                );
            }


            currentResumeId =
                data.resume_id;


            displayProfile(
                data.profile
            );


            resumeFile.disabled =
                true;


            uploadButton.disabled =
                true;


            uploadButton.textContent =
                "Resume Uploaded";


            showStatus(
                "Resume uploaded successfully."
            );


        } catch (error) {

            showStatus(
                `Error: ${error.message}`
            );


        } finally {

            if (!currentResumeId) {

                uploadButton.disabled =
                    false;

                uploadButton.textContent =
                    "Upload Resume";
            }
        }
    }
);


// =========================================================
// GENERATE PLAN
// =========================================================

generatePlanButton.addEventListener(
    "click",
    async () => {

        await createInterviewPlanPreview();

    }
);


// =========================================================
// TARGET ROLE CHANGE
// =========================================================

targetRoleInput.addEventListener(
    "input",
    () => {

        currentInterviewPlan =
            null;


        startInterviewButton.classList.add(
            "hidden"
        );


        interviewPlanPreview.classList.add(
            "hidden"
        );

    }
);


// =========================================================
// START INTERVIEW
// =========================================================

startInterviewButton.addEventListener(
    "click",
    async () => {

        if (
            !currentResumeId ||
            !currentProfile
        ) {

            showStatus(
                "Please upload your resume first."
            );

            return;
        }


        if (!currentInterviewPlan) {

            showStatus(
                "Please generate the interview plan first."
            );

            return;
        }


        const targetRole =
            targetRoleInput.value.trim();


        if (!targetRole) {

            showStatus(
                "Please enter a target role."
            );

            return;
        }


        startInterviewButton.disabled =
            true;


        startInterviewButton.textContent =
            "Starting...";


        try {

            const response =
                await fetchWithAuth(
                    `${API_BASE_URL}/interview/start`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            resume_id:
                                currentResumeId,

                            profile:
                                currentProfile,

                            target_role:
                                targetRole
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Failed to start interview."
                );
            }


            currentInterviewState =
                data.state;


            interviewAnalyses =
                [];


            setupSection.classList.add(
                "hidden"
            );


            resultsSection.classList.add(
                "hidden"
            );


            interviewSection.classList.remove(
                "hidden"
            );


            candidateAnswer.disabled =
                false;


            submitAnswerButton.disabled =
                false;


            submitAnswerButton.textContent =
                "Submit Answer";


            interviewQuestion.textContent =
                data.question.question;


            questionTopic.textContent =
                `${data.question.topic} • ${data.question.difficulty}`;


            questionProgress.textContent =
                `Question 1 of ${data.state.plan.total_questions}`;


            candidateAnswer.value =
                "";


            showStatus(
                "Interview started successfully."
            );


        } catch (error) {

            showStatus(
                `Error: ${error.message}`
            );


        } finally {

            startInterviewButton.disabled =
                false;


            startInterviewButton.textContent =
                "Start Interview";
        }
    }
);


// =========================================================
// AVERAGE
// =========================================================

function calculateAverage(
    analyses,
    property
) {

    if (!analyses.length) {
        return 0;
    }


    const total =
        analyses.reduce(
            (sum, item) => {

                return (
                    sum +
                    Number(
                        item.analysis?.[property] ||
                        0
                    )
                );

            },
            0
        );


    return (
        total /
        analyses.length
    );
}


// =========================================================
// GET ALL ITEMS
// =========================================================

function getAllItems(
    analyses,
    property
) {

    const items = [];


    analyses.forEach(
        (item) => {

            const values =
                item.analysis?.[property] ||
                [];


            values.forEach(
                (value) => {

                    if (
                        value &&
                        !items.includes(value)
                    ) {

                        items.push(
                            value
                        );
                    }

                }
            );

        }
    );


    return items;
}


// =========================================================
// GET TOP ITEMS
// =========================================================

function getTopItems(
    analyses,
    property,
    limit = 3
) {

    const items =
        getAllItems(
            analyses,
            property
        );


    return items.slice(
        0,
        limit
    );
}


// =========================================================
// SCORE LABEL
// =========================================================

function getScoreLabel(
    score
) {

    if (score >= 90) {
        return "Excellent";
    }

    if (score >= 80) {
        return "Strong";
    }

    if (score >= 70) {
        return "Good";
    }

    if (score >= 60) {
        return "Needs Improvement";
    }

    return "Significant Improvement Needed";
}


// =========================================================
// OVERALL ASSESSMENT
// =========================================================

function generateOverallAssessment(
    score
) {

    if (score >= 90) {

        return (
            "The candidate demonstrated excellent technical knowledge, strong problem-solving ability, and clear communication throughout the interview."
        );
    }


    if (score >= 80) {

        return (
            "The candidate demonstrated strong technical knowledge and problem-solving skills relevant to the target role, with generally clear communication."
        );
    }


    if (score >= 70) {

        return (
            "The candidate demonstrated a good technical foundation and reasonable problem-solving ability, with some areas requiring deeper explanation."
        );
    }


    if (score >= 60) {

        return (
            "The candidate demonstrated a developing technical foundation, with noticeable opportunities to improve technical depth, accuracy, or communication."
        );
    }


    return (
        "The candidate showed significant areas for improvement in technical understanding, depth, and communication during the interview."
    );
}


// =========================================================
// SCORE SUMMARY TEXT
// =========================================================

function generateCorrectnessSummary(
    score
) {

    if (score >= 80) {

        return "Demonstrated generally accurate understanding of the technical concepts discussed.";

    }


    if (score >= 60) {

        return "Demonstrated partial understanding, but some answers lacked precision or completeness.";

    }


    return "Several answers showed gaps in understanding or accuracy.";
}


function generateTechnicalDepthSummary(
    score
) {

    if (score >= 80) {

        return "Provided good technical detail and demonstrated understanding beyond basic definitions.";

    }


    if (score >= 60) {

        return "Showed a reasonable foundation, but several answers could include more technical detail and reasoning.";

    }


    return "Answers generally lacked sufficient technical depth and detailed reasoning.";
}


function generateClaritySummary(
    score
) {

    if (score >= 80) {

        return "Communicated technical ideas clearly and effectively.";

    }


    if (score >= 60) {

        return "Communication was understandable, but some answers could be more structured and focused.";

    }


    return "Several answers were unclear, unfocused, or lacked structured explanation.";
}


// =========================================================
// RENDER STRENGTHS
// =========================================================

function renderStrengths(
    strengths
) {

    overallStrengths.innerHTML =
        "";


    if (!strengths.length) {

        const li =
            document.createElement(
                "li"
            );


        li.textContent =
            "No specific strengths were identified.";


        overallStrengths.appendChild(
            li
        );


        return;
    }


    strengths.forEach(
        (strength) => {

            const li =
                document.createElement(
                    "li"
                );


            li.textContent =
                strength;


            overallStrengths.appendChild(
                li
            );

        }
    );
}


// =========================================================
// RENDER IMPROVEMENT AREAS
// =========================================================

function renderImprovementAreas(
    analyses
) {

    overallWeaknesses.innerHTML =
        "";


    const improvementItems =
        [];


    analyses.forEach(
        (item) => {

            const weaknesses =
                item.analysis?.weaknesses ||
                [];


            const recommendation =
                item.analysis?.recommendation ||
                "";


            weaknesses.forEach(
                (weakness) => {

                    const alreadyExists =
                        improvementItems.some(
                            (existing) =>
                                existing.weakness ===
                                weakness
                        );


                    if (
                        !alreadyExists
                    ) {

                        improvementItems.push({

                            weakness:
                                weakness,

                            recommendation:
                                recommendation

                        });

                    }

                }
            );

        }
    );


    const topImprovements =
        improvementItems.slice(
            0,
            3
        );


    if (!topImprovements.length) {

        const paragraph =
            document.createElement(
                "p"
            );


        paragraph.textContent =
            "No major improvement areas were identified.";


        overallWeaknesses.appendChild(
            paragraph
        );


        return;
    }


    topImprovements.forEach(
        (item) => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "improvement-item";


            const title =
                document.createElement(
                    "p"
                );


            title.innerHTML =
                `• <strong>${escapeHtml(
                    item.weakness
                )}</strong>`;


            wrapper.appendChild(
                title
            );


            if (
                item.recommendation
            ) {

                const recommendation =
                    document.createElement(
                        "p"
                    );


                recommendation.innerHTML =
                    `<strong>Recommendation:</strong> ${escapeHtml(
                        item.recommendation
                    )}`;


                wrapper.appendChild(
                    recommendation
                );

            }


            overallWeaknesses.appendChild(
                wrapper
            );

        }
    );
}


// =========================================================
// RENDER FINAL REPORT
// =========================================================

async function renderFinalReport() {

    if (!interviewAnalyses.length) {

        finalScore.textContent =
            "0 / 100";


        scoreLabel.textContent =
            "No Data";


        questionsAnswered.textContent =
            "0";


        correctnessReportScore.textContent =
            "0 / 100";


        technicalDepthReportScore.textContent =
            "0 / 100";


        clarityReportScore.textContent =
            "0 / 100";


        correctnessSummary.textContent =
            "No analysis available.";


        technicalDepthSummary.textContent =
            "No analysis available.";


        claritySummary.textContent =
            "No analysis available.";


        overallAssessment.textContent =
            "No interview analysis is available.";


        renderStrengths(
            []
        );


        renderImprovementAreas(
            []
        );


        return;
    }


    const overallScore =
        calculateAverage(
            interviewAnalyses,
            "score"
        );


    const correctnessScore =
        calculateAverage(
            interviewAnalyses,
            "correctness_score"
        );


    const technicalDepthScore =
        calculateAverage(
            interviewAnalyses,
            "technical_depth_score"
        );


    const clarityScore =
        calculateAverage(
            interviewAnalyses,
            "clarity_score"
        );


    const overall100 =
        overallScore * 10;


    const correctness100 =
        correctnessScore * 10;


    const technicalDepth100 =
        technicalDepthScore * 10;


    const clarity100 =
        clarityScore * 10;


    reportDate.textContent =
        new Date().toLocaleDateString(
            "en-GB"
        );


    reportCandidate.textContent =
        currentProfile?.name ||
        "Not specified";


    reportRole.textContent =
        currentInterviewState
            ?.plan
            ?.target_role ||
        targetRoleInput.value ||
        "Not specified";


    finalScore.textContent =
        `${overall100.toFixed(0)} / 100`;


    scoreLabel.textContent =
        getScoreLabel(
            overall100
        );


    questionsAnswered.textContent =
        interviewAnalyses.length;


    correctnessReportScore.textContent =
        `${correctness100.toFixed(0)} / 100`;


    technicalDepthReportScore.textContent =
        `${technicalDepth100.toFixed(0)} / 100`;


    clarityReportScore.textContent =
        `${clarity100.toFixed(0)} / 100`;


    correctnessSummary.textContent =
        generateCorrectnessSummary(
            correctness100
        );


    technicalDepthSummary.textContent =
        generateTechnicalDepthSummary(
            technicalDepth100
        );


    claritySummary.textContent =
        generateClaritySummary(
            clarity100
        );


    overallAssessment.textContent =
        generateOverallAssessment(
            overall100
        );


    const strengths =
        getTopItems(
            interviewAnalyses,
            "strengths",
            3
        );


    renderStrengths(
        strengths
    );


    renderImprovementAreas(
        interviewAnalyses
    );

    await saveRAGHistory(overall100, correctness100, technicalDepth100, clarity100, strengths);
}

async function saveRAGHistory(overall, correctness, technical, clarity, strengths) {
    if (!window.Clerk || !window.Clerk.session) return;
    try {
        const messages = currentInterviewState.turns.flatMap(turn => [
            { role: "interviewer", content: turn.question },
            { role: "candidate", content: turn.answer }
        ]);
        const evaluation = {
            overall_score: overall,
            correctness_score: correctness,
            technical_depth_score: technical,
            clarity_score: clarity,
            strengths: strengths,
            improvement_areas: interviewAnalyses.map(a => a.improvement_area).filter(Boolean),
            overall_assessment: generateOverallAssessment(overall)
        };
        await fetchWithAuth('http://127.0.0.1:8000/history/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, evaluation })
        });
    } catch (e) {
        console.error("Failed to save history:", e);
    }
}


// =========================================================
// SUBMIT ANSWER
// =========================================================

submitAnswerButton.addEventListener(
    "click",
    async () => {

        const answer =
            candidateAnswer.value.trim();


        if (!answer) {

            showStatus(
                "Please enter an answer."
            );

            candidateAnswer.focus();

            return;
        }


        if (!currentInterviewState) {

            showStatus(
                "Interview state is missing."
            );

            return;
        }


        const questionIndex =
            currentInterviewState
                .current_question_index;


        const currentQuestion =
            currentInterviewState
                .plan
                .questions[
                    questionIndex
                ];


        if (!currentQuestion) {

            showStatus(
                "Current interview question could not be found."
            );

            return;
        }


        submitAnswerButton.disabled =
            true;


        submitAnswerButton.textContent =
            "Analyzing...";


        try {

            const response =
                await fetchWithAuth(
                    `${API_BASE_URL}/interview/answer`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            state:
                                currentInterviewState,

                            answer:
                                answer
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Failed to submit answer."
                );
            }


            if (
                data.analysis
            ) {

                interviewAnalyses.push({

                    question:
                        currentQuestion.question,

                    answer:
                        answer,

                    topic:
                        currentQuestion.topic,

                    difficulty:
                        currentQuestion.difficulty,

                    analysis:
                        data.analysis

                });

            }


            currentInterviewState =
                data.state;


            if (
                data.state.completed
            ) {

                await renderFinalReport();


                interviewSection.classList.add(
                    "hidden"
                );


                resultsSection.classList.remove(
                    "hidden"
                );


                candidateAnswer.value =
                    "";


                candidateAnswer.disabled =
                    true;


                submitAnswerButton.disabled =
                    true;


                submitAnswerButton.textContent =
                    "Interview Completed";


                const finalAverage =
                    calculateAverage(
                        interviewAnalyses,
                        "score"
                    );


                showStatus(
                    `Interview completed. Final score: ${
                        (finalAverage * 10).toFixed(0)
                    }/100`
                );


                return;
            }


            if (!data.question) {

                throw new Error(
                    "The next interview question was not returned."
                );
            }


            interviewQuestion.textContent =
                data.question.question;


            questionTopic.textContent =
                `${data.question.topic} • ${data.question.difficulty}`;


            questionProgress.textContent =
                `Question ${
                    data.state.current_question_index + 1
                } of ${
                    data.state.plan.total_questions
                }`;


            candidateAnswer.value =
                "";


            showStatus(
                "Answer analyzed. Next question ready."
            );


        } catch (error) {

            showStatus(
                `Error: ${error.message}`
            );


        } finally {

            if (
                !currentInterviewState?.completed
            ) {

                submitAnswerButton.disabled =
                    false;


                submitAnswerButton.textContent =
                    "Submit Answer";
            }
        }
    }
);


// =========================================================
// THEME TOGGLE
// =========================================================
//
// IMPORTANT:
// Uses the SAME localStorage key as the home page.
// Home page uses: "platform-theme"
// =========================================================

const savedTheme =
    localStorage.getItem(
        "platform-theme"
    );


if (
    savedTheme === "dark"
) {

    document.body.classList.add(
        "dark-theme"
    );


    themeToggle.textContent =
        "☀ Light";

} else {

    document.body.classList.remove(
        "dark-theme"
    );


    themeToggle.textContent =
        "🌙 Dark";
}


themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-theme"
        );


        const darkModeEnabled =
            document.body.classList.contains(
                "dark-theme"
            );


        if (
            darkModeEnabled
        ) {

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