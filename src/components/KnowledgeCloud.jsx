import { useState, useEffect } from 'react'
import { Brain, BookOpen, MessageCircle, Lightbulb, Star, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'

const KnowledgeCloud = ({ user }) => {
  const [knowledgeItems, setKnowledgeItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchKnowledgeItems()
  }, [user])

  const fetchKnowledgeItems = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/knowledge`)
      if (response.ok) {
        const data = await response.json()
        setKnowledgeItems(data)
      } else {
        setKnowledgeItems(generateMockKnowledgeItems())
      }
    } catch (error) {
      console.error('Error fetching knowledge items:', error)
      setKnowledgeItems(generateMockKnowledgeItems())
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockKnowledgeItems = () => {
    const words = [
      { content: 'amazing', type: 'word', mastery: 0.9, category: 'adjectives', difficulty: 'easy' },
      { content: 'sophisticated', type: 'word', mastery: 0.7, category: 'adjectives', difficulty: 'medium' },
      { content: 'nevertheless', type: 'word', mastery: 0.6, category: 'connectors', difficulty: 'hard' },
      { content: 'breakthrough', type: 'word', mastery: 0.8, category: 'nouns', difficulty: 'medium' },
      { content: 'accomplish', type: 'word', mastery: 0.85, category: 'verbs', difficulty: 'medium' },
      { content: 'fascinating', type: 'word', mastery: 0.75, category: 'adjectives', difficulty: 'medium' },
      { content: 'opportunity', type: 'word', mastery: 0.9, category: 'nouns', difficulty: 'easy' },
      { content: 'challenge', type: 'word', mastery: 0.95, category: 'nouns', difficulty: 'easy' },
      { content: 'incredible', type: 'word', mastery: 0.8, category: 'adjectives', difficulty: 'easy' },
      { content: 'experience', type: 'word', mastery: 0.92, category: 'nouns', difficulty: 'easy' },
      { content: 'technology', type: 'word', mastery: 0.88, category: 'nouns', difficulty: 'easy' },
      { content: 'environment', type: 'word', mastery: 0.7, category: 'nouns', difficulty: 'medium' },
      { content: 'definitely', type: 'word', mastery: 0.65, category: 'adverbs', difficulty: 'medium' },
      { content: 'particularly', type: 'word', mastery: 0.6, category: 'adverbs', difficulty: 'hard' },
      { content: 'conversation', type: 'word', mastery: 0.95, category: 'nouns', difficulty: 'easy' }
    ]

    const phrases = [
      { content: 'break the ice', type: 'phrase', mastery: 0.8, category: 'idioms', difficulty: 'medium' },
      { content: 'piece of cake', type: 'phrase', mastery: 0.9, category: 'idioms', difficulty: 'easy' },
      { content: 'hit the nail on the head', type: 'phrase', mastery: 0.6, category: 'idioms', difficulty: 'hard' },
      { content: 'in my opinion', type: 'phrase', mastery: 0.95, category: 'expressions', difficulty: 'easy' },
      { content: 'on the other hand', type: 'phrase', mastery: 0.85, category: 'connectors', difficulty: 'medium' }
    ]

    const topics = [
      { content: 'travel', type: 'topic', mastery: 0.9, category: 'conversation_topics', difficulty: 'easy' },
      { content: 'technology', type: 'topic', mastery: 0.8, category: 'conversation_topics', difficulty: 'medium' },
      { content: 'movies', type: 'topic', mastery: 0.85, category: 'conversation_topics', difficulty: 'easy' },
      { content: 'food', type: 'topic', mastery: 0.92, category: 'conversation_topics', difficulty: 'easy' },
      { content: 'career', type: 'topic', mastery: 0.7, category: 'conversation_topics', difficulty: 'medium' }
    ]

    return [...words, ...phrases, ...topics].map((item, index) => ({
      id: index + 1,
      ...item,
      times_encountered: Math.floor(Math.random() * 20) + 5,
      times_used_correctly: Math.floor(Math.random() * 15) + 3,
      last_encountered: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }))
  }

  const getItemsByType = (type) => {
    return knowledgeItems.filter(item => type === 'all' || item.item_type === type)
  }

  const getKnowledgeStats = () => {
    const total = knowledgeItems.length
    const wellMastered = knowledgeItems.filter(item => item.mastery_level >= 0.8).length
    const avgMastery = knowledgeItems.reduce((sum, item) => sum + item.mastery_level, 0) / total
    
    const byType = knowledgeItems.reduce((acc, item) => {
      acc[item.item_type] = (acc[item.item_type] || 0) + 1
      return acc
    }, {})

    return { total, wellMastered, avgMastery, byType }
  }

  const getMasteryColor = (mastery) => {
    if (mastery >= 0.8) return 'bg-green-500'
    if (mastery >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getMasteryLabel = (mastery) => {
    if (mastery >= 0.8) return 'Mastered'
    if (mastery >= 0.6) return 'Learning'
    return 'Beginner'
  }

  const getFontSize = (mastery, baseSize = 14) => {
    return Math.max(baseSize, baseSize + (mastery * 20))
  }

  const WordCloud = ({ items }) => {
    return (
      <div className="flex flex-wrap gap-3 p-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative group cursor-pointer transition-all duration-200 hover:scale-110"
            style={{
              fontSize: `${getFontSize(item.mastery_level)}px`,
              opacity: 0.7 + (item.mastery_level * 0.3)
            }}
          >
            <span
              className={`px-3 py-1 rounded-full text-white font-medium shadow-lg ${
                item.mastery_level >= 0.8 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                item.mastery_level >= 0.6 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                'bg-gradient-to-r from-red-400 to-red-600'
              }`}
            >
              {item.content}
            </span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              <div className="text-center">
                <div className="font-semibold">{item.content}</div>
                <div className="text-gray-300">
                  {getMasteryLabel(item.mastery_level)} • {Math.round(item.mastery_level * 100)}%
                </div>
                <div className="text-gray-400 text-xs">
                  Used {item.times_used_correctly}/{item.times_encountered} times
                </div>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const stats = getKnowledgeStats()

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
      {/* Knowledge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">In your knowledge base</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">Well Mastered</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.wellMastered}</p>
            <p className="text-xs text-gray-500 mt-1">80%+ mastery level</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Avg Mastery</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {Math.round(stats.avgMastery * 100)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Overall progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Words</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.byType.word || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Vocabulary items</p>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Cloud */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-500" />
            <span>Your Knowledge Cloud</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Larger and brighter items indicate higher mastery levels. Hover over items to see details!
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="word">Words</TabsTrigger>
              <TabsTrigger value="phrase">Phrases</TabsTrigger>
              <TabsTrigger value="topic">Topics</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <WordCloud items={getItemsByType('all')} />
            </TabsContent>

            <TabsContent value="word" className="mt-6">
              <WordCloud items={getItemsByType('word')} />
            </TabsContent>

            <TabsContent value="phrase" className="mt-6">
              <WordCloud items={getItemsByType('phrase')} />
            </TabsContent>

            <TabsContent value="topic" className="mt-6">
              <WordCloud items={getItemsByType('topic')} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mastery Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mastery Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Mastered (80%+)</span>
                </span>
                <span className="text-sm text-gray-600">{stats.wellMastered} items</span>
              </div>
              <Progress 
                value={(stats.wellMastered / stats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Learning (60-79%)</span>
                </span>
                <span className="text-sm text-gray-600">
                  {knowledgeItems.filter(item => item.mastery_level >= 0.6 && item.mastery_level < 0.8).length} items
                </span>
              </div>
              <Progress 
                value={(knowledgeItems.filter(item => item.mastery_level >= 0.6 && item.mastery_level < 0.8).length / stats.total) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Beginner (&lt;60%)</span>
                </span>
                <span className="text-sm text-gray-600">
                  {knowledgeItems.filter(item => item.mastery_level < 0.6).length} items
                </span>
              </div>
              <Progress 
                value={(knowledgeItems.filter(item => item.mastery_level < 0.6).length / stats.total) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {knowledgeItems
                .sort((a, b) => new Date(b.last_encountered) - new Date(a.last_encountered))
                .slice(0, 8)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getMasteryColor(item.mastery_level)}`}></div>
                      <span className="text-sm font-medium">{item.content}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.item_type}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(item.mastery_level * 100)}%
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default KnowledgeCloud

