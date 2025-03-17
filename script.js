let questions = [];
let currentQuestionIndex = 0;

// Fetch questions when the page loads
window.onload = function() {
    console.log("Starting fetch for questions.json...");
    fetch("questions.json", { cache: "no-store" })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Questions loaded:", data);
            questions = data;
            startQuiz();
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Failed to load questions. Using fallback data.");
            questions = [
                { question: "Fallback: What is 1 + 1?", options: ["2", "3", "4"], answer: "A" }
            ];
            startQuiz();
        });
};

// Start the quiz
function startQuiz() {
    if (questions.length === 0) {
        console.warn("No questions available.");
        alert("No questions to display.");
        return;
    }
    console.log("Starting quiz with", questions.length, "questions.");
    document.getElementById("quizContainer").style.display = "block";
    showQuestion();
}

// Display and speak the current question
function showQuestion() {
    const question = questions[currentQuestionIndex];
    document.getElementById("questionText").textContent = question.question;
    
    const optionsList = document.getElementById("optionsList");
    optionsList.innerHTML = "";
    question.options.forEach((option, index) => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
        button.onclick = () => checkAnswer(index);
        li.appendChild(button);
        optionsList.appendChild(li);
    });

    // Prepare speech text with question and options
    const optionsText = question.options
        .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
        .join(", ");
    const fullText = `${question.question} ${optionsText}`;
    console.log("Speaking:", fullText);

    // Speak automatically
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Clear any previous speech
        const speech = new SpeechSynthesisUtterance(fullText);
        speech.lang = "en-US";
        speech.volume = 1.0;
        speech.rate = 1.0;
        speech.pitch = 1.0;

        speech.onstart = () => console.log("Speech started");
        speech.onend = () => console.log("Speech finished");
        speech.onerror = (event) => {
            console.error("Speech error:", event.error);
            alert("Speech failed: " + event.error);
        };

        window.speechSynthesis.speak(speech);
    } else {
        console.error("SpeechSynthesis not supported.");
        alert("Voice feature not supported on this device/browser.");
    }
}

// Check the user's answer
function checkAnswer(selectedIndex) {
    const question = questions[currentQuestionIndex];
    const correctIndex = question.answer.charCodeAt(0) - 65;
    const feedback = document.getElementById("feedback");
    if (selectedIndex === correctIndex) {
        feedback.textContent = "Correct!";
        feedback.style.color = "green";
    } else {
        feedback.textContent = `Wrong! Correct answer: ${question.options[correctIndex]}`;
        feedback.style.color = "red";
    }
    setTimeout(() => {
        feedback.textContent = "";
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            alert("Quiz finished!");
            document.getElementById("quizContainer").style.display = "none";
            currentQuestionIndex = 0;
            startQuiz();
        }
    }, 2000);
}
