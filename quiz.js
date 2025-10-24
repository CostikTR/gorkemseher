// Quiz Game System
class QuizGame {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.difficulty = 'easy';
        this.timer = null;
        this.timeLeft = 30;
        this.startTime = null;
        this.totalTime = 0;
        this.loadQuestions();
        this.loadStats();
    }

    loadQuestions() {
        const saved = localStorage.getItem('quizQuestions');
        if (saved) {
            this.questions = JSON.parse(saved);
        } else {
            // Default questions
            this.questions = [
                {
                    id: Date.now() + 1,
                    question: "İlk buluşmamızda nereye gittik?",
                    correct: "Kahve dükkanı",
                    wrong1: "Sinemaya",
                    wrong2: "Parka",
                    wrong3: "Restoran"
                },
                {
                    id: Date.now() + 2,
                    question: "Hangi renk benim favorim?",
                    correct: "Mavi",
                    wrong1: "Kırmızı",
                    wrong2: "Yeşil",
                    wrong3: "Sarı"
                },
                {
                    id: Date.now() + 3,
                    question: "İlk öpüşmemiz nerede oldu?",
                    correct: "Parkta",
                    wrong1: "Arabada",
                    wrong2: "Evde",
                    wrong3: "Sinemada"
                },
                {
                    id: Date.now() + 4,
                    question: "En sevdiğim yemek nedir?",
                    correct: "Pizza",
                    wrong1: "Makarna",
                    wrong2: "Burger",
                    wrong3: "Sushi"
                },
                {
                    id: Date.now() + 5,
                    question: "Bana ilk hediye olarak ne aldın?",
                    correct: "Çiçek",
                    wrong1: "Çikolata",
                    wrong2: "Parfüm",
                    wrong3: "Kolye"
                }
            ];
            this.saveQuestions();
        }
    }

    saveQuestions() {
        localStorage.setItem('quizQuestions', JSON.stringify(this.questions));
    }

    loadStats() {
        const stats = localStorage.getItem('quizStats');
        if (stats) {
            this.stats = JSON.parse(stats);
        } else {
            this.stats = {
                totalPlays: 0,
                highScore: 0,
                totalQuestions: this.questions.length
            };
        }
    }

    saveStats() {
        this.stats.totalPlays++;
        if (this.score > this.stats.highScore) {
            this.stats.highScore = this.score;
        }
        this.stats.totalQuestions = this.questions.length;
        localStorage.setItem('quizStats', JSON.stringify(this.stats));
    }

    startGame(difficulty) {
        this.difficulty = difficulty;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.startTime = Date.now();
        
        // Shuffle questions
        this.shuffleArray(this.questions);
        
        // Limit questions based on difficulty
        const questionCounts = { easy: 5, medium: 10, hard: 15 };
        this.gameQuestions = this.questions.slice(0, Math.min(questionCounts[difficulty], this.questions.length));
        
        this.showScreen('game-screen');
        this.displayQuestion();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    displayQuestion() {
        if (this.currentQuestionIndex >= this.gameQuestions.length) {
            this.endGame();
            return;
        }

        const question = this.gameQuestions[this.currentQuestionIndex];
        
        // Update progress
        const progress = ((this.currentQuestionIndex + 1) / this.gameQuestions.length) * 100;
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        if (progressFill) progressFill.style.width = progress + '%';
        if (progressText) progressText.textContent = `Soru ${this.currentQuestionIndex + 1} / ${this.gameQuestions.length}`;

        // Display question
        const questionNumber = document.getElementById('question-number');
        const questionText = document.getElementById('question-text');
        if (questionNumber) questionNumber.textContent = `Soru ${this.currentQuestionIndex + 1}`;
        if (questionText) questionText.textContent = question.question;

        // Prepare answers
        const answers = [
            { text: question.correct, isCorrect: true },
            { text: question.wrong1, isCorrect: false },
            { text: question.wrong2, isCorrect: false },
            { text: question.wrong3, isCorrect: false }
        ];
        this.shuffleArray(answers);

        // Display answers
        const answersGrid = document.getElementById('answers-grid');
        if (answersGrid) {
            answersGrid.innerHTML = '';
            answers.forEach(answer => {
                const btn = document.createElement('button');
                btn.className = 'answer-btn';
                btn.textContent = answer.text;
                btn.onclick = () => this.checkAnswer(answer.isCorrect, btn);
                answersGrid.appendChild(btn);
            });
        }

        // Start timer
        this.timeLeft = 30;
        this.updateTimer();
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            if (this.timeLeft <= 0) {
                this.timeUp();
            }
        }, 1000);
    }

    updateTimer() {
        const timerValue = document.getElementById('timer-value');
        if (timerValue) {
            timerValue.textContent = this.timeLeft;
            if (this.timeLeft <= 10) {
                timerValue.style.color = '#ef4444';
            } else {
                timerValue.style.color = 'white';
            }
        }
    }

    checkAnswer(isCorrect, btn) {
        clearInterval(this.timer);
        
        // Disable all buttons
        const allBtns = document.querySelectorAll('.answer-btn');
        allBtns.forEach(b => b.style.pointerEvents = 'none');

        if (isCorrect) {
            btn.classList.add('correct');
            this.score += 10;
            this.correctAnswers++;
        } else {
            btn.classList.add('wrong');
            this.wrongAnswers++;
            // Show correct answer
            allBtns.forEach(b => {
                if (b !== btn && !b.classList.contains('wrong')) {
                    b.classList.add('correct');
                }
            });
        }

        // Next question after delay
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }, 1500);
    }

    timeUp() {
        clearInterval(this.timer);
        this.wrongAnswers++;
        
        // Show correct answer
        const allBtns = document.querySelectorAll('.answer-btn');
        allBtns.forEach(b => {
            b.style.pointerEvents = 'none';
            if (!b.classList.contains('wrong')) {
                b.classList.add('correct');
            }
        });

        setTimeout(() => {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }, 1500);
    }

    endGame() {
        this.totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        this.saveStats();
        
        // Calculate percentage
        const percentage = Math.round((this.score / (this.gameQuestions.length * 10)) * 100);
        
        // Determine badge
        let badge = '😊';
        let title = 'İyi Deneme!';
        if (percentage >= 90) {
            badge = '🏆';
            title = 'Mükemmel!';
        } else if (percentage >= 70) {
            badge = '⭐';
            title = 'Harika!';
        } else if (percentage >= 50) {
            badge = '👍';
            title = 'Fena Değil!';
        }

        // Display results
        const resultTitle = document.getElementById('result-title');
        const resultSubtitle = document.getElementById('result-subtitle');
        const scoreValue = document.getElementById('score-value');
        const scoreMax = document.getElementById('score-max');
        const scorePercentage = document.getElementById('score-percentage');
        const correctCount = document.getElementById('correct-count');
        const wrongCount = document.getElementById('wrong-count');
        const timeSpent = document.getElementById('time-spent');
        const resultBadge = document.getElementById('result-badge');

        if (resultTitle) resultTitle.textContent = title;
        if (resultSubtitle) resultSubtitle.textContent = `${this.gameQuestions.length} sorudan ${this.correctAnswers} doğru!`;
        if (scoreValue) scoreValue.textContent = this.score;
        if (scoreMax) scoreMax.textContent = ` / ${this.gameQuestions.length * 10}`;
        if (scorePercentage) scorePercentage.textContent = `(${percentage}%)`;
        if (correctCount) correctCount.textContent = this.correctAnswers;
        if (wrongCount) wrongCount.textContent = this.wrongAnswers;
        if (timeSpent) timeSpent.textContent = this.totalTime + 's';
        if (resultBadge) resultBadge.textContent = badge;

        this.showScreen('result-screen');
    }

    showScreen(screenId) {
        document.querySelectorAll('.quiz-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
        
        if (screenId === 'start-screen') {
            this.displayStats();
        } else if (screenId === 'manager-screen') {
            this.displayQuestions();
        }
    }

    displayStats() {
        const totalQuestionsEl = document.getElementById('total-questions');
        const highScoreEl = document.getElementById('high-score');
        const totalPlaysEl = document.getElementById('total-plays');

        if (totalQuestionsEl) totalQuestionsEl.textContent = this.questions.length;
        if (highScoreEl) highScoreEl.textContent = this.stats.highScore;
        if (totalPlaysEl) totalPlaysEl.textContent = this.stats.totalPlays;
    }

    addQuestion(questionData) {
        const newQuestion = {
            id: Date.now(),
            ...questionData
        };
        this.questions.push(newQuestion);
        this.saveQuestions();
        this.displayQuestions();
    }

    deleteQuestion(id) {
        this.questions = this.questions.filter(q => q.id !== id);
        this.saveQuestions();
        this.displayQuestions();
    }

    displayQuestions() {
        const questionsList = document.getElementById('questions-list');
        if (!questionsList) return;

        if (this.questions.length === 0) {
            questionsList.innerHTML = '<p style="text-align:center;opacity:0.7;">Henüz soru eklenmemiş. Yukarıdaki formu kullanarak soru ekleyin!</p>';
            return;
        }

        questionsList.innerHTML = '';
        this.questions.forEach(q => {
            const item = document.createElement('div');
            item.className = 'question-item';
            item.innerHTML = `
                <div class="question-content">
                    <h4>${q.question}</h4>
                    <div class="question-answers">
                        <span>✓ ${q.correct}</span> | 
                        <span>✗ ${q.wrong1}</span> | 
                        <span>✗ ${q.wrong2}</span> | 
                        <span>✗ ${q.wrong3}</span>
                    </div>
                </div>
                <button class="delete-question-btn" onclick="quiz.deleteQuestion(${q.id})">
                    🗑️ Sil
                </button>
            `;
            questionsList.appendChild(item);
        });
    }
}

