from flask import Flask, request, jsonify
from flask_cors import CORS
from services.skill_analyzer import SkillAnalyzer
import traceback

app = Flask(__name__)
# Enable CORS for all routes (important for React frontend integration)
CORS(app)

# Initialize Services once on startup
try:
    skill_analyzer = SkillAnalyzer()
    print("Services initialized successfully.")
except Exception as e:
    print(f"Error initializing services: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "CareerGuidance AI"})

@app.route('/api/roles', methods=['GET'])
def get_roles():
    """
    Returns the list of roles supported by the ML demand prediction model.
    """
    try:
        roles = demand_predictor.get_supported_roles()
        return jsonify({"roles": roles})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/skill-gap-ai', methods=['POST'])
def analyze_skill_gap():
    """
    Part 1 - AI Powered Skill Gap Analyzer
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400
            
        student_skills = data.get('skills')
        target_role = data.get('role')
        
        if not student_skills or not str(student_skills).strip():
            return jsonify({"error": "Skills cannot be empty"}), 400
            
        if not target_role:
            return jsonify({"error": "Target role is required"}), 400

        # Run AI Skill Analyzer
        result = skill_analyzer.analyze_gap(student_skills, target_role)
        return jsonify(result)
        
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Internal server error during analysis"}), 500



@app.route('/api/integrated-intelligence', methods=['POST'])
def integrated_insight():
    """
    Integrated AI Intelligence Layer
    Combines both Skill Gap and Market Demand for intelligent decision support
    """
    try:
        data = request.json
        
        # 1. Run skill gap
        skill_res = skill_analyzer.analyze_gap(data.get('skills'), data.get('role'))
        
        trend = demand_res['trend']
        match = skill_res['match_percentage']
        
        integrated_message = ""
        
        # Intelligence Decision Support Logic
        if trend == "Increasing" and match > 70:
            integrated_message = "This is a high-demand role and you are strongly qualified. Apply immediately."
            action_status = "Optimal"
        elif trend == "Increasing" and match < 50:
            integrated_message = "This role is trending but you have a critical skill gap. Immediate upskilling recommended."
            action_status = "Upskill Urgent"
        elif trend == "Decreasing" and match > 70:
            integrated_message = "You are highly qualified, though market demand is cooling. Leverage your strong matching to stand out."
            action_status = "Competitive"
        else:
            integrated_message = f"Role demand is {trend.lower()} and your skill match is at {match}%. Focus on key missing requirements."
            action_status = "Developing"
            
        return jsonify({
            "skill_analysis": skill_res,
            "market_prediction": demand_res,
            "integrated_insight": {
                "message": integrated_message,
                "action_status": action_status
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # Running locally
    # Start the server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
