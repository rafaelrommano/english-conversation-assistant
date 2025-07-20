import os
import json
import re
from typing import Dict, List, Tuple, Optional
from openai import OpenAI
from datetime import datetime

class AIConversationService:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url=os.getenv('OPENAI_API_BASE')
        )
        
        # Personalidade do assistente
        self.system_prompt = """
        You are an enthusiastic, friendly, and encouraging English conversation partner and teacher. 
        Your personality is warm, patient, and genuinely caring about the user's progress. You should:
        
        1. Be conversational and natural, like talking to a good friend
        2. Ask engaging follow-up questions to keep conversations flowing
        3. Gently correct mistakes in a positive, encouraging way
        4. Celebrate small victories and progress
        5. Use humor appropriately to make learning fun
        6. Adapt your language level to match the user's proficiency
        7. Show genuine interest in the user's life, hobbies, and experiences
        8. Provide constructive feedback that builds confidence
        9. Suggest topics based on the user's interests and learning goals
        10. Be patient and never make the user feel judged or embarrassed
        
        Always respond in a way that encourages continued conversation and learning.
        Keep responses natural and conversational, not overly formal or teacher-like.
        """
    
    async def generate_response(self, user_message: str, conversation_history: List[Dict], 
                              user_profile: Dict) -> Tuple[str, Dict]:
        """
        Gera resposta do assistente baseada na mensagem do usuário e histórico
        Retorna: (resposta, análise_da_mensagem)
        """
        try:
            # Prepara o contexto da conversa
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Adiciona contexto do perfil do usuário
            profile_context = self._build_profile_context(user_profile)
            if profile_context:
                messages.append({"role": "system", "content": profile_context})
            
            # Adiciona histórico da conversa (últimas 10 mensagens)
            for msg in conversation_history[-10:]:
                messages.append({
                    "role": "user" if msg["sender"] == "user" else "assistant",
                    "content": msg["content"]
                })
            
            # Adiciona mensagem atual
            messages.append({"role": "user", "content": user_message})
            
            # Gera resposta
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.8,
                max_tokens=300
            )
            
            assistant_response = response.choices[0].message.content
            
            # Analisa a mensagem do usuário
            analysis = await self._analyze_user_message(user_message, user_profile)
            
            return assistant_response, analysis
            
        except Exception as e:
            print(f"Erro ao gerar resposta: {e}")
            return "I'm sorry, I'm having some technical difficulties. Could you try again?", {}
    
    async def _analyze_user_message(self, message: str, user_profile: Dict) -> Dict:
        """
        Analisa a mensagem do usuário para identificar padrões, erros e progresso
        """
        try:
            analysis_prompt = f"""
            Analyze this English message from a language learner and provide feedback in JSON format:
            
            Message: "{message}"
            User Level: {user_profile.get('english_level', 'beginner')}
            
            Please analyze and return a JSON object with:
            {{
                "grammar_errors": [
                    {{"error": "specific error", "correction": "correct form", "explanation": "brief explanation"}}
                ],
                "vocabulary_used": [
                    {{"word": "word", "level": "basic/intermediate/advanced", "usage": "correct/incorrect"}}
                ],
                "fluency_indicators": {{
                    "sentence_complexity": "simple/moderate/complex",
                    "coherence": "good/fair/poor",
                    "natural_flow": "natural/somewhat_natural/awkward"
                }},
                "confidence_score": 0.0-1.0,
                "positive_aspects": ["list of things done well"],
                "suggestions": ["gentle suggestions for improvement"],
                "topics_mentioned": ["topics discussed in the message"]
            }}
            
            Be encouraging and focus on progress, not just errors.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.3,
                max_tokens=500
            )
            
            analysis_text = response.choices[0].message.content
            
            # Tenta extrair JSON da resposta
            try:
                # Remove markdown code blocks se presentes
                json_match = re.search(r'```json\s*(.*?)\s*```', analysis_text, re.DOTALL)
                if json_match:
                    analysis_text = json_match.group(1)
                
                analysis = json.loads(analysis_text)
                return analysis
            except json.JSONDecodeError:
                print(f"Erro ao parsear análise JSON: {analysis_text}")
                return self._default_analysis()
                
        except Exception as e:
            print(f"Erro na análise da mensagem: {e}")
            return self._default_analysis()
    
    def _build_profile_context(self, user_profile: Dict) -> str:
        """
        Constrói contexto baseado no perfil do usuário
        """
        context_parts = []
        
        if user_profile.get('english_level'):
            context_parts.append(f"User's English level: {user_profile['english_level']}")
        
        if user_profile.get('interests'):
            interests = ', '.join(user_profile['interests'])
            context_parts.append(f"User's interests: {interests}")
        
        if user_profile.get('goals'):
            goals = ', '.join(user_profile['goals'])
            context_parts.append(f"User's learning goals: {goals}")
        
        if user_profile.get('learning_style'):
            style = user_profile['learning_style']
            if style:
                context_parts.append(f"User's learning preferences: {json.dumps(style)}")
        
        return "\n".join(context_parts) if context_parts else ""
    
    def _default_analysis(self) -> Dict:
        """
        Retorna análise padrão em caso de erro
        """
        return {
            "grammar_errors": [],
            "vocabulary_used": [],
            "fluency_indicators": {
                "sentence_complexity": "moderate",
                "coherence": "good",
                "natural_flow": "natural"
            },
            "confidence_score": 0.7,
            "positive_aspects": ["Engaging in conversation"],
            "suggestions": [],
            "topics_mentioned": []
        }
    
    async def generate_conversation_starter(self, user_profile: Dict, 
                                          recent_topics: List[str] = None) -> str:
        """
        Gera uma pergunta ou tópico para iniciar conversa baseado no perfil do usuário
        """
        try:
            interests = user_profile.get('interests', [])
            level = user_profile.get('english_level', 'beginner')
            recent_topics = recent_topics or []
            
            prompt = f"""
            Generate a friendly, engaging conversation starter for an English language learner.
            
            User Level: {level}
            User Interests: {', '.join(interests) if interests else 'general topics'}
            Recent Topics Discussed: {', '.join(recent_topics) if recent_topics else 'none'}
            
            Create a natural, friendly question or comment that:
            1. Matches their English level
            2. Relates to their interests when possible
            3. Avoids recently discussed topics
            4. Encourages them to share and practice English
            5. Sounds like something a friend would ask
            
            Keep it conversational and warm, like greeting a good friend.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.9,
                max_tokens=150
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Erro ao gerar starter de conversa: {e}")
            return "Hey there! How's your day going? I'd love to hear what you've been up to!"
    
    async def generate_progress_insights(self, user_progress: List[Dict], 
                                       knowledge_items: List[Dict]) -> Dict:
        """
        Gera insights sobre o progresso do usuário
        """
        try:
            # Prepara dados para análise
            progress_summary = self._summarize_progress(user_progress)
            knowledge_summary = self._summarize_knowledge(knowledge_items)
            
            prompt = f"""
            Analyze this English learner's progress and provide encouraging insights:
            
            Progress Summary: {json.dumps(progress_summary)}
            Knowledge Summary: {json.dumps(knowledge_summary)}
            
            Provide a JSON response with:
            {{
                "overall_progress": "description of overall progress",
                "strengths": ["list of identified strengths"],
                "areas_for_improvement": ["gentle suggestions for improvement"],
                "achievements": ["recent achievements to celebrate"],
                "next_goals": ["suggested next learning goals"],
                "motivation_message": "encouraging message",
                "learning_recommendations": ["specific recommendations"]
            }}
            
            Be very encouraging and focus on progress made, not just areas to improve.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=600
            )
            
            insights_text = response.choices[0].message.content
            
            # Extrai JSON
            try:
                json_match = re.search(r'```json\s*(.*?)\s*```', insights_text, re.DOTALL)
                if json_match:
                    insights_text = json_match.group(1)
                
                return json.loads(insights_text)
            except json.JSONDecodeError:
                return self._default_insights()
                
        except Exception as e:
            print(f"Erro ao gerar insights: {e}")
            return self._default_insights()
    
    def _summarize_progress(self, progress_records: List[Dict]) -> Dict:
        """
        Sumariza registros de progresso
        """
        if not progress_records:
            return {}
        
        recent_records = progress_records[-7:]  # Últimos 7 registros
        
        avg_scores = {
            'vocabulary': sum(r.get('vocabulary_score', 0) for r in recent_records) / len(recent_records),
            'grammar': sum(r.get('grammar_score', 0) for r in recent_records) / len(recent_records),
            'fluency': sum(r.get('fluency_score', 0) for r in recent_records) / len(recent_records),
            'pronunciation': sum(r.get('pronunciation_score', 0) for r in recent_records) / len(recent_records),
            'confidence': sum(r.get('confidence_score', 0) for r in recent_records) / len(recent_records)
        }
        
        total_messages = sum(r.get('messages_sent', 0) for r in recent_records)
        total_duration = sum(r.get('conversation_duration', 0) for r in recent_records)
        
        return {
            'average_scores': avg_scores,
            'total_messages': total_messages,
            'total_duration': total_duration,
            'sessions_count': len(recent_records)
        }
    
    def _summarize_knowledge(self, knowledge_items: List[Dict]) -> Dict:
        """
        Sumariza itens de conhecimento
        """
        if not knowledge_items:
            return {}
        
        by_type = {}
        mastery_levels = []
        
        for item in knowledge_items:
            item_type = item.get('item_type', 'unknown')
            if item_type not in by_type:
                by_type[item_type] = 0
            by_type[item_type] += 1
            
            mastery_levels.append(item.get('mastery_level', 0))
        
        avg_mastery = sum(mastery_levels) / len(mastery_levels) if mastery_levels else 0
        
        return {
            'total_items': len(knowledge_items),
            'by_type': by_type,
            'average_mastery': avg_mastery,
            'well_mastered': len([m for m in mastery_levels if m >= 0.8])
        }
    
    def _default_insights(self) -> Dict:
        """
        Insights padrão em caso de erro
        """
        return {
            "overall_progress": "You're making great progress in your English journey!",
            "strengths": ["Consistent practice", "Willingness to learn"],
            "areas_for_improvement": ["Keep practicing regularly"],
            "achievements": ["Engaging in conversations"],
            "next_goals": ["Continue building vocabulary", "Practice speaking more"],
            "motivation_message": "Keep up the fantastic work! Every conversation makes you better!",
            "learning_recommendations": ["Try discussing different topics", "Focus on expressing your thoughts clearly"]
        }