// Initialize quiz
let quiz;

document.addEventListener('DOMContentLoaded', () => {
    quiz = new QuizGame();
    quiz.displayStats();

    // Difficulty buttons
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');

    if (easyBtn) easyBtn.onclick = () => quiz.startGame('easy');
    if (mediumBtn) mediumBtn.onclick = () => quiz.startGame('medium');
    if (hardBtn) hardBtn.onclick = () => quiz.startGame('hard');

    // Manager buttons
    const manageBtn = document.getElementById('manage-btn');
    const closeManagerBtn = document.getElementById('close-manager');
    
    if (manageBtn) manageBtn.onclick = () => quiz.showScreen('manager-screen');
    if (closeManagerBtn) closeManagerBtn.onclick = () => quiz.showScreen('start-screen');

    // Result buttons
    const playAgainBtn = document.getElementById('play-again-btn');
    const newDifficultyBtn = document.getElementById('new-difficulty-btn');
    const editQuestionsBtn = document.getElementById('edit-questions-btn');

    if (playAgainBtn) playAgainBtn.onclick = () => quiz.startGame(quiz.difficulty);
    if (newDifficultyBtn) newDifficultyBtn.onclick = () => quiz.showScreen('start-screen');
    if (editQuestionsBtn) editQuestionsBtn.onclick = () => quiz.showScreen('manager-screen');

    // Add question form
    const addQuestionForm = document.getElementById('add-question-form');
    if (addQuestionForm) {
        addQuestionForm.onsubmit = (e) => {
            e.preventDefault();
            
            const questionData = {
                question: document.getElementById('new-question').value.trim(),
                correct: document.getElementById('correct-answer').value.trim(),
                wrong1: document.getElementById('wrong-answer-1').value.trim(),
                wrong2: document.getElementById('wrong-answer-2').value.trim(),
                wrong3: document.getElementById('wrong-answer-3').value.trim()
            };

            // Validation
            if (!questionData.question || !questionData.correct || !questionData.wrong1 || !questionData.wrong2 || !questionData.wrong3) {
                alert('Lütfen tüm alanları doldurun!');
                return;
            }

            quiz.addQuestion(questionData);
            addQuestionForm.reset();
            
            // Show success message
            const btn = document.querySelector('.add-question-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Eklendi!';
            btn.style.background = 'rgba(74, 222, 128, 0.5)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        };
    }
});
