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


points = [
    { 'lat': 51.700145, 'lon': 39.218316, 'tag': 'park', 'name': 'Центральный парк', 'description': 'Прекрасный городской парк с озером.', 'image': 'static/2.png', 'audio': 'static/sample.mp3'},
    { 'lat': 51.66073, 'lon': 39.200134, 'tag': 'square', 'name': 'Площадь Ленина', 'description': 'Историческая площадь, центр города.', 'image': 'static/2.png', 'audio': 'static/sample.mp3'},
    { 'lat': 51.657428, 'lon': 39.21599, 'tag': 'square', 'name': 'Адмиралтейская площадь', 'description': 'Площадь с памятниками архитектуры.', 'image': 'static/2.png', 'audio': 'static/sample.mp3'},
    { 'lat': 51.674974, 'lon': 39.206432, 'tag': 'park', 'name': 'Парк Орленок', 'description': 'Тихий парк для отдыха и прогулок.', 'image': 'static/2.png', 'audio': 'static/sample.mp3'},
    { 'lat': 51.673785, 'lon': 39.185168, 'tag': 'square', 'name': 'Застава', 'description': 'Старое историческое место с памятниками.', 'image': 'static/2.png', 'audio': 'static/sample.mp3'},
    { 'lat': 51.65291386390365, 'lon': 39.12939620006461, 'tag': 'park', 'name': 'Танаис', 'description': 'Парк «Танаис» - это парк в Юго-Западном районе города', 'image': 'static/2.png', 'audio': 'static/sample.mp3'},
]

points2 = [
    { 'lat': 51.65291386390365, 'lon': 39.12939620006461, 'tag': 'park', 'name': 'Парк Танаис', 'description': 'Тихий уголок для отдыха', 'image': 'static/2.png', 'audio': 'static/sample.mp3'}
]

points3 = [
    { 'lat': 51.657428, 'lon': 39.21599, 'tag': 'square', 'name': 'Адмиралтейская площадь', 'description': 'Историческая площадь', 'image': 'static/2.png', 'audio': 'static/sample.mp3'}
]

def add_points():
    for point in points:
        new_point = Point(
            lat=point['lat'],
            lon=point['lon'],
            tag=point['tag'],
            name=point['name'],
            description=point['description'],
            image=point['image'],
            audio=point['audio']
        )
        db.session.add(new_point)
    
    db.session.commit()
    print("Точки успешно добавлены в базу данных!")

with app.app_context():
    db.create_all()
    add_points()
