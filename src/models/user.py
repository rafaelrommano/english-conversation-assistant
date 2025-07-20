from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Perfil de aprendizagem
    english_level = db.Column(db.String(20), default='beginner')  # beginner, intermediate, advanced
    learning_style = db.Column(db.Text)  # JSON com preferências de aprendizagem
    interests = db.Column(db.Text)  # JSON com tópicos de interesse
    goals = db.Column(db.Text)  # JSON com objetivos de aprendizagem
    
    # Relacionamentos
    conversations = db.relationship('Conversation', backref='user', lazy=True, cascade='all, delete-orphan')
    progress_records = db.relationship('UserProgress', backref='user', lazy=True, cascade='all, delete-orphan')
    knowledge_items = db.relationship('KnowledgeItem', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'english_level': self.english_level,
            'learning_style': json.loads(self.learning_style) if self.learning_style else {},
            'interests': json.loads(self.interests) if self.interests else [],
            'goals': json.loads(self.goals) if self.goals else [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200))
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relacionamentos
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'is_active': self.is_active,
            'message_count': len(self.messages)
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'), nullable=False)
    sender = db.Column(db.String(20), nullable=False)  # 'user' ou 'assistant'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Análise da mensagem
    grammar_errors = db.Column(db.Text)  # JSON com erros identificados
    vocabulary_used = db.Column(db.Text)  # JSON com vocabulário usado
    pronunciation_feedback = db.Column(db.Text)  # JSON com feedback de pronúncia
    confidence_score = db.Column(db.Float)  # Pontuação de confiança (0-1)
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender': self.sender,
            'content': self.content,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'grammar_errors': json.loads(self.grammar_errors) if self.grammar_errors else [],
            'vocabulary_used': json.loads(self.vocabulary_used) if self.vocabulary_used else [],
            'pronunciation_feedback': json.loads(self.pronunciation_feedback) if self.pronunciation_feedback else {},
            'confidence_score': self.confidence_score
        }

class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow().date)
    
    # Métricas de progresso
    vocabulary_score = db.Column(db.Float, default=0.0)
    grammar_score = db.Column(db.Float, default=0.0)
    fluency_score = db.Column(db.Float, default=0.0)
    pronunciation_score = db.Column(db.Float, default=0.0)
    confidence_score = db.Column(db.Float, default=0.0)
    
    # Estatísticas da sessão
    messages_sent = db.Column(db.Integer, default=0)
    conversation_duration = db.Column(db.Integer, default=0)  # em minutos
    topics_discussed = db.Column(db.Text)  # JSON com tópicos
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'vocabulary_score': self.vocabulary_score,
            'grammar_score': self.grammar_score,
            'fluency_score': self.fluency_score,
            'pronunciation_score': self.pronunciation_score,
            'confidence_score': self.confidence_score,
            'messages_sent': self.messages_sent,
            'conversation_duration': self.conversation_duration,
            'topics_discussed': json.loads(self.topics_discussed) if self.topics_discussed else []
        }

class KnowledgeItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Item de conhecimento
    item_type = db.Column(db.String(50), nullable=False)  # 'word', 'phrase', 'grammar_rule', 'topic'
    content = db.Column(db.String(200), nullable=False)
    definition = db.Column(db.Text)
    example_usage = db.Column(db.Text)
    
    # Métricas de domínio
    mastery_level = db.Column(db.Float, default=0.0)  # 0-1, quão bem o usuário domina
    times_encountered = db.Column(db.Integer, default=1)
    times_used_correctly = db.Column(db.Integer, default=0)
    last_encountered = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Contexto
    topic_category = db.Column(db.String(100))
    difficulty_level = db.Column(db.String(20))  # easy, medium, hard
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'item_type': self.item_type,
            'content': self.content,
            'definition': self.definition,
            'example_usage': self.example_usage,
            'mastery_level': self.mastery_level,
            'times_encountered': self.times_encountered,
            'times_used_correctly': self.times_used_correctly,
            'last_encountered': self.last_encountered.isoformat() if self.last_encountered else None,
            'topic_category': self.topic_category,
            'difficulty_level': self.difficulty_level
        }
