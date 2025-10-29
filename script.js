document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');

     const playerNameInput = document.getElementById('playerNameInput');

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

    // --- Variables del Juego ---
    let questions = [];
    let currentQuestionIndex = 0;
    let selectedAnswer = null;
    let totalScore = 0;
    let currentPlayerName = "";

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

    // --- Generar Botones de Selección de Preguntas (Imagen 1) ---
    function generateQuestionSelectionButtons() {
        questionButtonsContainer.innerHTML = ''; // Limpiar botones existentes
        questions.forEach((q, index) => {
            const button = document.createElement('button');
            button.classList.add('btn', 'question-select-btn');
            button.textContent = `PREGUNTA ${q.id} - ${q.points}`;
            button.dataset.questionId = q.id;

            if (index > currentQuestionIndex) {
                // Las preguntas futuras son inaccesibles hasta completar las anteriores
                button.classList.add('unreachable');
                button.disabled = true;
            } else if (index === currentQuestionIndex) {
                // Resaltar la pregunta actual
                button.classList.add('current');
            } else {
                // Las preguntas ya completadas se marcan como seleccionadas
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

    // --- Mostrar Pregunta (Imagen 4) ---
    function showQuestion(questionData) {
        // Reiniciar estado
        selectedAnswer = null;
        quizContent.classList.add('hidden'); // Ocultar quiz content inicialmente
        goButton.classList.remove('hidden'); // Mostrar botón ¡VAMOS!
        nextQuestionButton.classList.add('hidden'); // Ocultar botón Siguiente
        answersGrid.querySelectorAll('.answer-btn').forEach(btn => {
            btn.classList.remove('selected-answer', 'correct', 'incorrect');
            btn.disabled = false; // Habilitar todos los botones de respuesta
        });

        currentQuestionNumberDisplay.textContent = `PREGUNTA ${questionData.id}`;
        currentQuestionPointsDisplay.textContent = questionData.points;
        questionText.textContent = questionData.question;
        answersGrid.innerHTML = ''; // Limpiar respuestas anteriores

        questionData.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('answer-btn');
            button.dataset.answerValue = option; // Guardar el valor de la opción
            button.innerHTML = `<span class="answer-letter">${getOptionLetter(option, questionData.options)}</span> <span class="answer-text">${option}</span>`;
            button.addEventListener('click', () => selectAnswer(button));
            answersGrid.appendChild(button);
        });
    }

    // Helper para obtener la letra de la opción (A, B, C, D)
    function getOptionLetter(option, optionsArray) {
        const index = optionsArray.indexOf(option);
        return String.fromCharCode(65 + index); // 65 es el código ASCII para 'A'
    }

    // --- Selección de Respuesta (Imagen 5) ---
    function selectAnswer(button) {
        if (selectedAnswer) return; // Si ya se seleccionó una respuesta, no hacer nada

        selectedAnswer = button.dataset.answerValue;
        // Quitar la clase 'selected-answer' de cualquier botón previamente seleccionado
        answersGrid.querySelectorAll('.answer-btn').forEach(btn => {
            btn.classList.remove('selected-answer');
        });
        button.classList.add('selected-answer');

        // Deshabilitar todos los botones de respuesta después de una selección
        answersGrid.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);

        // Mostrar el botón "Siguiente" inmediatamente después de seleccionar una respuesta
        nextQuestionButton.classList.remove('hidden');

        checkAnswer(button); // Verificar la respuesta
    }

    // --- Verificar Respuesta ---
    function checkAnswer(selectedButton) {
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = (selectedButton.dataset.answerValue === currentQuestion.answer);

        if (isCorrect) {
            selectedButton.classList.remove('selected-answer'); // Quitar color de selección
            selectedButton.classList.add('correct');
            totalScore += currentQuestion.points;
            // Opcional: Animar otras respuestas como incorrectas si se desea mostrar
            // but for simplicity, we just mark correct.
        } else {
            selectedButton.classList.remove('selected-answer'); // Quitar color de selección
            selectedButton.classList.add('incorrect');
            // Resaltar la respuesta correcta
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
            // Si hay más preguntas, ir a la pantalla de selección de preguntas
            generateQuestionSelectionButtons(); // Regenerar botones con el estado actualizado
            showScreen('questionSelectionScreen');
        } else {
            // Si no hay más preguntas, mostrar pantalla de resultado
            finalScoreDisplay.textContent = totalScore.toLocaleString(); 
            
            // --- LÍNEAS MODIFICADAS ---
            document.getElementById('hiddenScoreInput').value = totalScore;
            document.getElementById('hiddenNameInput').value = currentPlayerName;
            
            // Mensaje personalizado en la pantalla de resultados
            const resultMessage = document.getElementById('resultMessage');
            resultMessage.textContent = `¡Buen trabajo, ${currentPlayerName}!`;
            // --------------------------

            showScreen('resultScreen');

        }
    }

    // --- Reiniciar Juego ---
    function resetGame() {
        document.getElementById('scoreForm').reset();
        currentQuestionIndex = 0;
        totalScore = 0;
        selectedAnswer = null;
        currentPlayerName = ""; // Limpia la variable
        document.getElementById('playerNameInput').value = ""; 
        loadQuestions(); 
        showScreen('startScreen');
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', () => {
        currentPlayerName = playerNameInput.value.trim(); // Obtener el nombre
        
        if (currentPlayerName === "") {
            // Validación simple
            alert("Por favor, escribe tu nombre para empezar.");
            playerNameInput.focus();
        } else {
            // Si el nombre es válido, continuamos
        showScreen('questionSelectionScreen');
        }
    });

    goButton.addEventListener('click', () => {
        goButton.classList.add('hidden');
        quizContent.classList.remove('hidden');
    });

    nextQuestionButton.addEventListener('click', goToNextQuestion);
    playAgainButton.addEventListener('click', resetGame);

    // --- Netlify Form Submission Handler ---
    async function handleScoreSubmit(e) {
        e.preventDefault(); // ¡Esto EVITA el error 404!

        const formData = new FormData(scoreForm); // scoreForm debe estar definido arriba

        try {
            // Deshabilitar el botón
            saveScoreButton.disabled = true;
            saveScoreButton.textContent = "Guardando...";

            await fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData).toString()
            });

            // Éxito:
            saveScoreButton.textContent = "¡Puntaje Guardado!";

        } catch (error) {
            console.error("Error al enviar el puntaje:", error);
            alert("Hubo un error al guardar tu puntaje. Intenta de nuevo.");
            saveScoreButton.disabled = false;
            saveScoreButton.textContent = "Guardar en el Ranking";
        }
    }
    // --- End Netlify Handler ---
    
    // --- Inicio del Juego ---
    loadQuestions(); // Cargar las preguntas al iniciar
});