document.addEventListener('DOMContentLoaded', () => {
    // --- FUNCIONES DE SANITIZACIÓN Y SEGURIDAD ---
    
    /**
     * Sanitiza texto para prevenir XSS eliminando caracteres HTML peligrosos
     * @param {string} text - Texto a sanitizar
     * @returns {string} - Texto sanitizado
     */
    function sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Valida el nombre del jugador
     * @param {string} name - Nombre a validar
     * @returns {object} - {isValid: boolean, sanitized: string, error: string}
     */
    function validatePlayerName(name) {
        const trimmed = name.trim();
        
        // Validar longitud
        if (trimmed.length === 0) {
            return { isValid: false, sanitized: '', error: 'El nombre no puede estar vacío.' };
        }
        if (trimmed.length > 50) {
            return { isValid: false, sanitized: '', error: 'El nombre no puede tener más de 50 caracteres.' };
        }
        
        // Permitir solo letras, números, espacios y algunos caracteres especiales seguros
        const safePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_.]+$/;
        if (!safePattern.test(trimmed)) {
            return { isValid: false, sanitized: '', error: 'El nombre contiene caracteres no permitidos.' };
        }
        
        // Sanitizar el nombre
        const sanitized = sanitizeHTML(trimmed);
        return { isValid: true, sanitized, error: '' };
    }
    
    /**
     * Valida la estructura de una pregunta del JSON
     * @param {object} question - Objeto pregunta a validar
     * @returns {boolean} - true si es válida
     */
    function validateQuestion(question) {
        if (!question || typeof question !== 'object') return false;
        
        // Validar campos requeridos
        if (typeof question.id !== 'number' || question.id < 1) return false;
        if (typeof question.question !== 'string' || question.question.trim() === '') return false;
        if (typeof question.answer !== 'string' || question.answer.trim() === '') return false;
        if (typeof question.points !== 'number' || question.points < 0) return false;
        
        // Validar opciones
        if (!Array.isArray(question.options) || question.options.length !== 4) return false;
        
        // Validar que todas las opciones sean strings no vacíos
        for (const option of question.options) {
            if (typeof option !== 'string' || option.trim() === '') return false;
        }
        
        // Validar que la respuesta esté en las opciones
        if (!question.options.includes(question.answer)) return false;
        
        return true;
    }
    
    /**
     * Sanitiza el contenido de una pregunta
     * @param {object} question - Pregunta a sanitizar
     * @returns {object} - Pregunta sanitizada
     */
    function sanitizeQuestion(question) {
        return {
            id: question.id,
            question: sanitizeHTML(question.question),
            options: question.options.map(opt => sanitizeHTML(opt)),
            answer: sanitizeHTML(question.answer),
            points: question.points
        };
    }
    
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
            const rawQuestions = await response.json();
            
            // Validar que sea un array
            if (!Array.isArray(rawQuestions)) {
                throw new Error('El formato del archivo de preguntas es inválido.');
            }
            
            // Validar y sanitizar cada pregunta
            questions = [];
            for (const question of rawQuestions) {
                if (validateQuestion(question)) {
                    questions.push(sanitizeQuestion(question));
                } else {
                    console.warn('Pregunta inválida detectada y omitida:', question);
                }
            }
            
            // Verificar que haya al menos una pregunta válida
            if (questions.length === 0) {
                throw new Error('No se encontraron preguntas válidas en el archivo.');
            }
            
            console.log(`${questions.length} preguntas válidas cargadas y sanitizadas`);
            generateQuestionSelectionButtons();
        } catch (error) {
            console.error('Error al cargar las preguntas:', error);
            alert('No se pudieron cargar las preguntas del juego. Por favor, verifica el archivo questions.json');
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
            
            // Crear elementos de forma segura sin innerHTML
            const letterSpan = document.createElement('span');
            letterSpan.classList.add('answer-letter');
            letterSpan.textContent = getOptionLetter(option, questionData.options);
            
            const textSpan = document.createElement('span');
            textSpan.classList.add('answer-text');
            textSpan.textContent = option;
            
            button.appendChild(letterSpan);
            button.appendChild(textSpan);
            
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
            // --- MODIFICADO PARA PASAR DATOS SANITIZADOS AL FORMULARIO ---
            finalScoreDisplay.textContent = totalScore.toLocaleString();
            
            // Validar y sanitizar antes de asignar
            const sanitizedScore = Math.max(0, Math.floor(totalScore)); // Asegurar que sea un número positivo entero
            const sanitizedName = sanitizeHTML(currentPlayerName);
            
            // Poner los datos sanitizados en los campos ocultos
            hiddenScoreInput.value = sanitizedScore;
            hiddenNameInput.value = sanitizedName;
            
            // Mensaje personalizado usando textContent (seguro contra XSS)
            resultMessage.textContent = `¡Buen trabajo, ${sanitizedName}!`;
            
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

    // --- Netlify Form Submission Handler (MEJORADO CON VALIDACIÓN) ---
    const handleSubmit = (event) => {
        event.preventDefault(); // ¡Evita la recarga y el error 404!

        const myForm = event.target;
        const formData = new FormData(myForm);
        
        // Validar datos antes de enviar
        const nombre = formData.get('nombre');
        const puntaje = formData.get('puntaje');
        
        // Validar nombre
        const nameValidation = validatePlayerName(nombre);
        if (!nameValidation.isValid) {
            alert('Error: ' + nameValidation.error);
            return;
        }
        
        // Validar puntaje
        const scoreNum = parseInt(puntaje, 10);
        if (isNaN(scoreNum) || scoreNum < 0) {
            alert('Error: El puntaje no es válido.');
            return;
        }
        
        // Actualizar formData con valores sanitizados
        formData.set('nombre', nameValidation.sanitized);
        formData.set('puntaje', scoreNum.toString());

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
    
    // MODIFICADO para capturar y validar el nombre
    startButton.addEventListener('click', () => {
        const validation = validatePlayerName(playerNameInput.value);
        
        if (!validation.isValid) {
            alert(validation.error);
            playerNameInput.focus();
            return;
        }
        
        currentPlayerName = validation.sanitized;
        showScreen('questionSelectionScreen');
    });
    
    // Validación en tiempo real del nombre del jugador
    playerNameInput.addEventListener('input', (e) => {
        const value = e.target.value;
        const validation = validatePlayerName(value);
        
        // Cambiar el borde según la validez
        if (value.trim() === '') {
            playerNameInput.style.borderColor = '';
        } else if (!validation.isValid) {
            playerNameInput.style.border = '2px solid #DC3545';
            playerNameInput.title = validation.error;
        } else {
            playerNameInput.style.border = '2px solid #4CAF50';
            playerNameInput.title = 'Nombre válido';
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