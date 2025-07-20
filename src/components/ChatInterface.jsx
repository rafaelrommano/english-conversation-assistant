import { useState, useEffect, useRef } from 'react'
import { Send, Mic, MicOff, Volume2, Heart, Sparkles, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import PronunciationFeedback from './PronunciationFeedback.jsx'

const ChatInterface = ({ user }) => {
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentConversation, setCurrentConversation] = useState(null)
  const [showPronunciationFeedback, setShowPronunciationFeedback] = useState(false)
  const [selectedMessageForFeedback, setSelectedMessageForFeedback] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Inicia uma nova conversa quando o componente é montado
    startNewConversation()
  }, [user])

  const startNewConversation = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentConversation(data.conversation)
        setMessages([{
          id: data.starter_message.id,
          sender: 'assistant',
          content: data.starter_message.content,
          timestamp: new Date(data.starter_message.timestamp),
          isWelcome: true
        }])
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      // Fallback para mensagem de boas-vindas
      setMessages([{
        id: 'welcome',
        sender: 'assistant',
        content: "Hey there! How's your day going? I'm so excited to chat with you and help you practice your English! 😊",
        timestamp: new Date(),
        isWelcome: true
      }])
    }
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: currentMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      if (currentConversation) {
        const response = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: currentMessage
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          const assistantMessage = {
            id: data.assistant_message.id,
            sender: 'assistant',
            content: data.assistant_message.content,
            timestamp: new Date(data.assistant_message.timestamp),
            analysis: data.analysis
          }

          setMessages(prev => [...prev, assistantMessage])
        } else {
          throw new Error('Failed to send message')
        }
      } else {
        // Fallback se não houver conversa ativa
        setTimeout(() => {
          const responses = [
            "That's really interesting! Tell me more about that. I love hearing your thoughts! 🌟",
            "Wow, you're doing great with your English! Keep going, I'm really enjoying our conversation! 💫",
            "That sounds amazing! I can tell you're getting more confident. What else would you like to share? ✨",
            "You're expressing yourself so well! I'm proud of your progress. What's on your mind next? 🎉"
          ]
          
          const randomResponse = responses[Math.floor(Math.random() * responses.length)]
          
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'assistant',
            content: randomResponse,
            timestamp: new Date()
          }])
        }, 1000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        content: "I'm sorry, I'm having some technical difficulties right now. But don't worry, we can keep chatting! Could you try again? 😊",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      if (!isListening) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          setIsListening(true)
        }
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setCurrentMessage(transcript)
          setIsListening(false)
        }
        
        recognition.onerror = () => {
          setIsListening(false)
        }
        
        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognition.start()
      } else {
        setIsListening(false)
      }
    } else {
      alert('Speech recognition is not supported in your browser.')
    }
  }

  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.pitch = 1.1
      speechSynthesis.speak(utterance)
    }
  }

  const openPronunciationFeedback = (messageText) => {
    setSelectedMessageForFeedback(messageText)
    setShowPronunciationFeedback(true)
  }

  const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user'
    const hasAnalysis = message.analysis && Object.keys(message.analysis).length > 0

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : message.isWelcome
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
            }`}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
            
            {/* Botões de ação */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="flex items-center space-x-1">
                {isUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPronunciationFeedback(message.content)}
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    title="Analyze pronunciation"
                  >
                    <Headphones className="w-3 h-3" />
                  </Button>
                )}
                {!isUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakMessage(message.content)}
                    className={`h-6 w-6 p-0 ${
                      message.isWelcome ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Volume2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Análise da mensagem do usuário */}
          {hasAnalysis && (
            <div className="mt-2 space-y-2">
              {message.analysis.positive_aspects && message.analysis.positive_aspects.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {message.analysis.positive_aspects.slice(0, 2).map((aspect, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700">
                      <Heart className="w-3 h-3 mr-1" />
                      {aspect}
                    </Badge>
                  ))}
                </div>
              )}
              
              {message.analysis.confidence_score && (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-gray-600">
                    Confidence: {Math.round(message.analysis.confidence_score * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Conversation with your English Assistant</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here... or use the mic! 🎤"
                  className="pr-12"
                  disabled={isLoading}
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleListening}
                className={`${isListening ? 'bg-red-100 border-red-300' : 'hover:bg-gray-100'}`}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-red-600" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Click the mic to speak • Click 🎧 on your messages for pronunciation feedback! 💪
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pronunciation Feedback Modal */}
      {showPronunciationFeedback && (
        <PronunciationFeedback
          user={user}
          messageText={selectedMessageForFeedback}
          onClose={() => setShowPronunciationFeedback(false)}
        />
      )}
    </>
  )
}

export default ChatInterface

