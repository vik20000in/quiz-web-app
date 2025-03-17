let allData = {};
let questions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let attemptedQuestions = 0;
let questionHistory = []; // Track questions seen in this session
let score = 0;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;


const encouragingPhrases = [

    "Great job!",
    "Excellent!",
    "You're doing amazing!",
    "Keep it up!",
    "Wow, that's correct!"
];

// Fetch questions when the page loads
window.onload = function() {
    var savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        document.getElementById('theme-select').value = savedTheme;
    } else {
        document.body.className = 'school';
    }
    document.getElementById('theme-select').addEventListener('change', function() {
        var theme = this.value;
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    });
    fetch("data.json", { cache: "no-store" })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allData = data;
            populateClass();
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Failed to load questions. Using fallback data.");
            allData = {
                categories: [
                    {
                        name: "Fallback",
                        subcategories: [
                            { name: "Test", questions: [{ question: "What is 1 + 1?", options: ["2", "3", "4"], answer: "A", explanation: "Basic addition." }] }
                        ]
                    }
                ]
            };
            populateClassSelect();
        });
};


// Populate Class dropdown
function populateClass() {
    const classSelect = document.getElementById("classSelect");
    classSelect.innerHTML = '<option value="">Select Class</option>';
    allData.classes.forEach((classes, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = classes.name;
        classSelect.appendChild(option);
    });

    classSelect.addEventListener("change", populateCategories);
    document.getElementById("startButton").addEventListener("click", startQuizFromSelection);
}

// Populate category dropdown
function populateCategories() {
    const classIndex = document.getElementById("classSelect").value;
    const categorySelect = document.getElementById("categorySelect");
    categorySelect.innerHTML = '<option value="">Select Subject</option>';
    if (classIndex !== "") {
        const categories = allData.classes[classIndex].categories;
        categories.forEach((category, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });

    categorySelect.addEventListener("change", populateSubcategories);
    document.getElementById("startButton").addEventListener("click", startQuizFromSelection);
}
}

// Populate subcategory dropdown
function populateSubcategories() {
    const classIndex = document.getElementById("classSelect").value;
    const categoryIndex = document.getElementById("categorySelect").value;
    const subcategorySelect = document.getElementById("subcategorySelect");
    subcategorySelect.innerHTML = '<option value="">Select Chapter</option>';

    if (categoryIndex !== "") {
        const subcategories = allData.classes[classIndex].categories[categoryIndex].subcategories;
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
    const classIndex = document.getElementById("classSelect").value;
    const categoryIndex = document.getElementById("categorySelect").value;
    const subcategoryIndex = document.getElementById("subcategorySelect").value;
    if (categoryIndex === "" || subcategoryIndex === "") {
        alert("Please select a subject and chapter.");
        return;
    }

    questions = [...allData.classes[classIndex].categories[categoryIndex].subcategories[subcategoryIndex].questions];
    shuffleArray(questions);
    document.getElementById("startContainer").style.display = "none";
    startQuiz();
}

// Start the quiz
function startQuiz() {
    if (questions.length === 0) {
        alert("No questions to display.");
        return;
    }
    correctAnswers = 0;
    attemptedQuestions = 0;
    currentQuestionIndex = 0;
    questionHistory = [0];
    score = 0; // Reset score
    updateScore();
    generateStars();
    document.getElementById("scoreContainer").style.display = "block";
    document.getElementById("quizContainer").style.display = "block";
    showQuestion();

    document.getElementById("exitButton").addEventListener("click", exitQuiz);
}



// Generate stars for progress

function generateStars() {

    const starsContainer = document.getElementById("stars");

    starsContainer.innerHTML = "";

    for (let i = 0; i < questions.length; i++) {
        const star = document.createElement("span");
        star.textContent = "☆";
        starsContainer.appendChild(star);
    }
}

// Update stars based on correct answers
function updateStars() {

    const stars = document.querySelectorAll("#stars span");
    for (let i = 0; i < correctAnswers; i++) {
        stars[i].textContent = "★";
        stars[i].classList.add("filled");
        document.getElementById("score1").innerHTML =  `Quiz  score: ${correctAnswers} out of ${attemptedQuestions}`
    }

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

    const optionsText = question.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join(", ");
    const fullText = `${question.question} ${optionsText}`;
    speakText(fullText);
}

// Update the score display
function updateScore() {
  //  document.getElementById("score").textContent = correctAnswers;//`${correctAnswers} out of ${attemptedQuestions}`;
}

// Check the user's answer
function checkAnswer(selectedIndex) {
    const question = questions[currentQuestionIndex];
    const correctIndex = question.answer.charCodeAt(0) - 65;
    const feedback = document.getElementById("feedback");

    attemptedQuestions++;

    if (selectedIndex === correctIndex) {
        const phrase = encouragingPhrases[Math.floor(Math.random() * encouragingPhrases.length)];
        feedback.innerHTML = `${phrase} 😊`;

        speakText(phrase);
      //  feedback.textContent = "Correct!";
        feedback.style.color = "green";
        correctAnswers++;
        updateScore();
         updateStars();
        speakText("Correct!");
        // Automatically move to next question after 2 seconds
        setTimeout(goToNextQuestion, 2000);
    } else {
        feedback.textContent = `Wrong! Correct answer: ${question.options[correctIndex]}. Explanation: ${question.explanation}`;
        feedback.style.color = "red";
        feedback.innerHTML = `Oops, that's not right. The correct answer is ${question.options[correctIndex]}. Explanation: ${question.explanation} 😞`;

        speakText("Oops, that's not right.");

        updateScore();
        speakText(feedback.textContent);
        // Show "Next Question" button
        document.getElementById("nextButton").style.display = "inline";
    }
}

// Voice input for answers
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
            selectedIndex = question.options.findIndex(opt => opt.toLowerCase() === spokenAnswer);
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

// Go to the next question
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

// Go to the previous question
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

// Exit the quiz
function exitQuiz() {
    endQuiz(true);
}

// End the quiz
function endQuiz(isExit = false) {
    const finalMessage = isExit 
        ? `Quiz exited! Your score: ${correctAnswers} out of ${attemptedQuestions}`
        : `Quiz finished! Your score: ${correctAnswers} out of ${attemptedQuestions}`;
    alert(finalMessage);
    speakText(finalMessage);
    document.getElementById("scoreContainer").style.display = "none";
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("startContainer").style.display = "block";
    correctAnswers = 0;
    attemptedQuestions = 0;
    updateScore();
}

// Speak text function
function speakText(text) {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = "en-US";
        window.speechSynthesis.speak(speech);
    }
}

// Attach event listeners for navigation
document.getElementById("nextButton").addEventListener("click", goToNextQuestion);
document.getElementById("previousButton").addEventListener("click", goToPreviousQuestion);
