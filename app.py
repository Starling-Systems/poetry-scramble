from flask import Flask, jsonify, request, send_from_directory
import os
import json

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use PORT from environment or default to 5000
    app.run(host='0.0.0.0', port=port, debug=True)
