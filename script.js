let questions = [];
let currentQuestionIndex = 0;
let score = 0;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

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
            document.getElementById("startButton").addEventListener("click", () => {
                document.getElementById("startContainer").style.display = "none";
                startQuiz();
            });
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Failed to load questions. Using fallback data.");
            questions = [
                { question: "Fallback: What is 1 + 1?", options: ["2", "3", "4"], answer: "A" }
            ];
            document.getElementById("startButton").addEventListener("click", () => {
                document.getElementById("startContainer").style.display = "none";
                startQuiz();
            });
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
    score = 0;
    updateScore();
    document.getElementById("scoreContainer").style.display = "block";
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

// Check the user's answer (button or voice)
function checkAnswer(selectedIndex) {
    const question = questions[currentQuestionIndex];
    const correctIndex = question.answer.charCodeAt(0) - 65;
    const feedback = document.getElementById("feedback");
    let feedbackText = "";
    
    if (selectedIndex === correctIndex) {
        feedbackText = "Correct!";
        feedback.style.color = "green";
        score += 1;
    } else {
        feedbackText = `Wrong! Correct answer: ${question.options[correctIndex]}`;
        feedback.style.color = "red";
    }
    feedback.textContent = feedbackText;
    updateScore();

    // Speak feedback
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
            document.getElementById("scoreContainer").style.display = "none";
            document.getElementById("quizContainer").style.display = "none";
            document.getElementById("startContainer").style.display = "block";
            currentQuestionIndex = 0;
        }
    }, 3000);
}

// Voice input for answers
if (recognition) {
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    document.getElementById("speakAnswerButton").addEventListener("click", () => {
        recognition.start();
        console.log("Speech recognition started...");
    });

    recognition.onresult = (event) => {
        const spokenAnswer = event.results[0][0].transcript.trim().toLowerCase();
        console.log("Spoken answer:", spokenAnswer);

        const question = questions[currentQuestionIndex];
        const correctIndex = question.answer.charCodeAt(0) - 65;
        let selectedIndex = -1;

        // Check if spoken answer matches a letter (A, B, C)
        const letter = spokenAnswer.toUpperCase();
        if (["a", "b", "c"].includes(spokenAnswer)) {
            selectedIndex = letter.charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1, 'c' -> 2
        } else {
            // Check if spoken answer matches an option text
            selectedIndex = question.options.findIndex(option => 
                option.toLowerCase() === spokenAnswer
            );
        }

        if (selectedIndex !== -1) {
            checkAnswer(selectedIndex);
        } else {
            const feedback = document.getElementById("feedback");
            feedback.textContent = "Sorry, I didn’t understand that. Try again.";
            feedback.style.color = "orange";
            if (window.speechSynthesis) {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(feedback.textContent));
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert("Voice input failed: " + event.error);
    };

    recognition.onend = () => {
        console.log("Speech recognition ended.");
    };
} else {
    console.error("SpeechRecognition not supported.");
    document.getElementById("speakAnswerButton").style.display = "none";
}
