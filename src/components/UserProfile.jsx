import { useState, useEffect } from 'react'
import { User, Edit3, Save, X, Plus, Target, Heart, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'

const UserProfile = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    english_level: '',
    interests: [],
    goals: [],
    learning_style: {}
  })
  const [newInterest, setNewInterest] = useState('')
  const [newGoal, setNewGoal] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        english_level: user.english_level || 'beginner',
        interests: user.interests || [],
        goals: user.goals || [],
        learning_style: user.learning_style || {}
      })
    }
  }, [user])

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        onUserUpdate(updatedUser)
        setIsEditing(false)
      } else {
        console.error('Failed to update user profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    setFormData({
      username: user.username || '',
      email: user.email || '',
      english_level: user.english_level || 'beginner',
      interests: user.interests || [],
      goals: user.goals || [],
      learning_style: user.learning_style || {}
    })
    setIsEditing(false)
  }

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }))
      setNewInterest('')
    }
  }

  const removeInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  const addGoal = () => {
    if (newGoal.trim() && !formData.goals.includes(newGoal.trim())) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()]
      }))
      setNewGoal('')
    }
  }

  const removeGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g !== goal)
    }))
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700 border-green-200'
      case 'intermediate': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'advanced': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getLevelDescription = (level) => {
    switch (level) {
      case 'beginner': return 'Just starting your English journey! 🌱'
      case 'intermediate': return 'Making great progress! 🚀'
      case 'advanced': return 'Almost fluent! Keep polishing! ✨'
      default: return 'Ready to learn! 💪'
    }
  }

  const suggestedInterests = [
    'Travel', 'Technology', 'Movies', 'Music', 'Sports', 'Food', 'Books', 'Art',
    'Science', 'History', 'Fashion', 'Gaming', 'Photography', 'Cooking', 'Fitness'
  ]

  const suggestedGoals = [
    'Improve fluency', 'Expand vocabulary', 'Better pronunciation', 'Gain confidence',
    'Pass English exam', 'Business English', 'Academic writing', 'Casual conversation',
    'Travel preparation', 'Job interview skills'
  ]

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{formData.username}</h2>
                <p className="text-gray-600">{formData.email}</p>
                <Badge className={`mt-2 ${getLevelColor(formData.english_level)}`}>
                  {formData.english_level} Level
                </Badge>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white/50 rounded-lg">
            <p className="text-sm text-gray-700">
              {getLevelDescription(formData.english_level)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-500" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              {isEditing ? (
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">{formData.username}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">{formData.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="english_level">English Level</Label>
            {isEditing ? (
              <Select
                value={formData.english_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, english_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your English level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - Just starting out</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Can have conversations</SelectItem>
                  <SelectItem value="advanced">Advanced - Nearly fluent</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center space-x-2">
                <Badge className={getLevelColor(formData.english_level)}>
                  {formData.english_level}
                </Badge>
                <span className="text-sm text-gray-600">
                  {getLevelDescription(formData.english_level)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Your Interests</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Tell us what you love to talk about! This helps me suggest better conversation topics.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-red-100 text-red-700 hover:bg-red-200"
              >
                {interest}
                {isEditing && (
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>

          {isEditing && (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a new interest..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <Button onClick={addInterest} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedInterests
                    .filter(interest => !formData.interests.includes(interest))
                    .slice(0, 8)
                    .map((interest) => (
                      <Button
                        key={interest}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            interests: [...prev.interests, interest]
                          }))
                        }}
                        className="text-xs"
                      >
                        + {interest}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-500" />
            <span>Learning Goals</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            What do you want to achieve with your English? Setting clear goals helps me support you better!
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {formData.goals.map((goal, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-green-100 text-green-700 hover:bg-green-200"
              >
                {goal}
                {isEditing && (
                  <button
                    onClick={() => removeGoal(goal)}
                    className="ml-2 text-green-500 hover:text-green-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>

          {isEditing && (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a learning goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                />
                <Button onClick={addGoal} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Popular goals:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedGoals
                    .filter(goal => !formData.goals.includes(goal))
                    .slice(0, 6)
                    .map((goal) => (
                      <Button
                        key={goal}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            goals: [...prev.goals, goal]
                          }))
                        }}
                        className="text-xs"
                      >
                        + {goal}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Journey */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <span>Your Learning Journey</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">Member since</h4>
                <p className="text-sm text-gray-600">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently joined'}
                </p>
              </div>
              <div className="text-right">
                <h4 className="font-semibold text-gray-900">Current Level</h4>
                <p className="text-sm text-gray-600 capitalize">{formData.english_level}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formData.interests.length}
                </div>
                <div className="text-sm text-gray-600">Interests</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formData.goals.length}
                </div>
                <div className="text-sm text-gray-600">Goals</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formData.english_level === 'advanced' ? '90%' : 
                   formData.english_level === 'intermediate' ? '60%' : '30%'}
                </div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserProfile

