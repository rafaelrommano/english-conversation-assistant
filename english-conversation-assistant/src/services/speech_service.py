import os
import json
import re
from typing import Dict, List, Tuple, Optional
from openai import OpenAI

class SpeechAnalysisService:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url=os.getenv('OPENAI_API_BASE')
        )
    
    def analyze_pronunciation(self, text: str, user_level: str = 'intermediate') -> Dict:
        """
        Analisa a pronúncia baseada no texto transcrito e nível do usuário
        """
        try:
            analysis_prompt = f"""
            Analyze the pronunciation challenges for this English text based on common pronunciation issues.
            
            Text: "{text}"
            User Level: {user_level}
            
            Provide a JSON response with pronunciation analysis:
            {{
                "overall_score": 0.0-1.0,
                "difficult_words": [
                    {{
                        "word": "word",
                        "phonetic": "phonetic transcription",
                        "difficulty": "easy/medium/hard",
                        "common_mistakes": ["list of common pronunciation errors"],
                        "tips": "pronunciation tip"
                    }}
                ],
                "sound_focus_areas": [
                    {{
                        "sound": "phonetic sound like /θ/ or /r/",
                        "description": "description of the sound",
                        "practice_words": ["word1", "word2", "word3"],
                        "tip": "how to practice this sound"
                    }}
                ],
                "rhythm_and_stress": {{
                    "sentence_stress": "analysis of sentence stress patterns",
                    "word_stress": ["words with stress pattern issues"],
                    "intonation_tips": "tips for better intonation"
                }},
                "encouragement": "positive, encouraging message about pronunciation progress"
            }}
            
            Focus on the most relevant pronunciation challenges for a {user_level} level learner.
            Be encouraging and constructive in your feedback.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.3,
                max_tokens=800
            )
            
            analysis_text = response.choices[0].message.content
            
            # Extrai JSON da resposta
            try:
                json_match = re.search(r'```json\s*(.*?)\s*```', analysis_text, re.DOTALL)
                if json_match:
                    analysis_text = json_match.group(1)
                
                analysis = json.loads(analysis_text)
                return analysis
            except json.JSONDecodeError:
                print(f"Erro ao parsear análise de pronúncia JSON: {analysis_text}")
                return self._default_pronunciation_analysis()
                
        except Exception as e:
            print(f"Erro na análise de pronúncia: {e}")
            return self._default_pronunciation_analysis()
    
    def analyze_speech_patterns(self, conversation_history: List[Dict]) -> Dict:
        """
        Analisa padrões de fala ao longo de múltiplas conversas
        """
        try:
            # Extrai apenas mensagens do usuário
            user_messages = [msg for msg in conversation_history if msg.get('sender') == 'user']
            
            if not user_messages:
                return self._default_speech_patterns()
            
            # Combina mensagens recentes para análise
            recent_messages = user_messages[-10:]  # Últimas 10 mensagens
            combined_text = " ".join([msg.get('content', '') for msg in recent_messages])
            
            analysis_prompt = f"""
            Analyze speech patterns and pronunciation development from these recent messages:
            
            Messages: "{combined_text}"
            
            Provide a JSON analysis of speech patterns:
            {{
                "fluency_indicators": {{
                    "sentence_length_avg": "average sentence length",
                    "complexity_level": "simple/moderate/complex",
                    "hesitation_markers": ["um", "uh", "like", "you know"],
                    "confidence_indicators": ["phrases that show confidence or hesitation"]
                }},
                "pronunciation_progress": {{
                    "improved_sounds": ["sounds that seem to be improving"],
                    "challenging_sounds": ["sounds that need more work"],
                    "consistency": "how consistent pronunciation appears to be"
                }},
                "vocabulary_usage": {{
                    "advanced_words": ["more sophisticated vocabulary used"],
                    "repetitive_patterns": ["words or phrases used frequently"],
                    "variety_score": 0.0-1.0
                }},
                "grammar_patterns": {{
                    "common_structures": ["grammatical structures frequently used"],
                    "error_patterns": ["types of errors that appear consistently"],
                    "improvement_areas": ["grammar areas showing improvement"]
                }},
                "recommendations": [
                    "specific recommendations for pronunciation practice",
                    "suggestions for vocabulary expansion",
                    "grammar focus areas"
                ],
                "encouragement": "motivational message about progress observed"
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.4,
                max_tokens=700
            )
            
            analysis_text = response.choices[0].message.content
            
            try:
                json_match = re.search(r'```json\s*(.*?)\s*```', analysis_text, re.DOTALL)
                if json_match:
                    analysis_text = json_match.group(1)
                
                return json.loads(analysis_text)
            except json.JSONDecodeError:
                return self._default_speech_patterns()
                
        except Exception as e:
            print(f"Erro na análise de padrões de fala: {e}")
            return self._default_speech_patterns()
    
    def generate_pronunciation_exercises(self, difficult_sounds: List[str], 
                                       user_level: str = 'intermediate') -> Dict:
        """
        Gera exercícios personalizados de pronúncia
        """
        try:
            sounds_text = ", ".join(difficult_sounds) if difficult_sounds else "general pronunciation"
            
            exercise_prompt = f"""
            Create personalized pronunciation exercises for these challenging sounds: {sounds_text}
            User Level: {user_level}
            
            Generate a JSON response with pronunciation exercises:
            {{
                "warm_up_exercises": [
                    {{
                        "title": "exercise name",
                        "description": "what to do",
                        "examples": ["example1", "example2", "example3"]
                    }}
                ],
                "sound_specific_drills": [
                    {{
                        "target_sound": "phonetic sound",
                        "minimal_pairs": [["word1", "word2"], ["word3", "word4"]],
                        "practice_sentences": ["sentence with target sound"],
                        "tongue_twisters": ["fun tongue twister for practice"]
                    }}
                ],
                "rhythm_exercises": [
                    {{
                        "type": "stress pattern practice",
                        "sentences": ["sentences with marked stress"],
                        "instructions": "how to practice rhythm and stress"
                    }}
                ],
                "daily_practice_plan": {{
                    "duration": "recommended daily practice time",
                    "sequence": ["step 1", "step 2", "step 3"],
                    "progress_tracking": "how to track improvement"
                }},
                "motivation": "encouraging message about pronunciation practice"
            }}
            
            Make exercises appropriate for {user_level} level and engaging to practice.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": exercise_prompt}],
                temperature=0.6,
                max_tokens=800
            )
            
            exercise_text = response.choices[0].message.content
            
            try:
                json_match = re.search(r'```json\s*(.*?)\s*```', exercise_text, re.DOTALL)
                if json_match:
                    exercise_text = json_match.group(1)
                
                return json.loads(exercise_text)
            except json.JSONDecodeError:
                return self._default_pronunciation_exercises()
                
        except Exception as e:
            print(f"Erro ao gerar exercícios de pronúncia: {e}")
            return self._default_pronunciation_exercises()
    
    def _default_pronunciation_analysis(self) -> Dict:
        """
        Análise padrão de pronúncia em caso de erro
        """
        return {
            "overall_score": 0.7,
            "difficult_words": [
                {
                    "word": "pronunciation",
                    "phonetic": "/prəˌnʌnsiˈeɪʃən/",
                    "difficulty": "medium",
                    "common_mistakes": ["dropping syllables"],
                    "tips": "Break it down: pro-nun-ci-a-tion"
                }
            ],
            "sound_focus_areas": [
                {
                    "sound": "/θ/",
                    "description": "The 'th' sound as in 'think'",
                    "practice_words": ["think", "thank", "three"],
                    "tip": "Put your tongue between your teeth and blow air gently"
                }
            ],
            "rhythm_and_stress": {
                "sentence_stress": "Focus on stressing content words",
                "word_stress": ["pronunciation", "conversation"],
                "intonation_tips": "Use rising intonation for questions"
            },
            "encouragement": "You're doing great! Keep practicing and your pronunciation will continue to improve!"
        }
    
    def _default_speech_patterns(self) -> Dict:
        """
        Padrões de fala padrão em caso de erro
        """
        return {
            "fluency_indicators": {
                "sentence_length_avg": "moderate",
                "complexity_level": "moderate",
                "hesitation_markers": [],
                "confidence_indicators": ["clear expression"]
            },
            "pronunciation_progress": {
                "improved_sounds": ["vowel sounds"],
                "challenging_sounds": ["consonant clusters"],
                "consistency": "improving"
            },
            "vocabulary_usage": {
                "advanced_words": ["conversation", "experience"],
                "repetitive_patterns": [],
                "variety_score": 0.7
            },
            "grammar_patterns": {
                "common_structures": ["simple present", "past tense"],
                "error_patterns": [],
                "improvement_areas": ["complex sentences"]
            },
            "recommendations": [
                "Continue practicing daily conversations",
                "Focus on expanding vocabulary",
                "Work on sentence variety"
            ],
            "encouragement": "You're making steady progress! Keep up the great work!"
        }
    
    def _default_pronunciation_exercises(self) -> Dict:
        """
        Exercícios padrão de pronúncia em caso de erro
        """
        return {
            "warm_up_exercises": [
                {
                    "title": "Lip and Tongue Warm-up",
                    "description": "Prepare your mouth for clear pronunciation",
                    "examples": ["ma-me-mi-mo-mu", "la-le-li-lo-lu", "pa-pe-pi-po-pu"]
                }
            ],
            "sound_specific_drills": [
                {
                    "target_sound": "/θ/",
                    "minimal_pairs": [["think", "sink"], ["thank", "sank"]],
                    "practice_sentences": ["I think three things through thoroughly"],
                    "tongue_twisters": ["Thirty-three thick thieves thought they thrilled the throne"]
                }
            ],
            "rhythm_exercises": [
                {
                    "type": "stress pattern practice",
                    "sentences": ["I LOVE to SPEAK English CLEARLY"],
                    "instructions": "Emphasize the capitalized words"
                }
            ],
            "daily_practice_plan": {
                "duration": "10-15 minutes daily",
                "sequence": ["warm-up", "sound drills", "rhythm practice"],
                "progress_tracking": "Record yourself weekly to hear improvement"
            },
            "motivation": "Every day of practice makes you more confident and clear!"
        }

