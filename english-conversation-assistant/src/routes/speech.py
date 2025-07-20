from flask import Blueprint, request, jsonify
from datetime import datetime
import json
from src.models.user import db, User, Message, Conversation
from src.services.speech_service import SpeechAnalysisService

speech_bp = Blueprint('speech', __name__)
speech_service = SpeechAnalysisService()

def run_async(coro):
    """Helper para executar código assíncrono em contexto síncrono"""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)

@speech_bp.route('/users/<int:user_id>/pronunciation-analysis', methods=['POST'])
def analyze_pronunciation(user_id):
    """
    Analisa pronúncia baseada no texto fornecido
    """
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        text = data.get('text', '')
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Analisa pronúncia
        analysis = speech_service.analyze_pronunciation(
            text, 
            user.english_level
        )
        
        return jsonify(analysis)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@speech_bp.route('/users/<int:user_id>/speech-patterns', methods=['GET'])
def get_speech_patterns(user_id):
    """
    Analisa padrões de fala baseado no histórico de conversas
    """
    try:
        user = User.query.get_or_404(user_id)
        
        # Busca conversas recentes do usuário
        recent_conversations = Conversation.query.filter_by(
            user_id=user_id
        ).order_by(Conversation.started_at.desc()).limit(5).all()
        
        # Coleta mensagens das conversas recentes
        conversation_history = []
        for conv in recent_conversations:
            messages = Message.query.filter_by(
                conversation_id=conv.id
            ).order_by(Message.timestamp).all()
            
            for msg in messages:
                conversation_history.append(msg.to_dict())
        
        # Analisa padrões de fala
        patterns = speech_service.analyze_speech_patterns(conversation_history)
        
        return jsonify(patterns)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@speech_bp.route('/users/<int:user_id>/pronunciation-exercises', methods=['POST'])
def get_pronunciation_exercises(user_id):
    """
    Gera exercícios personalizados de pronúncia
    """
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        difficult_sounds = data.get('difficult_sounds', [])
        
        # Gera exercícios personalizados
        exercises = speech_service.generate_pronunciation_exercises(
            difficult_sounds,
            user.english_level
        )
        
        return jsonify(exercises)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@speech_bp.route('/users/<int:user_id>/speech-feedback', methods=['POST'])
def provide_speech_feedback(user_id):
    """
    Fornece feedback detalhado sobre fala baseado em análise de texto
    """
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        text = data.get('text', '')
        context = data.get('context', '')  # Contexto da conversa
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Combina análise de pronúncia com contexto
        pronunciation_analysis = speech_service.analyze_pronunciation(
            text, 
            user.english_level
        )
        
        # Busca histórico recente para análise de padrões
        recent_messages = Message.query.filter(
            Message.conversation_id.in_(
                db.session.query(Conversation.id).filter_by(user_id=user_id)
            ),
            Message.sender == 'user'
        ).order_by(Message.timestamp.desc()).limit(10).all()
        
        conversation_history = [msg.to_dict() for msg in recent_messages]
        speech_patterns = speech_service.analyze_speech_patterns(conversation_history)
        
        # Combina análises para feedback completo
        feedback = {
            'pronunciation': pronunciation_analysis,
            'speech_patterns': speech_patterns,
            'overall_assessment': {
                'strengths': pronunciation_analysis.get('encouragement', ''),
                'focus_areas': [
                    area['sound'] for area in pronunciation_analysis.get('sound_focus_areas', [])
                ],
                'progress_indicators': speech_patterns.get('pronunciation_progress', {}),
                'next_steps': speech_patterns.get('recommendations', [])
            },
            'personalized_tips': generate_personalized_tips(
                pronunciation_analysis, 
                speech_patterns, 
                user.english_level
            )
        }
        
        return jsonify(feedback)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@speech_bp.route('/users/<int:user_id>/pronunciation-progress', methods=['GET'])
def get_pronunciation_progress(user_id):
    """
    Obtém progresso de pronúncia ao longo do tempo
    """
    try:
        user = User.query.get_or_404(user_id)
        
        # Busca mensagens com feedback de pronúncia
        messages_with_feedback = Message.query.filter(
            Message.conversation_id.in_(
                db.session.query(Conversation.id).filter_by(user_id=user_id)
            ),
            Message.sender == 'user',
            Message.pronunciation_feedback.isnot(None)
        ).order_by(Message.timestamp).all()
        
        progress_data = []
        for msg in messages_with_feedback:
            try:
                feedback = json.loads(msg.pronunciation_feedback)
                progress_data.append({
                    'date': msg.timestamp.isoformat(),
                    'overall_score': feedback.get('overall_score', 0.7),
                    'difficult_sounds': len(feedback.get('sound_focus_areas', [])),
                    'confidence_score': msg.confidence_score or 0.7,
                    'text_length': len(msg.content),
                    'improvements': feedback.get('encouragement', '')
                })
            except (json.JSONDecodeError, AttributeError):
                continue
        
        # Calcula tendências
        if len(progress_data) >= 2:
            recent_avg = sum(item['overall_score'] for item in progress_data[-5:]) / min(5, len(progress_data))
            early_avg = sum(item['overall_score'] for item in progress_data[:5]) / min(5, len(progress_data))
            trend = 'improving' if recent_avg > early_avg else 'stable'
        else:
            trend = 'starting'
        
        return jsonify({
            'progress_data': progress_data,
            'summary': {
                'total_sessions': len(progress_data),
                'trend': trend,
                'current_level': user.english_level,
                'average_score': sum(item['overall_score'] for item in progress_data) / len(progress_data) if progress_data else 0.7
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_personalized_tips(pronunciation_analysis: dict, speech_patterns: dict, user_level: str) -> list:
    """
    Gera dicas personalizadas baseadas nas análises
    """
    tips = []
    
    # Dicas baseadas em sons difíceis
    difficult_sounds = pronunciation_analysis.get('sound_focus_areas', [])
    if difficult_sounds:
        for sound_info in difficult_sounds[:2]:  # Top 2 sons mais difíceis
            tips.append(f"Practice the {sound_info['sound']} sound with: {', '.join(sound_info['practice_words'][:3])}")
    
    # Dicas baseadas em padrões de fala
    challenging_sounds = speech_patterns.get('pronunciation_progress', {}).get('challenging_sounds', [])
    if challenging_sounds:
        tips.append(f"Focus on these challenging sounds: {', '.join(challenging_sounds[:3])}")
    
    # Dicas baseadas no nível
    if user_level == 'beginner':
        tips.append("Start with basic vowel sounds and common consonants")
        tips.append("Practice speaking slowly and clearly")
    elif user_level == 'intermediate':
        tips.append("Work on word stress and sentence rhythm")
        tips.append("Practice linking words together naturally")
    else:  # advanced
        tips.append("Focus on subtle pronunciation differences")
        tips.append("Work on natural intonation patterns")
    
    # Dicas motivacionais
    tips.append("Record yourself speaking to track your progress")
    tips.append("Practice a little bit every day for best results")
    
    return tips[:6]  # Máximo 6 dicas

