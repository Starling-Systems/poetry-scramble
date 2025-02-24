from flask import Flask, jsonify, request, send_from_directory
from flask_migrate import Migrate
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

import os
import json
import random
import requests
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder='static')

# PostgreSQL Configuration
database_url = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
print("database_url = ")
print(database_url)

db = SQLAlchemy()
db.init_app(app)
migrate = Migrate(app, db)

class Sonnet(db.Model):
    __tablename__ = 'sonnets'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    lines = db.Column(db.ARRAY(db.String), nullable=False)  # Use JSON for dbite/MySQL
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "lines": self.lines,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }

def load_sonnets_into_db():
    sonnets_response = requests.get("https://ajpj.fact50.net/PoetryScramble/ShakespeareSonnets.json")
    sonnets_response.raise_for_status()
    sonnets = sonnets_response.json()
    for sonnet in sonnets:
        s = Sonnet(
            title = sonnet['title'],
            author = sonnet['author'],
            lines = sonnet['lines'],
        )
        db.session.add(s)
        db.session.commit()
    return sonnets

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/sonnet')
def sonnet():
    return send_from_directory(app.static_folder, 'sonnet.html')

@app.route('/sonnet-substitution')
def sonnet_substitution():
    return send_from_directory(app.static_folder, 'sonnet-substitution.html')


@app.route('/poem/<int:poem_id>', methods=['GET'])
def get_poem(poem_id):
    if 1 <= poem_id <= 67:
        poem = poems[poem_id - 1]  # Adjusting for 0-based indexing in the array
        return jsonify({
            "poem_id": poem_id,
            "title": poem.get("title"),
            "author": poem.get("author"),
            "lines": poem.get("lines"),
            "linecount": poem.get("linecount")
        }), 200
    else:
        return jsonify({"error": "Poem not found"}), 404

@app.route('/load_db', methods=['GET'])
def load_db():
    try:
        sonnets = load_sonnets_into_db()
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
    if not sonnets:
        return jsonify({"error": "No sonnets found."}), 500
    else:
        return sonnets, 200

@app.route('/random_sonnet', methods=['GET'])
def get_random_sonnet():
    try:
        sonnets = poetry.get_random_sonnet_json()
        if not sonnets:
            return jsonify({"error": "No sonnets found."}), 500
        else:
            return sonnets, 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route("/sonnet_deworded", methods = ["GET"])
def get_deworded_sonnet():
    sonnetJSON = poetry.get_random_sonnet_json()
    sonnetJSON["lines"] = [poetry.get_last_word(line) for line in sonnetJSON["lines"]]
    return jsonify(sonnetJSON)

@app.route('/random', methods=['GET'])
def get_random_poem():
    try:
        # Step 1: Get authors from PoetryDB
        authors_response = requests.get('https://poetrydb.org/author')
        authors_response.raise_for_status()
        authors = authors_response.json().get('authors', [])

        if not authors:
            return jsonify({"error": "No authors found."}), 500

        # Step 2: Choose a random author
        random_author = random.choice(authors)

        # Step 3: Get poems by the chosen author
        poems_response = requests.get(f'https://poetrydb.org/author/{random_author}')
        poems_response.raise_for_status()
        poems = poems_response.json()

        if not poems:
            return jsonify({"error": "No poems found for the selected author."}), 500
        
        print("Number of poems returned:")
        print(len(poems))

        poems = [p for p in poems if int(p["linecount"]) <= 15]

        if poems == []:
            get_random_poem()

        # Step 4: Choose a random poem
        random_poem = random.choice(poems)

        return jsonify({
            "title": random_poem.get("title"),
            "author": random_poem.get("author"),
            "lines": random_poem.get("lines", [])
        })

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use PORT from environment or default to 5000
    app.run(host='0.0.0.0', port=port, debug=True)
