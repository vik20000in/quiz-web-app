let allData = {};
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
            console.log("Data loaded:", data);
            allData = data;
            populateCategories();
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Failed to load questions. Using fallback data.");
            allData = {
                categories: [
                    {
                        name: "Fallback",
                        subcategories: [
                            { name: "Test", questions: [{ question: "What is 1 + 1?", options: ["2", "3", "4"], answer: "A" }] }
                        ]
                    }
                ]
            };
            populateCategories();
        });
};

// Populate category dropdown
function populateCategories() {
    const categorySelect = document.getElementById("categorySelect");
    categorySelect.innerHTML = '<option value="">Select Subject</option>';
    allData.categories.forEach((category, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });

    categorySelect.addEventListener("change", populateSubcategories);
    document.getElementById("startButton").addEventListener("click", startQuizFromSelection);
}

// Populate subcategory dropdown
function populateSubcategories() {
    const categoryIndex = document.getElementById("categorySelect").value;
    const subcategorySelect = document.getElementById("subcategorySelect");
    subcategorySelect.innerHTML = '<option value="">Select Chapter</option>';

    if (categoryIndex !== "") {
        const subcategories = allData.categories[categoryIndex].subcategories;
        subcategories.forEach((subcategory, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = subcategory.name;
            subcategorySelect.appendChild(option);
        });
    }
}

// Shuffle array function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start the quiz based on selection
function startQuizFromSelection() {
    const categoryIndex = document.getElementById("categorySelect").value;
    const subcategoryIndex = document.getElementById("subcategorySelect").value;
    if (categoryIndex === "" || subcategoryIndex === "") {
        alert("Please select a subject and chapter.");
        return;
    }

    // Get and shuffle questions
    questions = [...allData.categories[categoryIndex].subcategories[subcategoryIndex].questions];
    shuffleArray(questions);
    document.getElementById("startContainer").style.display = "none";
    startQuiz();
}

// Start the quiz
function startQuiz() {
    if (questions.length === 0) {
        console.warn("No questions available.");
        alert("No questions to display.");
        return;
    }
    console.log("Starting quiz with", questions.length, "questions.");
    score = 0;
    currentQuestionIndex = 0;
    updateScore();
    document.getElementById("scoreContainer").style.display = "block";
    document.getElementById("quizContainer").style.display = "block";
    showQuestion();

    // Add exit button functionality
    document.getElementById("exitButton").addEventListener("click", exitQuiz);
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

    // Speak question and options
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
    }
}

// Update the score display
function updateScore() {
    document.getElementById("score").textContent = score;
}

// Check the user's answer
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
        document.getElementById("spokenAnswer").textContent = "";
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            endQuiz();
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
        document.getElementById("spokenAnswer").textContent = `Heard: "${spokenAnswer}"`;

        const question = questions[currentQuestionIndex];
        const correctIndex = question.answer.charCodeAt(0) - 65;
        let selectedIndex = -1;

        // Check if spoken answer matches a letter (A, B, C)
        const letter = spokenAnswer.toUpperCase();
        if (["a", "b", "c"].includes(spokenAnswer)) {
            selectedIndex = letter.charCodeAt(0) - 97;
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
        document.getElementById("spokenAnswer").textContent = `Recognition error: ${event.error}`;
    };

    recognition.onend = () => {
        console.log("Speech recognition ended.");
    };
} else {
    console.error("SpeechRecognition not supported.");
    document.getElementById("speakAnswerButton").style.display = "none";
}

// Exit the quiz
function exitQuiz() {
    console.log("Exiting quiz...");
    endQuiz(true); // Pass true to indicate exit rather than completion
}

// End the quiz (either by completion or exit)
function endQuiz(isExit = false) {
    const finalMessage = isExit 
        ? `Quiz exited! Your score: ${score} out of ${questions.length}`
        : `Quiz finished! Your score: ${score} out of ${questions.length}`;
    alert(finalMessage);
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(finalMessage));
    }
    document.getElementById("scoreContainer").style.display = "none";
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("startContainer").style.display = "block";
    currentQuestionIndex = 0;
    score = 0; // Reset score for the next quiz
    updateScore();
}
