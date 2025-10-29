document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');
    const playerNameInput = document.getElementById('playerNameInput'); // <--- AÑADIDO

    const questionSelectionScreen = document.getElementById('questionSelectionScreen');
    const questionButtonsContainer = document.getElementById('questionButtonsContainer');

    const questionScreen = document.getElementById('questionScreen');
    const currentQuestionNumberDisplay = document.getElementById('currentQuestionNumber');
    const currentQuestionPointsDisplay = document.getElementById('currentQuestionPoints');
    const goButton = document.getElementById('goButton');
    const quizContent = document.getElementById('quizContent');
    const questionText = document.getElementById('questionText');
    const answersGrid = document.querySelector('.answers-grid');
    const nextQuestionButton = document.getElementById('nextQuestionButton');

    const resultScreen = document.getElementById('resultScreen');
    const finalScoreDisplay = document.getElementById('finalScore');
    const playAgainButton = document.getElementById('playAgainButton');
    
    // --- Elementos del Formulario (AÑADIDOS) ---
    const scoreForm = document.getElementById('scoreForm'); 
    const saveScoreButton = document.getElementById('saveScoreButton'); 
    const resultMessage = document.getElementById('resultMessage'); 
    const hiddenNameInput = document.getElementById('hiddenNameInput');
    const hiddenScoreInput = document.getElementById('hiddenScoreInput');

    // --- Variables del Juego ---
    let questions = [];
    let currentQuestionIndex = 0;
    let selectedAnswer = null;
    let totalScore = 0;
    let currentPlayerName = ""; // <--- AÑADIDO

    // --- Funciones de Navegación entre Pantallas ---
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // --- Carga de Preguntas desde JSON ---
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            questions = await response.json();
            console.log('Preguntas cargadas:', questions);
            generateQuestionSelectionButtons();
        } catch (error) {
            console.error('Error al cargar las preguntas:', error);
            alert('No se pudieron cargar las preguntas del juego.');
        }
    }

    // --- Generar Botones de Selección de Preguntas ---
    function generateQuestionSelectionButtons() {
        questionButtonsContainer.innerHTML = ''; 
        questions.forEach((q, index) => {
            const button = document.createElement('button');
            button.classList.add('btn', 'question-select-btn');
            button.textContent = `PREGUNTA ${q.id} - ${q.points}`;
            button.dataset.questionId = q.id;

            if (index > currentQuestionIndex) {
                button.classList.add('unreachable');
                button.disabled = true;
            } else if (index === currentQuestionIndex) {
                button.classList.add('current');
            } else {
                button.classList.add('selected');
                button.disabled = true;
            }

            button.addEventListener('click', () => {
                if (!button.classList.contains('unreachable') && !button.classList.contains('selected')) {
                    currentQuestionIndex = index;
                    showQuestion(questions[currentQuestionIndex]);
                    showScreen('questionScreen');
                }
            });
            questionButtonsContainer.appendChild(button);
        });
    }

    // --- Mostrar Pregunta ---
    function showQuestion(questionData) {
        selectedAnswer = null;
        quizContent.classList.add('hidden'); 
        goButton.classList.remove('hidden'); 
        nextQuestionButton.classList.add('hidden'); 
        answersGrid.querySelectorAll('.answer-btn').forEach(btn => {
            btn.classList.remove('selected-answer', 'correct', 'incorrect');
            btn.disabled = false; 
        });

        currentQuestionNumberDisplay.textContent = `PREGUNTA ${questionData.id}`;
        currentQuestionPointsDisplay.textContent = questionData.points;
        questionText.textContent = questionData.question;
        answersGrid.innerHTML = ''; 

        questionData.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('answer-btn');
            button.dataset.answerValue = option; 
            button.innerHTML = `<span class="answer-letter">${getOptionLetter(option, questionData.options)}</span> <span class="answer-text">${option}</span>`;
            button.addEventListener('click', () => selectAnswer(button));
            answersGrid.appendChild(button);
        });
    }

    // Helper para obtener la letra
    function getOptionLetter(option, optionsArray) {
        const index = optionsArray.indexOf(option);
        return String.fromCharCode(65 + index); // 'A'
    }

    // --- Selección de Respuesta ---
    function selectAnswer(button) {
        if (selectedAnswer) return; 

        selectedAnswer = button.dataset.answerValue;
        answersGrid.querySelectorAll('.answer-btn').forEach(btn => {
            btn.classList.remove('selected-answer');
        });
        button.classList.add('selected-answer');
        answersGrid.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);
        nextQuestionButton.classList.remove('hidden');
        checkAnswer(button); 
    }

    // --- Verificar Respuesta ---
    function checkAnswer(selectedButton) {
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = (selectedButton.dataset.answerValue === currentQuestion.answer);

        if (isCorrect) {
            selectedButton.classList.remove('selected-answer'); 
            selectedButton.classList.add('correct');
            totalScore += currentQuestion.points;
        } else {
            selectedButton.classList.remove('selected-answer'); 
            selectedButton.classList.add('incorrect');
            answersGrid.querySelectorAll('.answer-btn').forEach(btn => {
                if (btn.dataset.answerValue === currentQuestion.answer) {
                    btn.classList.add('correct');
                }
            });
        }
    }

    // --- Ir a la Siguiente Pregunta o Finalizar Juego ---
    function goToNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            generateQuestionSelectionButtons(); 
            showScreen('questionSelectionScreen');
        } else {
            // --- MODIFICADO PARA PASAR DATOS AL FORMULARIO ---
            finalScoreDisplay.textContent = totalScore.toLocaleString(); 
            
            // Poner los datos en los campos ocultos
            hiddenScoreInput.value = totalScore;
            hiddenNameInput.value = currentPlayerName;
            
            // Mensaje personalizado
            resultMessage.textContent = `¡Buen trabajo, ${currentPlayerName}!`;
            
            showScreen('resultScreen');
        }
    }

    // --- Reiniciar Juego (MODIFICADO) ---
    function resetGame() {
        currentQuestionIndex = 0;
        totalScore = 0;
        selectedAnswer = null;
        
        // --- AÑADIDO PARA REINICIAR FORMULARIO Y JUGADOR ---
        currentPlayerName = ""; 
        playerNameInput.value = ""; 
        scoreForm.reset(); 
        saveScoreButton.disabled = false; // Habilitar el botón de guardar
        saveScoreButton.textContent = "Guardar en el Ranking";
        // --------------------------------------------------
        
        loadQuestions(); 
        showScreen('startScreen');
    }

    // --- Netlify Form Submission Handler (TU CÓDIGO MEJORADO) ---
    const handleSubmit = (event) => {
        event.preventDefault(); // ¡Evita la recarga y el error 404!

        const myForm = event.target;
        const formData = new FormData(myForm);

        // Deshabilitar el botón para evitar envíos duplicados
        saveScoreButton.disabled = true;
        saveScoreButton.textContent = "Guardando...";

        fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(formData).toString()
        })
        .then(() => {
            console.log("Formulario enviado con éxito");
            saveScoreButton.textContent = "¡Puntaje Guardado!";
            // El botón se queda deshabilitado hasta que jueguen de nuevo
        })
        .catch((error) => {
            alert("Hubo un error al guardar tu puntaje. Intenta de nuevo.");
            console.error(error);
            saveScoreButton.disabled = false; // Habilitar de nuevo si falló
            saveScoreButton.textContent = "Guardar en el Ranking";
        });
    };
    // --- Fin del Netlify Handler ---


    // --- Event Listeners (MODIFICADOS) ---
    
    // MODIFICADO para capturar el nombre
    startButton.addEventListener('click', () => {
        currentPlayerName = playerNameInput.value.trim(); // Obtener el nombre
        
        if (currentPlayerName === "") {
            alert("Por favor, escribe tu nombre para empezar.");
            playerNameInput.focus();
        } else {
            showScreen('questionSelectionScreen');
        }
    });

    goButton.addEventListener('click', () => {
        goButton.classList.add('hidden');
        quizContent.classList.remove('hidden');
    });

    nextQuestionButton.addEventListener('click', goToNextQuestion);
    playAgainButton.addEventListener('click', resetGame);
    
    // --- AÑADIDO: Event listener para el formulario ---
    scoreForm.addEventListener("submit", handleSubmit);

    // --- Inicio del Juego ---
    loadQuestions(); // Cargar las preguntas al iniciar
});