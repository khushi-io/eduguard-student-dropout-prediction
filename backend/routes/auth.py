from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User Login Endpoint
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              example: admin
            password:
              type: string
              example: admin123
    responses:
      200:
        description: Login successful, returns JWT access token and user info
      401:
        description: Invalid credentials
    """
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"message": "Please enter both username and password."}), 400
        
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        return jsonify({"message": "Incorrect username or password."}), 401
        
    # Generate JWT containing username and role
    access_token = create_access_token(identity=user.username, additional_claims={"role": user.role, "id": user.id})
    
    return jsonify({
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "email": user.email
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current logged in user details
    ---
    tags:
      - Authentication
    security:
      - JWT: []
    responses:
      200:
        description: Returns user profile details
      401:
        description: Invalid or expired token
    """
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({"message": "User not found."}), 404
        
    return jsonify(user.to_dict()), 200
