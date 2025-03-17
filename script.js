let questions = [];
let currentQuestionIndex = 0;

// Fetch questions when the page loads
window.onload = function() {
    console.log("Starting fetch for questions.json...");
    fetch("questions.json", { cache: "no-store" }) // Prevent caching issues
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
            alert("Failed to load questions. Using fallback data. Check console for details.");
            // Fallback questions for debugging
            questions = [
                {
                    question: "Fallback: What is 1 + 1?",
                    options: ["2", "3", "4"],
                    answer: "A"
                }
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
    speech.lang = "en-US";
    speech.onstart = () => console.log("Speech started");
    speech.onerror = (event) => console.error("Speech error:", event.error);
    window.speechSynthesis.speak(speech);
});

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
