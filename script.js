let questions = [];
let currentQuestionIndex = 0;
let score = 0;

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
    score = 0; // Reset score
    updateScore();
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

    // Speak question and options automatically
    const optionsText = question.options
        .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
        .join(", ");
    const fullText = `${question.question} ${optionsText}`;
    console.log("Speaking:", fullText);

    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(fullText);
        speech.lang = "en-US";
        speech.volume = 1.0;
        speech.rate = 1.0;
        speech.pitch = 1.0;
        speech.onstart = () => console.log("Question speech started");
        speech.onend = () => console.log("Question speech finished");
        speech.onerror = (event) => console.error("Question speech error:", event.error);
        window.speechSynthesis.speak(speech);
    } else {
        console.error("SpeechSynthesis not supported.");
    }
}

// Update the score display
function updateScore() {
    document.getElementById("score").textContent = score;
}

// Check the user's answer with voice feedback
function checkAnswer(selectedIndex) {
    const question = questions[currentQuestionIndex];
    const correctIndex = question.answer.charCodeAt(0) - 65;
    const feedback = document.getElementById("feedback");
    let feedbackText = "";
    
    if (selectedIndex === correctIndex) {
        feedbackText = "Correct!";
        feedback.style.color = "green";
        score += 1; // Increment score
    } else {
        feedbackText = `Wrong! Correct answer: ${question.options[correctIndex]}`;
        feedback.style.color = "red";
    }
    feedback.textContent = feedbackText;
    updateScore();

    // Speak feedback
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Clear previous speech
        const speech = new SpeechSynthesisUtterance(feedbackText);
        speech.lang = "en-US";
        speech.volume = 1.0;
        speech.rate = 1.0;
        speech.pitch = 1.0;
        speech.onstart = () => console.log("Feedback speech started");
        speech.onend = () => console.log("Feedback speech finished");
        speech.onerror = (event) => console.error("Feedback speech error:", event.error);
        window.speechSynthesis.speak(speech);
    }

    setTimeout(() => {
        feedback.textContent = "";
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            const finalMessage = `Quiz finished! Your score: ${score} out of ${questions.length}`;
            alert(finalMessage);
            if (window.speechSynthesis) {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(finalMessage));
            }
            document.getElementById("quizContainer").style.display = "none";
            currentQuestionIndex = 0;
            startQuiz(); // Restart quiz
        }
    }, 3000); // Increased delay to allow feedback speech to finish
}
