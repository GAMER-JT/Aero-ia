import { createApp, ref, computed, watch, nextTick } from 'vue';
import { TokenManager } from './token-management.js';

createApp({
    setup() {
        // Generate a unique ID
        const generateId = () => {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        };

        // Initialize or retrieve chat history from localStorage
        const initChatHistory = () => {
            const savedHistory = localStorage.getItem('chatHistory');
            if (savedHistory) {
                return JSON.parse(savedHistory);
            } else {
                // Default first chat
                const initialChat = {
                    id: generateId(),
                    title: "New Conversation", 
                    messages: [
                        {
                            type: 'system',
                            content: `<p>I'm an AI assistant created by OpenAI. I'm designed to be helpful, harmless, and honest.</p><p>How can I help you today?</p>`
                        }
                    ]
                };
                return [initialChat];
            }
        };

        const chatHistory = ref(initChatHistory());
        const currentChatId = ref(chatHistory.value[0]?.id || null);
        const newMessage = ref('');
        
        // Save chat history to localStorage whenever it changes
        watch(chatHistory, (newHistory) => {
            localStorage.setItem('chatHistory', JSON.stringify(newHistory));
        }, { deep: true });

        // Get the current chat's messages
        const currentMessages = computed(() => {
            const currentChat = chatHistory.value.find(chat => chat.id === currentChatId.value);
            return currentChat ? currentChat.messages : [];
        });

        // Create a new chat
        const createNewChat = () => {
            const newChatId = generateId();
            chatHistory.value.unshift({
                id: newChatId,
                title: "New Conversation",
                messages: [
                    {
                        type: 'system',
                        content: `<p>I'm an AI assistant created by OpenAI. I'm designed to be helpful, harmless, and honest.</p><p>How can I help you today?</p>`
                    }
                ]
            });
            currentChatId.value = newChatId;
        };

        // Switch to a different chat
        const switchChat = (chatId) => {
            currentChatId.value = chatId;
        };

        // New function to get device context
        const getDeviceContext = () => {
            return {
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                time: new Date().toLocaleString(),
                platform: navigator.platform,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            };
        };

        // Enhanced internet search capability
        const searchInternet = async (query) => {
            try {
                const response = await fetch(`https://www.googleapis.com/customsearch/v1`, {
                    method: 'GET',
                    params: {
                        key: 'YOUR_GOOGLE_SEARCH_API_KEY', // Replace with actual API key
                        cx: 'YOUR_CUSTOM_SEARCH_ENGINE_ID', // Replace with actual search engine ID
                        q: query,
                        num: 3 // Limit to 3 results
                    }
                });
                const data = await response.json();
                return data.items.map(item => ({
                    title: item.title,
                    link: item.link,
                    snippet: item.snippet
                }));
            } catch (error) {
                console.error('Internet search failed:', error);
                return null;
            }
        };

        // Emotional Intelligence Layer
        const generateEmotionalResponse = (aiResponse, userMessage) => {
            const emotions = {
                happy: ['genial', 'increíble', 'emocionante', 'maravilloso'],
                sad: ['difícil', 'desafiante', 'triste', 'complicado'],
                neutral: ['interesante', 'bien', 'entendido']
            };

            // Detect emotional tone of user message in Spanish
            const detectEmotion = (message) => {
                const lowerMessage = message.toLowerCase();
                if (emotions.happy.some(word => lowerMessage.includes(word))) return '😊';
                if (emotions.sad.some(word => lowerMessage.includes(word))) return '😔';
                return '😐';
            };

            const emotionalTone = detectEmotion(userMessage);
            
            // Remove the context line and ensure response is in Spanish
            return `${emotionalTone} ${aiResponse}`;
        };

        // Updated Gemini API Configuration for Gemini 2.0 Flash
        const GEMINI_API_KEY = 'AIzaSyC9sSKNH8DPdjYFOpRioAgk6B7k4ZnS0c4';
        const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

        // Token management
        const tokenCount = ref(150);  // Initial token count
        const showTokenWarning = ref(false);

        const deductTokens = (amount) => {
            tokenCount.value = Math.max(0, tokenCount.value - amount);
            
            // If tokens reach 0, show warning
            if (tokenCount.value === 0) {
                showTokenWarning.value = true;
            }
        };

        const showSolanaPaymentModal = ref(false);
        const solanaPaymentAmount = ref(0);
        const paymentProofImage = ref(null);

        const initiateSolanaPayment = (amount) => {
            solanaPaymentAmount.value = amount;
            showSolanaPaymentModal.value = true;
        };

        const handlePaymentProofUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    paymentProofImage.value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        const confirmSolanaPayment = async () => {
            if (!paymentProofImage.value) {
                alert('Por favor, sube un comprobante de pago.');
                return;
            }

            try {
                // Simulated payment verification
                const paymentVerification = await TokenManager.verifyPayment();
                
                if (paymentVerification.success) {
                    // Add tokens
                    tokenCount.value += solanaPaymentAmount.value;
                    
                    // Reset modals and state
                    showSolanaPaymentModal.value = false;
                    showTokenWarning.value = false;
                    paymentProofImage.value = null;
                    
                    // Show success message
                    alert(`¡Compra de ${solanaPaymentAmount.value} tokens confirmada con Solana!`);
                } else {
                    alert('Verificación de pago fallida. Por favor, intenta de nuevo.');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                alert('Hubo un problema con la verificación del pago.');
            }
        };

        const purchaseTokens = (amount) => {
            initiateSolanaPayment(amount);
        };

        const closeTokenWarning = () => {
            showTokenWarning.value = false;
        };

        // Typing state
        const isTyping = ref(false);
        const typingTimeout = ref(null);

        // Enhanced input handling to show typing indicator
        const handleInput = () => {
            // Clear previous timeout
            if (typingTimeout.value) {
                clearTimeout(typingTimeout.value);
            }

            // Set typing state
            isTyping.value = true;

            // Set timeout to stop typing after 2 seconds of no input
            typingTimeout.value = setTimeout(() => {
                isTyping.value = false;
            }, 2000);
        };

        // Modify existing sendMessage to include typing logic
        const sendMessage = async () => {
            // Stop typing when message is sent
            isTyping.value = false;
            
            if (typingTimeout.value) {
                clearTimeout(typingTimeout.value);
            }

            if (!newMessage.value.trim()) return;
            
            // Check if there are enough tokens
            if (tokenCount.value <= 0) {
                showTokenWarning.value = true;
                return;
            }

            // Deduct tokens based on message length
            const tokenCost = Math.ceil(newMessage.value.length / 10);  // Adjust cost calculation
            deductTokens(tokenCost);

            const currentChat = chatHistory.value.find(chat => chat.id === currentChatId.value);
            
            if (!currentChat) return;
            
            // Add user message
            currentChat.messages.push({
                type: 'user',
                content: `<p>${newMessage.value}</p>`
            });
            
            // Update chat title if this is the first user message
            if (currentChat.title === "New Conversation") {
                currentChat.title = newMessage.value.substring(0, 30) + (newMessage.value.length > 30 ? '...' : '');
            }
            
            // Store user message
            const userMessage = newMessage.value;
            newMessage.value = '';
            
            // Scroll to bottom
            await nextTick();
            scrollToBottom();
            
            try {
                // Add loading indicator
                currentChat.messages.push({
                    type: 'system',
                    content: `<p>🤔 Thinking deeply...</p>`
                });
                await nextTick();
                scrollToBottom();

                // Prepare context
                const deviceContext = getDeviceContext();
                const internetSearchResults = await searchInternet(userMessage);

                // Fetch Gemini API response with enhanced context
                const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ 
                                text: `Contexto:
- Consulta del usuario: ${userMessage}
- Hora del dispositivo: ${deviceContext.time}
- Zona horaria: ${deviceContext.timezone}
- Idioma: ${deviceContext.language}

Resultados opcionales de búsqueda en Internet:
${internetSearchResults ? internetSearchResults.map(r => `• ${r.title}: ${r.snippet}`).join('\n') : 'No hay resultados de búsqueda en internet'}

Por favor, proporciona una respuesta en español, humana, contextualmente consciente e inteligente emocionalmente.`
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.8,
                            maxOutputTokens: 2048,
                            topP: 0.95,
                            topK: 64,
                            // Add a directive to ensure Spanish output
                            stop_sequences: ['En inglés:']
                        }
                    })
                });

                // Remove loading indicator
                currentChat.messages.pop();

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Gemini API request failed: ${errorBody}`);
                }

                const data = await response.json();
                const aiResponse = data.candidates[0].content.parts[0].text;

                // Add AI response with emotional intelligence
                const emotionalResponse = generateEmotionalResponse(aiResponse, userMessage);

                currentChat.messages.push({
                    type: 'system',
                    content: `<p>${emotionalResponse}</p>`
                });
                
                // Scroll to bottom after response
                await nextTick();
                scrollToBottom();

            } catch (error) {
                console.error('Enhanced AI interaction failed:', error);
                
                currentChat.messages.push({
                    type: 'system',
                    content: `<p>🤷‍♀️ Oops! Something went wrong. I'm feeling a bit challenged right now. ${error.message}</p>`
                });
                
                await nextTick();
                scrollToBottom();
            }
        };

        // Scroll chat to bottom
        const chatContainer = ref(null);
        const scrollToBottom = () => {
            if (chatContainer.value) {
                chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
            }
        };
        
        // Auto-adjust textarea height
        const adjustTextareaHeight = (event) => {
            const textarea = event.target;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        };

        // Delete a specific chat
        const deleteChat = (chatId) => {
            // Prevent deleting if there's only one chat
            if (chatHistory.value.length <= 1) {
                // Optional: You could add a toast/alert to inform user they can't delete the last chat
                return;
            }

            // Remove the chat from history
            const index = chatHistory.value.findIndex(chat => chat.id === chatId);
            chatHistory.value.splice(index, 1);

            // If the deleted chat was the current chat, switch to the first chat
            if (currentChatId.value === chatId) {
                currentChatId.value = chatHistory.value[0]?.id || null;
            }
        };

        // New method to clear entire chat history
        const clearChatHistory = () => {
            // Confirm before clearing with Spanish translation
            const confirmClear = confirm('¿Estás seguro de que quieres eliminar todo el historial de chat? Esta acción no se puede deshacer.');
            
            if (confirmClear) {
                // Create a new default chat
                const initialChat = {
                    id: generateId(),
                    title: "Nueva Conversación", 
                    messages: [
                        {
                            type: 'system',
                            content: `<p>Soy un asistente de IA creado para ser útil, honesto y amable.</p><p>¿En qué puedo ayudarte hoy?</p>`
                        }
                    ]
                };

                // Reset chat history to just the initial chat
                chatHistory.value = [initialChat];
                
                // Set current chat to the new chat
                currentChatId.value = initialChat.id;

                // Clear localStorage
                localStorage.removeItem('chatHistory');
            }
        };

        // Theme management
        const currentTheme = ref(localStorage.getItem('theme') || 'dark');
        const isMenuOpen = ref(false);

        // Theme setter
        const setTheme = (theme) => {
            currentTheme.value = theme;
            localStorage.setItem('theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
        };

        // Toggle menu
        const toggleMenu = () => {
            isMenuOpen.value = !isMenuOpen.value;
        };

        // Apply theme on initial load
        watch(currentTheme, () => {
            const body = document.body;
            if (currentTheme.value === 'light') {
                body.classList.add('light-theme');
                body.classList.remove('dark-theme');
            } else {
                body.classList.add('dark-theme');
                body.classList.remove('light-theme');
            }
        }, { immediate: true });

        // Add subtle message entry/exit animations
        const messageTransition = {
            name: 'message',
            enter(el, done) {
                const animation = el.animate([
                    { opacity: 0, transform: 'translateY(20px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], {
                    duration: 300,
                    easing: 'ease-out'
                });
                animation.onfinish = done;
            },
            leave(el, done) {
                const animation = el.animate([
                    { opacity: 1, transform: 'translateY(0)' },
                    { opacity: 0, transform: 'translateY(20px)' }
                ], {
                    duration: 300,
                    easing: 'ease-in'
                });
                animation.onfinish = done;
            }
        };

        const getPriceForTokens = (amount) => TokenManager.getPriceForTokens(amount);

        const simulateSolanaPaymentVerification = () => TokenManager.verifyPayment();

        const generateTransactionId = () => TokenManager.generateTransactionId();

        return {
            chatHistory,
            currentChatId,
            currentMessages,
            newMessage,
            chatContainer,
            createNewChat,
            switchChat,
            sendMessage,
            adjustTextareaHeight,
            deleteChat,
            clearChatHistory,
            getDeviceContext,
            searchInternet,
            generateEmotionalResponse,
            currentTheme,
            isMenuOpen,
            setTheme,
            toggleMenu,
            tokenCount,
            showTokenWarning,
            deductTokens,
            purchaseTokens,
            closeTokenWarning,
            showSolanaPaymentModal,
            solanaPaymentAmount,
            paymentProofImage,
            initiateSolanaPayment,
            handlePaymentProofUpload,
            confirmSolanaPayment,
            getPriceForTokens,
            isTyping,
            handleInput,
            messageTransition,
        };
    }
}).mount('#app');