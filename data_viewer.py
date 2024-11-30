from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
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
    audio = db.Column(db.String(200), nullable=False)

def print_all_points():
    with app.app_context():
        points = Point.query.all()
        for point in points:
            print(f"ID: {point.id}, Name: {point.name}, Tag: {point.tag}, "
                  f"Description: {point.description}, Lat: {point.lat}, "
                  f"Lon: {point.lon}, Image: {point.image}, Audio:{point.audio}")

print_all_points()
