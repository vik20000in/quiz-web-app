let allData = {};
let questions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let attemptedQuestions = 0;
let questionHistory = [];

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

// Load data when the page starts
window.onload = function() {
    fetch("data.json", { cache: "no-store" })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allData = data;
            populateClassSelect();
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Failed to load data. Using fallback data.");
            allData = {
                classes: {
                    "Class 6": {
                        categories: [
                            {
                                name: "Fallback",
                                subcategories: [
                                    {
                                        name: "Test",
                                        questions: [
                                            { question: "What is 1 + 1?", options: ["2", "3", "4"], answer: "A", explanation: "Basic addition." }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            };
            populateClassSelect();
        });
};

// Populate class selection dropdown
function populateClassSelect() {
    const classSelect = document.getElementById("classSelect");
    classSelect.innerHTML = '<option value="">Select Class</option>';
    Object.keys(allData.classes).forEach((classKey) => {
        const option = document.createElement("option");
        option.value = classKey;
        option.textContent = classKey;
        classSelect.appendChild(option);
    });
}

// Start quiz selection process
document.getElementById("startQuizButton").addEventListener("click", () => {
    document.getElementById("modeSelection").style.display = "none";
    document.getElementById("classSelection").style.display = "block";
});

// Select class and proceed to category selection
document.getElementById("selectClassButton").addEventListener("click", () => {
    const selectedClass = document.getElementById("classSelect").value;
    if (selectedClass) {
        populateQuizCategories(selectedClass);
        document.getElementById("classSelection").style.display = "none";
        document.getElementById("quizSelection").style.display = "block";
    } else {
        alert("Please select a class.");
    }
});

// Populate quiz category dropdown based on selected class
function populateQuizCategories(selectedClass) {
    const quizCategorySelect = document.getElementById("quizCategorySelect");
    quizCategorySelect.innerHTML = '<option value="">Select Subject</option>';
    allData.classes[selectedClass].categories.forEach((category, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = category.name;
        quizCategorySelect.appendChild(option);
    });
    quizCategorySelect.addEventListener("change", populateQuizSubcategories);
}

// Populate quiz subcategory dropdown based on selected category
function populateQuizSubcategories() {
    const categoryIndex = document.getElementById("quizCategorySelect").value;
    const selectedClass = document.getElementById("classSelect").value;
    const categories = allData.classes[selectedClass].categories;
    const selectedCategory = categories[categoryIndex];
    const quizSubcategorySelect = document.getElementById("quizSubcategorySelect");
    quizSubcategorySelect.innerHTML = '<option value="">Select Chapter</option>';
    if (categoryIndex !== "") {
        selectedCategory.subcategories.forEach((subcategory, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = subcategory.name;
            quizSubcategorySelect.appendChild(option);
        });
    }
}

// Start quiz based on user selection
document.getElementById("startQuiz").addEventListener("click", startQuizFromSelection);

function startQuizFromSelection() {
    const selectedClass = document.getElementById("classSelect").value;
    const categoryIndex = document.getElementById("quizCategorySelect").value;
    const subcategoryIndex = document.getElementById("quizSubcategorySelect").value;
    if (selectedClass === "" || categoryIndex === "" || subcategoryIndex === "") {
        alert("Please select a class, subject, and chapter.");
        return;
    }
    const categories = allData.classes[selectedClass].categories;
    const selectedCategory = categories[categoryIndex];
    const selectedSubcategory = selectedCategory.subcategories[subcategoryIndex];
    questions = [...selectedSubcategory.questions];
    shuffleArray(questions);
    document.getElementById("quizSelection").style.display = "none";
    startQuiz();
}

// Initialize quiz
function startQuiz() {
    if (questions.length === 0) {
        alert("No questions to display.");
        return;
    }
    correctAnswers = 0;
    attemptedQuestions = 0;
    currentQuestionIndex = 0;
    questionHistory = [0];
    updateScore();
    document.getElementById("quizContainer").style.display = "block";
    showQuestion();
    document.getElementById("exitButton").addEventListener("click", exitQuiz);
}

// Display current question
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

    const optionsText = question.options
        .map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`)
        .join(", ");
    const fullText = `${question.question} ${optionsText}`;
    speakText(fullText);
}

// Update score display
function updateScore() {
    document.getElementById("score").textContent = `${correctAnswers} out of ${attemptedQuestions}`;
}

// Check user's answer
function checkAnswer(selectedIndex) {
    const question = questions[currentQuestionIndex];
    const correctIndex = question.answer.charCodeAt(0) - 65;
    const feedback = document.getElementById("feedback");

    attemptedQuestions++;

    if (selectedIndex === correctIndex) {
        feedback.textContent = "Correct!";
        feedback.style.color = "green";
        correctAnswers++;
        updateScore();
        speakText("Correct!");
        setTimeout(goToNextQuestion, 2000);
    } else {
        feedback.textContent = `Wrong! Correct answer: ${question.options[correctIndex]}. Explanation: ${question.explanation}`;
        feedback.style.color = "red";
        updateScore();
        speakText(feedback.textContent);
        document.getElementById("nextButton").style.display = "inline";
    }
}

// Go to next question
function goToNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        questionHistory.push(currentQuestionIndex);
        showQuestion();
        document.getElementById("feedback").textContent = "";
        document.getElementById("spokenAnswer").textContent = "";
        document.getElementById("nextButton").style.display = "none";
        if (currentQuestionIndex > 0) document.getElementById("previousButton").style.display = "inline";
    } else {
        endQuiz();
    }
}

// Go to previous question
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
        document.getElementById("feedback").textContent = "";
        document.getElementById("spokenAnswer").textContent = "";
        document.getElementById("nextButton").style.display = "none";
        if (currentQuestionIndex === 0) document.getElementById("previousButton").style.display = "none";
    }
}

// Exit quiz
function exitQuiz() {
    endQuiz(true);
}

// End quiz and show results
function endQuiz(isExit = false) {
    const finalMessage = isExit
        ? `Quiz exited! Your score: ${correctAnswers} out of ${attemptedQuestions}`
        : `Quiz finished! Your score: ${correctAnswers} out of ${attemptedQuestions}`;
    alert(finalMessage);
    speakText(finalMessage);
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("modeSelection").style.display = "block";
    correctAnswers = 0;
    attemptedQuestions = 0;
    updateScore();
}

// Shuffle array for randomization
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Speak text using Web Speech API
function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.7; // Default rate for quiz
    window.speechSynthesis.speak(utterance);
}

// Voice input for quiz answers
if (recognition) {
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    document.getElementById("speakAnswerButton").addEventListener("click", () => {
        recognition.start();
    });

    recognition.onresult = (event) => {
        const spokenAnswer = event.results[0][0].transcript.trim().toLowerCase();
        document.getElementById("spokenAnswer").textContent = `Heard: "${spokenAnswer}"`;

        const question = questions[currentQuestionIndex];
        const correctIndex = question.answer.charCodeAt(0) - 65;
        let selectedIndex = -1;

        if (["a", "b", "c"].includes(spokenAnswer)) {
            selectedIndex = spokenAnswer.charCodeAt(0) - 97;
        } else if (spokenAnswer === "next question") {
            if (document.getElementById("feedback").textContent.includes("Wrong")) {
                goToNextQuestion();
            }
            return;
        } else {
            selectedIndex = question.options.findIndex((opt) => opt.toLowerCase() === spokenAnswer);
        }

        if (selectedIndex !== -1) {
            checkAnswer(selectedIndex);
        } else {
            const feedback = document.getElementById("feedback");
            feedback.textContent = "Sorry, I didn’t understand that. Try again.";
            feedback.style.color = "orange";
            speakText(feedback.textContent);
        }
    };

    recognition.onerror = (event) => {
        document.getElementById("spokenAnswer").textContent = `Recognition error: ${event.error}`;
    };
} else {
    document.getElementById("speakAnswerButton").style.display = "none";
}

// Event listeners for navigation
document.getElementById("nextButton").addEventListener("click", goToNextQuestion);
document.getElementById("previousButton").addEventListener("click", goToPreviousQuestion);
