from flask import Flask, jsonify, request, send_from_directory
import os
import json
import random
import requests

app = Flask(__name__, static_folder='static')

# Load poems from witman.json
with open('witman.json', 'r') as file:
    poems = json.load(file)

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

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

        poems = [p for p in poems if int(p["linecount"]) < 15]

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
