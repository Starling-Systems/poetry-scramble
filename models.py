from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Sonnet(db.Model):
    __tablename__ = 'sonnets'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    lines = db.Column(db.ARRAY(db.String), nullable=False)  # Use JSON for SQLite/MySQL
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "lines": self.lines,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
