from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import SocketIO, join_room, emit
import os
import json
import random
import requests
import poetry



app = Flask(__name__, static_folder='static')
socketio = SocketIO(app, cors_allowed_origins="*") # allow WebSockets

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/sonnet')
def sonnet():
    return send_from_directory(app.static_folder, 'sonnet.html')

@app.route('/sonnet-substitution', methods=['GET'])
def sonnet_substitution():
    return send_from_directory(app.static_folder, 'sonnet-substitution.html')

@app.route('/multiplayer')
def multiplayer():
    return send_from_directory(app.static_folder, 'multiplayer.html')

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
        sonnets = poetry.get_random_sonnet_json()
        if not sonnets:
            return jsonify({"error": "No sonnets found."}), 500
        else:
            return sonnets, 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_sonnet', methods=['GET'])
def get_sonnet():
    sonnet_num = request.args.get('id', default = 0, type = int)
    try:
        sonnetJSON = poetry.get_sonnet_json(sonnet_num)
        print(sonnetJSON)
        if not sonnetJSON['lines']:
            return jsonify({"error": "sonnet number " + sonnet_num + " not found."}), 500
        else:
            sonnetJSON["lines"] = [poetry.get_last_word(line) for line in sonnetJSON["lines"]]
            return sonnetJSON, 200
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

# Store game states for rooms
game_states = {}

@socketio.on('join')
def on_join(data):
    room = data['room']
    player = data['player']
    join_room(room)
    if room not in game_states:
        game_states[room] = {'completed_lines': {}, 'players': []}
    if player not in game_states[room]['players']:
        game_states[room]['players'].append(player)
    print("join, update: game_states:")
    print(game_states)
    emit('update', game_states[room], room=room)

@socketio.on('complete_line')
def complete_line(data):
    room = data['room']
    line_index = data['line_index']
    player = data['player']
    # Update game state
    game_states[room]['completed_lines'][line_index] = player
    print("complete_line, update: game_states:")
    print(game_states)
    emit('update', game_states[room], room=room)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use PORT from environment or default to 5000
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
