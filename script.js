let questions = [];
let currentQuestionIndex = 0;

// Load questions from JSON file
function loadQuestions(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        questions = JSON.parse(e.target.result);
        startQuiz();
    };
    reader.readAsText(file);
}

// Start the quiz
function startQuiz() {
    if (questions.length === 0) {
        alert("No questions loaded. Please upload a valid JSON file.");
        return;
    }
    document.getElementById("quizContainer").style.display = "block";
    showQuestion();
}

// Display the current question
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
}

// Speak the question
document.getElementById("speakButton").addEventListener("click", () => {
    const question = questions[currentQuestionIndex];
    const speech = new SpeechSynthesisUtterance(question.question);
    speech.lang = "en-US"; // Adjust language as needed
    window.speechSynthesis.speak(speech);
});

// Check the user's answer
function checkAnswer(selectedIndex) {
    const question = questions[currentQuestionIndex];
    const correctIndex = question.answer.charCodeAt(0) - 65; // Convert 'A' to 0, 'B' to 1, etc.
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
        }
    }, 2000);
}