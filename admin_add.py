from app import app, db, User  # Импортируем app, db и модель User из вашего приложения

# Используем контекст приложения
with app.app_context():
    user = User(username='admin', password='admin_password')  # Создаем нового пользователя
    db.session.add(user)  # Добавляем пользователя в сессию
    db.session.commit()  # Сохраняем изменения в базе данных
