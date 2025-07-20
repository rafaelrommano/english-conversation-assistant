import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MessageCircle, User, BarChart3, Brain, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import ChatInterface from './components/ChatInterface.jsx'
import UserProfile from './components/UserProfile.jsx'
import ProgressDashboard from './components/ProgressDashboard.jsx'
import KnowledgeCloud from './components/KnowledgeCloud.jsx'
import './App.css'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')

  useEffect(() => {
    // Simula carregamento do usuário (em produção, viria de autenticação)
    const mockUser = {
      id: 1,
      username: 'learner',
      email: 'learner@example.com',
      english_level: 'intermediate',
      interests: ['travel', 'technology', 'movies'],
      goals: ['improve fluency', 'expand vocabulary', 'gain confidence']
    }
    setCurrentUser(mockUser)
  }, [])

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Welcome to Your English Assistant!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your personalized learning experience...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hey {currentUser.username}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Ready for another great conversation in English?
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.english_level} Level</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Progress</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Knowledge</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <ChatInterface user={currentUser} />
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <ProgressDashboard user={currentUser} />
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-4">
            <KnowledgeCloud user={currentUser} />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <UserProfile user={currentUser} onUserUpdate={setCurrentUser} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App

