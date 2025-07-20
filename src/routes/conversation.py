from flask import Blueprint, request, jsonify
from datetime import datetime, date
import json
from src.models.user import db, User, Conversation, Message, UserProgress, KnowledgeItem
from src.services.ai_service import AIConversationService

conversation_bp = Blueprint('conversation', __name__)
ai_service = AIConversationService()

def run_async(coro):
    """Helper para executar código assíncrono em contexto síncrono"""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)

@conversation_bp.route('/users', methods=['POST'])
def create_user():
    """
    Cria um novo usuário
    """
    try:
        data = request.get_json()
        
        # Verifica se usuário já existe
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        
        # Cria novo usuário
        user = User(
            username=data['username'],
            email=data['email'],
            english_level=data.get('english_level', 'beginner'),
            learning_style=json.dumps(data.get('learning_style', {})),
            interests=json.dumps(data.get('interests', [])),
            goals=json.dumps(data.get('goals', []))
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify(user.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@conversation_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """
    Obtém dados do usuário
    """
    try:
        user = User.query.get_or_404(user_id)
        return jsonify(user.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@conversation_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """
    Atualiza perfil do usuário
    """
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if 'english_level' in data:
            user.english_level = data['english_level']
        if 'learning_style' in data:
            user.learning_style = json.dumps(data['learning_style'])
        if 'interests' in data:
            user.interests = json.dumps(data['interests'])
        if 'goals' in data:
            user.goals = json.dumps(data['goals'])
        
        db.session.commit()
        return jsonify(user.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@conversation_bp.route('/users/<int:user_id>/conversations', methods=['POST'])
def start_conversation(user_id):
    """
    Inicia uma nova conversa
    """
    try:
        user = User.query.get_or_404(user_id)
        
        # Finaliza conversas ativas anteriores
        active_conversations = Conversation.query.filter_by(
            user_id=user_id, 
            is_active=True
        ).all()
        
        for conv in active_conversations:
            conv.is_active = False
            conv.ended_at = datetime.utcnow()
        
        # Cria nova conversa
        conversation = Conversation(
            user_id=user_id,
            title=f"Conversation {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        
        db.session.add(conversation)
        db.session.commit()
        
        # Gera mensagem de abertura
        recent_topics = get_recent_topics(user_id)
        starter_message = run_async(
            ai_service.generate_conversation_starter(
                user.to_dict(), 
                recent_topics
            )
        )
        
        # Adiciona mensagem do assistente
        assistant_message = Message(
            conversation_id=conversation.id,
            sender='assistant',
            content=starter_message
        )
        
        db.session.add(assistant_message)
        db.session.commit()
        
        return jsonify({
            'conversation': conversation.to_dict(),
            'starter_message': assistant_message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@conversation_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
def send_message(conversation_id):
    """
    Envia mensagem na conversa
    """
    try:
        conversation = Conversation.query.get_or_404(conversation_id)
        data = request.get_json()
        user_message_content = data['content']
        
        # Salva mensagem do usuário
        user_message = Message(
            conversation_id=conversation_id,
            sender='user',
            content=user_message_content
        )
        
        db.session.add(user_message)
        db.session.flush()  # Para obter o ID
        
        # Obtém histórico da conversa
        conversation_history = []
        messages = Message.query.filter_by(
            conversation_id=conversation_id
        ).order_by(Message.timestamp).all()
        
        for msg in messages:
            conversation_history.append(msg.to_dict())
        
        # Gera resposta do assistente
        user = User.query.get(conversation.user_id)
        assistant_response, analysis = run_async(
            ai_service.generate_response(
                user_message_content,
                conversation_history,
                user.to_dict()
            )
        )
        
        # Atualiza análise da mensagem do usuário
        user_message.grammar_errors = json.dumps(analysis.get('grammar_errors', []))
        user_message.vocabulary_used = json.dumps(analysis.get('vocabulary_used', []))
        user_message.confidence_score = analysis.get('confidence_score', 0.7)
        
        # Salva mensagem do assistente
        assistant_message = Message(
            conversation_id=conversation_id,
            sender='assistant',
            content=assistant_response
        )
        
        db.session.add(assistant_message)
        
        # Atualiza itens de conhecimento
        update_knowledge_items(user.id, analysis)
        
        # Atualiza progresso diário
        update_daily_progress(user.id, analysis)
        
        db.session.commit()
        
        return jsonify({
            'user_message': user_message.to_dict(),
            'assistant_message': assistant_message.to_dict(),
            'analysis': analysis
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@conversation_bp.route('/users/<int:user_id>/conversations', methods=['GET'])
def get_user_conversations(user_id):
    """
    Obtém conversas do usuário
    """
    try:
        conversations = Conversation.query.filter_by(
            user_id=user_id
        ).order_by(Conversation.started_at.desc()).all()
        
        return jsonify([conv.to_dict() for conv in conversations])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@conversation_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
def get_conversation_messages(conversation_id):
    """
    Obtém mensagens de uma conversa
    """
    try:
        messages = Message.query.filter_by(
            conversation_id=conversation_id
        ).order_by(Message.timestamp).all()
        
        return jsonify([msg.to_dict() for msg in messages])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@conversation_bp.route('/users/<int:user_id>/progress', methods=['GET'])
def get_user_progress(user_id):
    """
    Obtém progresso do usuário
    """
    try:
        # Parâmetros de consulta
        days = request.args.get('days', 30, type=int)
        
        # Busca registros de progresso
        progress_records = UserProgress.query.filter_by(
            user_id=user_id
        ).order_by(UserProgress.date.desc()).limit(days).all()
        
        return jsonify([record.to_dict() for record in progress_records])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@conversation_bp.route('/users/<int:user_id>/knowledge', methods=['GET'])
def get_user_knowledge(user_id):
    """
    Obtém nuvem de conhecimento do usuário
    """
    try:
        knowledge_items = KnowledgeItem.query.filter_by(
            user_id=user_id
        ).order_by(KnowledgeItem.mastery_level.desc()).all()
        
        return jsonify([item.to_dict() for item in knowledge_items])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@conversation_bp.route('/users/<int:user_id>/insights', methods=['GET'])
def get_user_insights(user_id):
    """
    Gera insights sobre o progresso do usuário
    """
    try:
        # Busca dados de progresso e conhecimento
        progress_records = UserProgress.query.filter_by(
            user_id=user_id
        ).order_by(UserProgress.date.desc()).limit(14).all()
        
        knowledge_items = KnowledgeItem.query.filter_by(
            user_id=user_id
        ).all()
        
        # Gera insights
        insights = run_async(
            ai_service.generate_progress_insights(
                [record.to_dict() for record in progress_records],
                [item.to_dict() for item in knowledge_items]
            )
        )
        
        return jsonify(insights)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_recent_topics(user_id: int, days: int = 7) -> list:
    """
    Obtém tópicos recentes discutidos pelo usuário
    """
    try:
        recent_progress = UserProgress.query.filter_by(
            user_id=user_id
        ).order_by(UserProgress.date.desc()).limit(days).all()
        
        topics = []
        for record in recent_progress:
            if record.topics_discussed:
                topics.extend(json.loads(record.topics_discussed))
        
        # Remove duplicatas mantendo ordem
        unique_topics = []
        for topic in topics:
            if topic not in unique_topics:
                unique_topics.append(topic)
        
        return unique_topics[:10]  # Últimos 10 tópicos únicos
        
    except Exception as e:
        print(f"Erro ao buscar tópicos recentes: {e}")
        return []

def update_knowledge_items(user_id: int, analysis: dict):
    """
    Atualiza itens de conhecimento baseado na análise
    """
    try:
        vocabulary_used = analysis.get('vocabulary_used', [])
        
        for vocab_item in vocabulary_used:
            word = vocab_item.get('word', '').lower()
            if not word:
                continue
            
            # Busca item existente
            existing_item = KnowledgeItem.query.filter_by(
                user_id=user_id,
                content=word,
                item_type='word'
            ).first()
            
            if existing_item:
                # Atualiza item existente
                existing_item.times_encountered += 1
                if vocab_item.get('usage') == 'correct':
                    existing_item.times_used_correctly += 1
                
                # Recalcula nível de domínio
                accuracy = existing_item.times_used_correctly / existing_item.times_encountered
                existing_item.mastery_level = min(accuracy * 1.2, 1.0)  # Boost para encorajar
                existing_item.last_encountered = datetime.utcnow()
                
            else:
                # Cria novo item
                mastery_level = 0.8 if vocab_item.get('usage') == 'correct' else 0.3
                
                new_item = KnowledgeItem(
                    user_id=user_id,
                    item_type='word',
                    content=word,
                    mastery_level=mastery_level,
                    times_used_correctly=1 if vocab_item.get('usage') == 'correct' else 0,
                    difficulty_level=vocab_item.get('level', 'basic'),
                    topic_category='vocabulary'
                )
                
                db.session.add(new_item)
        
        # Adiciona tópicos mencionados
        topics_mentioned = analysis.get('topics_mentioned', [])
        for topic in topics_mentioned:
            if not topic:
                continue
                
            existing_topic = KnowledgeItem.query.filter_by(
                user_id=user_id,
                content=topic.lower(),
                item_type='topic'
            ).first()
            
            if existing_topic:
                existing_topic.times_encountered += 1
                existing_topic.mastery_level = min(existing_topic.mastery_level + 0.1, 1.0)
                existing_topic.last_encountered = datetime.utcnow()
            else:
                new_topic = KnowledgeItem(
                    user_id=user_id,
                    item_type='topic',
                    content=topic.lower(),
                    mastery_level=0.5,
                    topic_category='conversation_topics'
                )
                db.session.add(new_topic)
        
    except Exception as e:
        print(f"Erro ao atualizar itens de conhecimento: {e}")

def update_daily_progress(user_id: int, analysis: dict):
    """
    Atualiza progresso diário do usuário
    """
    try:
        today = date.today()
        
        # Busca registro de hoje
        progress_record = UserProgress.query.filter_by(
            user_id=user_id,
            date=today
        ).first()
        
        if not progress_record:
            # Cria novo registro
            progress_record = UserProgress(
                user_id=user_id,
                date=today
            )
            db.session.add(progress_record)
        
        # Atualiza métricas baseado na análise
        confidence_score = analysis.get('confidence_score', 0.7)
        fluency_indicators = analysis.get('fluency_indicators', {})
        
        # Calcula pontuações
        grammar_score = 1.0 - (len(analysis.get('grammar_errors', [])) * 0.1)
        grammar_score = max(0.0, min(1.0, grammar_score))
        
        vocabulary_score = len([v for v in analysis.get('vocabulary_used', []) 
                               if v.get('usage') == 'correct']) / max(1, len(analysis.get('vocabulary_used', [])))
        
        fluency_score = 0.7  # Base score
        if fluency_indicators.get('natural_flow') == 'natural':
            fluency_score += 0.2
        if fluency_indicators.get('coherence') == 'good':
            fluency_score += 0.1
        
        # Atualiza com média ponderada (70% valor atual, 30% novo)
        progress_record.confidence_score = (progress_record.confidence_score * 0.7) + (confidence_score * 0.3)
        progress_record.grammar_score = (progress_record.grammar_score * 0.7) + (grammar_score * 0.3)
        progress_record.vocabulary_score = (progress_record.vocabulary_score * 0.7) + (vocabulary_score * 0.3)
        progress_record.fluency_score = (progress_record.fluency_score * 0.7) + (fluency_score * 0.3)
        
        # Incrementa estatísticas
        progress_record.messages_sent += 1
        
        # Atualiza tópicos discutidos
        topics_mentioned = analysis.get('topics_mentioned', [])
        if topics_mentioned:
            current_topics = json.loads(progress_record.topics_discussed) if progress_record.topics_discussed else []
            current_topics.extend(topics_mentioned)
            # Remove duplicatas
            unique_topics = list(set(current_topics))
            progress_record.topics_discussed = json.dumps(unique_topics)
        
    except Exception as e:
        print(f"Erro ao atualizar progresso diário: {e}")

