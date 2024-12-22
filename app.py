from flask import Flask, jsonify, request, send_from_directory
import os

app = Flask(__name__, static_folder='static')

# Mock data for demonstration
poems = {
    1: "The road not taken, by Robert Frost",
    2: "Still I Rise, by Maya Angelou",
    3: "If, by Rudyard Kipling"
}

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/poem/<int:poem_id>', methods=['GET'])
def get_poem(poem_id):
    poem = poems.get(poem_id)
    if poem:
        return jsonify({"poem_id": poem_id, "poem": poem}), 200
    else:
        return jsonify({"error": "Poem not found"}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use PORT from environment or default to 5000
    app.run(host='0.0.0.0', port=port, debug=True)
