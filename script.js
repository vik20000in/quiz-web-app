let allData = {};
let utterances = [];
let utteranceIndex = 0;

// Load data when the page starts
window.onload = function() {
    fetch("data.json", { cache: "no-store" })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allData = data;
            populateQuizCategories();
            populateDictationCategories();
        })
        .catch(error => {
            console.error("Error loading data:", error);
            alert("Failed to load data.");
        });
};

// --- Quiz Functions ---
function populateQuizCategories() {
    const quizCategorySelect = document.getElementById("quizCategorySelect");
    quizCategorySelect.innerHTML = '<option value="">Select Subject</option>';
    allData.quiz.categories.forEach((category, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = category.name;
        quizCategorySelect.appendChild(option);
    });
    quizCategorySelect.addEventListener("change", populateQuizSubcategories);
}

function populateQuizSubcategories() {
    const categoryIndex = document.getElementById("quizCategorySelect").value;
    const quizSubcategorySelect = document.getElementById("quizSubcategorySelect");
    quizSubcategorySelect.innerHTML = '<option value="">Select Chapter</option>';
    if (categoryIndex !== "") {
        const subcategories = allData.quiz.categories[categoryIndex].subcategories;
        subcategories.forEach((subcategory, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = subcategory.name;
            quizSubcategorySelect.appendChild(option);
        });
    }
}

document.getElementById("startQuiz").addEventListener("click", () => {
    document.getElementById("quizSelection").style.display = "none";
    document.getElementById("quizContainer").style.display = "block";
    // Add your quiz start logic here
});

// --- Dictation Functions ---
function populateDictationCategories() {
    const dictationCategorySelect = document.getElementById("dictationCategorySelect");
    dictationCategorySelect.innerHTML = '<option value="">Select Category</option>';
    allData.dictation.categories.forEach((category, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = category.name;
        dictationCategorySelect.appendChild(option);
    });
    dictationCategorySelect.addEventListener("change", populatePassages);
}

function populatePassages() {
    const categoryIndex = document.getElementById("dictationCategorySelect").value;
    const passageSelect = document.getElementById("passageSelect");
    passageSelect.innerHTML = '<option value="">Select Passage</option>';
    if (categoryIndex !== "") {
        const passages = allData.dictation.categories[categoryIndex].passages;
        passages.forEach((passage, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = passage.title;
            passageSelect.appendChild(option);
        });
    }
}

function startDictation() {
    const categoryIndex = document.getElementById("dictationCategorySelect").value;
    const passageIndex = document.getElementById("passageSelect").value;
    if (categoryIndex === "" || passageIndex === "") {
        alert("Please select a category and passage.");
        return;
    }
    const passage = allData.dictation.categories[categoryIndex].passages[passageIndex];
    const text = passage.text;
    utterances = text.split('.').filter(sentence => sentence.trim() !== '');
    utteranceIndex = 0;
    document.getElementById("dictationSelection").style.display = "none";
    document.getElementById("dictationContainer").style.display = "block";
    speakNextUtterance();
}

function speakNextUtterance() {
    if (utteranceIndex < utterances.length) {
        const sentence = utterances[utteranceIndex].trim() + '.';
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = "en-US";
        utterance.rate = 0.7; // Slow speech for clarity
        utterance.onend = function() {
            setTimeout(speakNextUtterance, 2000); // 2-second pause between sentences
        };
        window.speechSynthesis.speak(utterance);
        utteranceIndex++;
    } else {
        alert("Dictation completed.");
        document.getElementById("dictationContainer").style.display = "none";
        document.getElementById("modeSelection").style.display = "block";
    }
}

// --- Event Listeners ---
document.getElementById("startQuizButton").addEventListener("click", () => {
    document.getElementById("modeSelection").style.display = "none";
    document.getElementById("quizSelection").style.display = "block";
});

document.getElementById("startDictationButton").addEventListener("click", () => {
    document.getElementById("modeSelection").style.display = "none";
    document.getElementById("dictationSelection").style.display = "block";
});

document.getElementById("startDictation").addEventListener("click", startDictation);

document.getElementById("stopDictationButton").addEventListener("click", () => {
    window.speechSynthesis.cancel();
    document.getElementById("dictationContainer").style.display = "none";
    document.getElementById("modeSelection").style.display = "block";
});
