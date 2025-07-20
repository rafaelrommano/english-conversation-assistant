import { useState, useEffect } from 'react'
import { TrendingUp, Award, Target, Calendar, MessageSquare, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

const ProgressDashboard = ({ user }) => {
  const [progressData, setProgressData] = useState([])
  const [insights, setInsights] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProgressData()
    fetchInsights()
  }, [user])

  const fetchProgressData = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/progress?days=14`)
      if (response.ok) {
        const data = await response.json()
        setProgressData(data)
      } else {
        // Dados mock para demonstração
        setProgressData(generateMockProgressData())
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
      setProgressData(generateMockProgressData())
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/insights`)
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      } else {
        setInsights(generateMockInsights())
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      setInsights(generateMockInsights())
    }
  }

  const generateMockProgressData = () => {
    const days = 14
    const data = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      data.push({
        date: date.toISOString().split('T')[0],
        vocabulary_score: Math.random() * 0.3 + 0.6 + (i * 0.01), // Trending up
        grammar_score: Math.random() * 0.3 + 0.5 + (i * 0.015),
        fluency_score: Math.random() * 0.3 + 0.55 + (i * 0.012),
        pronunciation_score: Math.random() * 0.3 + 0.45 + (i * 0.018),
        confidence_score: Math.random() * 0.3 + 0.5 + (i * 0.02),
        messages_sent: Math.floor(Math.random() * 15) + 5,
        conversation_duration: Math.floor(Math.random() * 30) + 10
      })
    }
    
    return data
  }

  const generateMockInsights = () => {
    return {
      overall_progress: "You're making fantastic progress! Your confidence has grown significantly over the past two weeks.",
      strengths: ["Natural conversation flow", "Rich vocabulary usage", "Consistent practice"],
      areas_for_improvement: ["Complex grammar structures", "Pronunciation of certain sounds"],
      achievements: ["Completed 14 days of consistent practice", "Improved confidence by 25%", "Learned 47 new words"],
      next_goals: ["Practice conditional sentences", "Work on 'th' sound pronunciation", "Expand business vocabulary"],
      motivation_message: "You're doing amazing! Your dedication is really paying off. Keep up this fantastic momentum!",
      learning_recommendations: ["Try discussing current events", "Practice describing complex situations", "Focus on storytelling"]
    }
  }

  const getCurrentScores = () => {
    if (progressData.length === 0) return null
    
    const latest = progressData[progressData.length - 1]
    return {
      vocabulary: Math.round(latest.vocabulary_score * 100),
      grammar: Math.round(latest.grammar_score * 100),
      fluency: Math.round(latest.fluency_score * 100),
      pronunciation: Math.round(latest.pronunciation_score * 100),
      confidence: Math.round(latest.confidence_score * 100)
    }
  }

  const getRadarData = () => {
    const scores = getCurrentScores()
    if (!scores) return []
    
    return [
      { skill: 'Vocabulary', score: scores.vocabulary, fullMark: 100 },
      { skill: 'Grammar', score: scores.grammar, fullMark: 100 },
      { skill: 'Fluency', score: scores.fluency, fullMark: 100 },
      { skill: 'Pronunciation', score: scores.pronunciation, fullMark: 100 },
      { skill: 'Confidence', score: scores.confidence, fullMark: 100 }
    ]
  }

  const getChartData = () => {
    return progressData.map((item, index) => ({
      day: `Day ${index + 1}`,
      date: item.date,
      vocabulary: Math.round(item.vocabulary_score * 100),
      grammar: Math.round(item.grammar_score * 100),
      fluency: Math.round(item.fluency_score * 100),
      confidence: Math.round(item.confidence_score * 100)
    }))
  }

  const getTotalStats = () => {
    if (progressData.length === 0) return { messages: 0, duration: 0, sessions: 0 }
    
    return {
      messages: progressData.reduce((sum, day) => sum + day.messages_sent, 0),
      duration: progressData.reduce((sum, day) => sum + day.conversation_duration, 0),
      sessions: progressData.length
    }
  }

  const scores = getCurrentScores()
  const stats = getTotalStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Motivational Header */}
      {insights && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Progress Journey</h3>
                <p className="text-gray-700 mb-3">{insights.motivation_message}</p>
                <div className="flex flex-wrap gap-2">
                  {insights.achievements.slice(0, 3).map((achievement, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-700">
                      🎉 {achievement}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Messages Sent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.messages}</p>
            <p className="text-xs text-gray-500 mt-1">Last 14 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Practice Time</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.duration}m</p>
            <p className="text-xs text-gray-500 mt-1">Total minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Active Days</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.sessions}</p>
            <p className="text-xs text-gray-500 mt-1">Consistency streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">Overall Score</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {scores ? Math.round((scores.vocabulary + scores.grammar + scores.fluency + scores.confidence) / 4) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Average improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skills Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Current Level"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Skill Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scores && Object.entries(scores).map(([skill, score]) => (
              <div key={skill} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{skill}</span>
                  <span className="text-sm text-gray-600">{score}%</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="vocabulary" stroke="#8b5cf6" strokeWidth={2} name="Vocabulary" />
                <Line type="monotone" dataKey="grammar" stroke="#06b6d4" strokeWidth={2} name="Grammar" />
                <Line type="monotone" dataKey="fluency" stroke="#10b981" strokeWidth={2} name="Fluency" />
                <Line type="monotone" dataKey="confidence" stroke="#f59e0b" strokeWidth={2} name="Confidence" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-green-500" />
                <span>Your Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.strengths.map((strength, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>Next Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.next_goals.map((goal, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{goal}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ProgressDashboard

