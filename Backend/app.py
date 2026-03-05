from flask import Flask
from flask_cors import CORS

from blueprints.auth.auth import auth_bp
from blueprints.clients.clients import clients_bp
from blueprints.jobs.jobs import jobs_bp
from blueprints.plans.weekly_plans import weekly_plans_bp
from blueprints.reports.reports import reports_bp
from blueprints.projects.projects import projects_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(clients_bp)
app.register_blueprint(jobs_bp)
app.register_blueprint(weekly_plans_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(projects_bp)

if __name__ == "__main__":
    app.run(debug=True)
