from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from database import db
from routes.auth import auth_bp
from routes.subjects import subjects_bp
from routes.study import study_bp
from routes.analytics import analytics_bp
from routes.quizzes import quizzes_bp
from routes.recommendations import recommendations_bp
from routes.predictions import predictions_bp
from routes.cosmic import cosmic_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable Cross-Origin Resource Sharing (CORS)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database
    db.init_app(app)

    # Initialize JWT Manager
    jwt = JWTManager(app)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(subjects_bp, url_prefix='/api/subjects')
    app.register_blueprint(study_bp, url_prefix='/api/study')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(quizzes_bp, url_prefix='/api/quizzes')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    app.register_blueprint(predictions_bp, url_prefix='/api/predictions')
    app.register_blueprint(cosmic_bp, url_prefix='/api/cosmic')

    # Register healthcheck
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'healthy', 'message': 'API is functioning correctly.'}), 200

    # Catch-all error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Resource not found.'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'message': 'An internal server error occurred.'}), 500

    # Auto-create tables (suitable for SQLite or MySQL setup) and purge expired data
    with app.app_context():
        try:
            import models # Ensure models are imported so SQLAlchemy knows about them
            db.create_all()
            print("Database tables initialized successfully.")
            
            # Execute 1-year data retention purge
            from models import StudyLog, QuizAttempt, Prediction, Recommendation
            import datetime
            
            cutoff_datetime = datetime.datetime.utcnow() - datetime.timedelta(days=365)
            cutoff_date = datetime.date.today() - datetime.timedelta(days=365)
            
            deleted_study_logs = StudyLog.query.filter(StudyLog.study_date < cutoff_date).delete()
            deleted_quiz_attempts = QuizAttempt.query.filter(QuizAttempt.attempt_date < cutoff_datetime).delete()
            deleted_predictions = Prediction.query.filter(Prediction.generated_at < cutoff_datetime).delete()
            deleted_recommendations = Recommendation.query.filter(Recommendation.generated_at < cutoff_datetime).delete()
            
            db.session.commit()
            if deleted_study_logs or deleted_quiz_attempts or deleted_predictions or deleted_recommendations:
                print(f"Data retention purge completed: {deleted_study_logs} study logs, "
                      f"{deleted_quiz_attempts} quiz attempts, {deleted_predictions} predictions, "
                      f"{deleted_recommendations} recommendations purged.")
        except Exception as e:
            db.session.rollback()
            print(f"Error during initialization or data retention purge: {e}")

    return app

if __name__ == '__main__':
    app = create_app()
    # Read port/host from environment if needed, otherwise standard dev server
    app.run(host='0.0.0.0', port=5000, debug=True)
