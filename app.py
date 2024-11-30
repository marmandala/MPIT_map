from flask import Flask, render_template, jsonify, request, redirect, send_from_directory, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import requests
from werkzeug.utils import secure_filename
import os


app = Flask(__name__)
CORS(app)

app.secret_key = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///points.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Point(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lat = db.Column(db.Float, nullable=False)
    lon = db.Column(db.Float, nullable=False)
    tag = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    image = db.Column(db.String(200), nullable=False)
    audio = db.Column(db.String(200), nullable=True)


with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    points = Point.query.all()
    return render_template('admin.html', points=points)

@app.route('/admin/add', methods=['POST'])
def add_point():
    lat = request.form['lat']
    lon = request.form['lon']
    tag = request.form['tag']
    name = request.form['name']
    description = request.form['description']
    
    image_file = request.files['image']
    audio_file = request.files.get('audio')

    if image_file and image_file.filename != '':
        image_filename = secure_filename(image_file.filename)
        image_file.save(os.path.join('uploads', image_filename))
        image_path = f'uploads/{image_filename}'

    if audio_file and audio_file.filename != '':
        audio_filename = secure_filename(audio_file.filename)
        audio_file.save(os.path.join('uploads', audio_filename))
        audio_path = f'uploads/{audio_filename}'
    else:
        audio_path = None

    new_point = Point(lat=lat, lon=lon, tag=tag, name=name, description=description, image=image_path, audio=audio_path)
    db.session.add(new_point)
    db.session.commit()

    flash('Point added successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete/<int:point_id>', methods=['DELETE'])
def delete_point(point_id):
    point = Point.query.get_or_404(point_id)
    db.session.delete(point)
    db.session.commit()
    return jsonify({'message': 'Point deleted successfully!'}), 200

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory('uploads', filename)

@app.route('/route', methods=['GET'])
def get_route():
    points_param = request.args.get('points')

    if not points_param:
        return jsonify({'error': 'No points provided'}), 400

    points = points_param.split('|')
    coordinates = []

    for point in points:
        lat, lon = point.split(',')
        coordinates.append((float(lat), float(lon)))

    coordinates_str = ';'.join([f"{lon},{lat}" for lat, lon in coordinates])

    osrm_url = f"http://router.project-osrm.org/route/v1/driving/{coordinates_str}?overview=full&geometries=geojson"

    response = requests.get(osrm_url)

    if response.status_code == 200:
        route = response.json()
        return jsonify(route)
    else:
        return jsonify({'error': 'Error retrieving route from OSRM'}), 500

@app.route('/get_points', methods=['GET'])
def get_points():
    points = Point.query.all()
    points_data = [{
        'lat': point.lat,
        'lon': point.lon,
        'tag': point.tag,
        'name': point.name,
        'description': point.description,
        'image': point.image,
        'audio': point.audio
    } for point in points]

    return jsonify(points_data)

if __name__ == '__main__':
    app.run(debug=True)
