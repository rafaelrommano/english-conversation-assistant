import { useState, useEffect } from 'react'
import { Volume2, Target, BookOpen, TrendingUp, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'

const PronunciationFeedback = ({ user, messageText, onClose }) => {
  const [feedback, setFeedback] = useState(null)
  const [exercises, setExercises] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (messageText) {
      fetchPronunciationFeedback()
    }
  }, [messageText, user])

  const fetchPronunciationFeedback = async () => {
    try {
      setIsLoading(true)
      
      // Busca feedback detalhado
      const feedbackResponse = await fetch(`/api/users/${user.id}/speech-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messageText,
          context: 'conversation'
        })
      })

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json()
        setFeedback(feedbackData)

        // Busca exercícios personalizados se há sons difíceis
        const difficultSounds = feedbackData.pronunciation?.sound_focus_areas?.map(area => area.sound) || []
        
        if (difficultSounds.length > 0) {
          const exercisesResponse = await fetch(`/api/users/${user.id}/pronunciation-exercises`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              difficult_sounds: difficultSounds
            })
          })

          if (exercisesResponse.ok) {
            const exercisesData = await exercisesResponse.json()
            setExercises(exercisesData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching pronunciation feedback:', error)
      // Fallback com dados mock
      setFeedback(generateMockFeedback())
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockFeedback = () => {
    return {
      pronunciation: {
        overall_score: 0.75,
        difficult_words: [
          {
            word: "pronunciation",
            phonetic: "/prəˌnʌnsiˈeɪʃən/",
            difficulty: "medium",
            tips: "Break it down: pro-nun-ci-a-tion"
          }
        ],
        sound_focus_areas: [
          {
            sound: "/θ/",
            description: "The 'th' sound as in 'think'",
            practice_words: ["think", "thank", "three"],
            tip: "Put your tongue between your teeth and blow air gently"
          }
        ],
        encouragement: "Great job! Your pronunciation is getting clearer!"
      },
      overall_assessment: {
        strengths: "Clear vowel sounds and good rhythm",
        focus_areas: ["/θ/", "/r/"],
        next_steps: ["Practice tongue twisters", "Work on word stress"]
      },
      personalized_tips: [
        "Practice the /θ/ sound with: think, thank, three",
        "Record yourself speaking to track your progress",
        "Practice a little bit every day for best results"
      ]
    }
  }

  const speakWord = (word, phonetic = '') => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true)
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.7
      utterance.pitch = 1.0
      
      utterance.onend = () => {
        setIsPlaying(false)
      }
      
      speechSynthesis.speak(utterance)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score) => {
    if (score >= 0.8) return 'Excellent'
    if (score >= 0.6) return 'Good'
    return 'Needs Practice'
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span>Analyzing your pronunciation...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!feedback) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="w-6 h-6 text-blue-500" />
              <span>Pronunciation Feedback</span>
            </CardTitle>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Here's detailed feedback on your pronunciation and speaking patterns
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sounds">Sounds</TabsTrigger>
              <TabsTrigger value="words">Words</TabsTrigger>
              <TabsTrigger value="exercises">Practice</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Overall Score */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Overall Pronunciation Score</h3>
                      <p className="text-sm text-gray-600">Based on your recent message</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(feedback.pronunciation.overall_score)}`}>
                        {Math.round(feedback.pronunciation.overall_score * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {getScoreLabel(feedback.pronunciation.overall_score)}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={feedback.pronunciation.overall_score * 100} 
                    className="mt-3"
                  />
                </CardContent>
              </Card>

              {/* Encouragement */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800">Great Progress!</h4>
                      <p className="text-green-700 text-sm mt-1">
                        {feedback.pronunciation.encouragement}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personalized Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personalized Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feedback.personalized_tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sounds" className="space-y-4">
              <div className="grid gap-4">
                {feedback.pronunciation.sound_focus_areas?.map((sound, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{sound.sound}</h4>
                          <p className="text-sm text-gray-600">{sound.description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => speakWord(sound.practice_words[0])}
                          disabled={isPlaying}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Practice Words:</h5>
                          <div className="flex flex-wrap gap-2">
                            {sound.practice_words.map((word, wordIndex) => (
                              <Button
                                key={wordIndex}
                                variant="outline"
                                size="sm"
                                onClick={() => speakWord(word)}
                                className="text-xs"
                              >
                                {word}
                                <Volume2 className="w-3 h-3 ml-1" />
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm mb-1">💡 Tip:</h5>
                          <p className="text-sm text-blue-800">{sound.tip}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="words" className="space-y-4">
              <div className="grid gap-4">
                {feedback.pronunciation.difficult_words?.map((word, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{word.word}</h4>
                          <p className="text-sm text-gray-600 font-mono">{word.phonetic}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={word.difficulty === 'hard' ? 'destructive' : 
                                        word.difficulty === 'medium' ? 'default' : 'secondary'}>
                            {word.difficulty}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => speakWord(word.word)}
                          >
                            <Volume2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <h5 className="font-medium text-sm mb-1">💡 How to improve:</h5>
                        <p className="text-sm text-yellow-800">{word.tips}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="exercises" className="space-y-4">
              {exercises ? (
                <div className="space-y-6">
                  {/* Warm-up Exercises */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-orange-500" />
                        <span>Warm-up Exercises</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {exercises.warm_up_exercises?.map((exercise, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">{exercise.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {exercise.examples.map((example, exIndex) => (
                              <Badge key={exIndex} variant="outline" className="font-mono">
                                {example}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Daily Practice Plan */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-green-500" />
                        <span>Daily Practice Plan</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Recommended Duration</h4>
                          <p className="text-sm text-gray-600">{exercises.daily_practice_plan?.duration}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Practice Sequence</h4>
                          <ol className="list-decimal list-inside space-y-1">
                            {exercises.daily_practice_plan?.sequence?.map((step, index) => (
                              <li key={index} className="text-sm text-gray-600">{step}</li>
                            ))}
                          </ol>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-semibold mb-1">📈 Progress Tracking</h4>
                          <p className="text-sm text-blue-800">
                            {exercises.daily_practice_plan?.progress_tracking}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">
                      Keep practicing! Personalized exercises will be generated based on your pronunciation patterns.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default PronunciationFeedback

