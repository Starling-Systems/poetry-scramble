from flask import Flask, jsonify, request, send_from_directory
import os
import json
import random
import requests
import poetry

app = Flask(__name__, static_folder='static')

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/sonnet')
def sonnet():
    return send_from_directory(app.static_folder, 'sonnet.html')


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

@app.route('/random_sonnet', methods=['GET'])
def get_random_sonnet():
    try:
        sonnets = jsonify(get_random_sonnet_json())
        if not sonnets:
            return jsonify({"error": "No sonnets found."}), 500
        random_sonnet = random.choice(sonnets)
        return jsonify({
            "title": random_sonnet.get("title"),
            "author": random_sonnet.get("author"),
            "lines": random_sonnet.get("lines", [])
        })
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route("/sonnet_deworded", methods = ["GET"])
def get_deworded_sonnet():
    sonnetJSON = get_random_sonnet()
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

        if not poems:
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
