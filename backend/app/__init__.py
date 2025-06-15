from flask import Flask
from flask_cors import CORS
from .routes.auth import auth
from .routes.courses import courses
from .routes.attendance import attendance_routes
from .routes.admin import admin_routes

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Blueprint'leri kaydet
    app.register_blueprint(auth, url_prefix='/api/auth')
    app.register_blueprint(courses, url_prefix='/api/courses')
    app.register_blueprint(attendance_routes, url_prefix='/api/attendance')
    app.register_blueprint(admin_routes, url_prefix='/api/admin')
    
    return app