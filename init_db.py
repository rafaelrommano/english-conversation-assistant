#!/usr/bin/env python3
"""
Script para inicializar o banco de dados com todas as tabelas necessárias
"""

import os
import sys
sys.path.append('src')

from src.models.user import db, User, Conversation, Message
from src.main import app

def init_database():
    """Inicializa o banco de dados com todas as tabelas"""
    with app.app_context():
        # Remove todas as tabelas existentes e recria
        db.drop_all()
        db.create_all()
        
        # Cria usuário padrão para testes
        default_user = User(
            username='learner',
            email='learner@example.com',
            english_level='intermediate'
        )
        
        # Define os campos JSON como strings
        import json
        default_user.interests = json.dumps(['travel', 'technology', 'movies'])
        default_user.goals = json.dumps(['improve fluency', 'expand vocabulary'])
        default_user.learning_style = json.dumps({
            'preferred_topics': ['travel', 'technology'],
            'difficulty_preference': 'moderate',
            'feedback_style': 'encouraging'
        })
        
        db.session.add(default_user)
        db.session.commit()
        
        print("✅ Database initialized successfully!")
        print(f"✅ Created default user: {default_user.username} (ID: {default_user.id})")
        print("✅ All tables created and ready to use")

if __name__ == '__main__':
    init_database()

