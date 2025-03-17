let questions = [];
let currentQuestionIndex = 0;

// Fetch questions from server when the page loads
window.onload = function() {
    fetch("questions.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            questions = data;
            startQuiz();
        })
        .catch(error => {
            console.error("Error loading questions:", error);
            alert("Failed to load questions from the server.");
        });
};

// Start the quiz
function startQuiz() {
    if (questions.length === 0) {
        alert("No questions available.");
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
            currentQuestionIndex = 0; // Reset for replay
            startQuiz(); // Restart the quiz
        }
    }, 2000);
}
