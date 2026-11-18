import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import shap

# Set seed for repeatability
np.random.seed(42)

def generate_uci_student_dataset(n_samples=600):
    """
    Generates a highly realistic synthetic representation of the UCI Student Performance Dataset,
    enhanced with custom features (attendance_pct, assignment_rate, sentiment_score)
    for dropout risk prediction.
    """
    print("Generating UCI Student Performance Dataset (34 features)...")
    
    # Standard categorical variables
    school = np.random.choice(['GP', 'MS'], size=n_samples, p=[0.8, 0.2])
    sex = np.random.choice(['F', 'M'], size=n_samples, p=[0.52, 0.48])
    age = np.random.randint(15, 22, size=n_samples)
    address = np.random.choice(['U', 'R'], size=n_samples, p=[0.75, 0.25])
    famsize = np.random.choice(['GT3', 'LE3'], size=n_samples, p=[0.70, 0.30])
    Pstatus = np.random.choice(['T', 'A'], size=n_samples, p=[0.90, 0.10])
    
    Medu = np.random.choice([0, 1, 2, 3, 4], size=n_samples, p=[0.05, 0.15, 0.30, 0.25, 0.25])
    Fedu = np.random.choice([0, 1, 2, 3, 4], size=n_samples, p=[0.05, 0.20, 0.30, 0.25, 0.20])
    
    jobs = ['teacher', 'health', 'services', 'at_home', 'other']
    Mjob = np.random.choice(jobs, size=n_samples, p=[0.15, 0.10, 0.20, 0.15, 0.40])
    Fjob = np.random.choice(jobs, size=n_samples, p=[0.10, 0.05, 0.25, 0.10, 0.50])
    
    reasons = ['home', 'reputation', 'course', 'other']
    reason = np.random.choice(reasons, size=n_samples, p=[0.25, 0.30, 0.35, 0.10])
    
    guardian = np.random.choice(['mother', 'father', 'other'], size=n_samples, p=[0.70, 0.22, 0.08])
    
    traveltime = np.random.choice([1, 2, 3, 4], size=n_samples, p=[0.60, 0.30, 0.07, 0.03])
    studytime = np.random.choice([1, 2, 3, 4], size=n_samples, p=[0.25, 0.50, 0.15, 0.10])
    failures = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.80, 0.12, 0.05, 0.03])
    
    schoolsup = np.random.choice(['yes', 'no'], size=n_samples, p=[0.10, 0.90])
    famsup = np.random.choice(['yes', 'no'], size=n_samples, p=[0.60, 0.40])
    paid = np.random.choice(['yes', 'no'], size=n_samples, p=[0.45, 0.55])
    activities = np.random.choice(['yes', 'no'], size=n_samples, p=[0.50, 0.50])
    nursery = np.random.choice(['yes', 'no'], size=n_samples, p=[0.80, 0.20])
    higher = np.random.choice(['yes', 'no'], size=n_samples, p=[0.90, 0.10])
    internet = np.random.choice(['yes', 'no'], size=n_samples, p=[0.85, 0.15])
    romantic = np.random.choice(['yes', 'no'], size=n_samples, p=[0.33, 0.67])
    
    famrel = np.random.randint(1, 6, size=n_samples)
    freetime = np.random.randint(1, 6, size=n_samples)
    goout = np.random.randint(1, 6, size=n_samples)
    Dalc = np.random.choice([1, 2, 3, 4, 5], size=n_samples, p=[0.65, 0.20, 0.10, 0.03, 0.02])
    Walc = np.random.choice([1, 2, 3, 4, 5], size=n_samples, p=[0.40, 0.30, 0.15, 0.10, 0.05])
    health = np.random.randint(1, 6, size=n_samples)
    
    # Custom/Derived columns that affect grades and absences directly
    attendance_pct = np.random.uniform(50.0, 100.0, size=n_samples)
    assignment_rate = np.random.uniform(40.0, 100.0, size=n_samples)
    sentiment_score = np.random.uniform(-0.8, 0.8, size=n_samples)
    
    # Absences correlates with attendance percentage
    absences = np.round((100.0 - attendance_pct) * 0.4 + np.random.randint(0, 5, size=n_samples)).astype(int)
    
    # Grades correlates with studytime, failures, absences, and attendance
    G1_base = 12 + (studytime * 1.5) - (failures * 3) - (absences * 0.2) + (sentiment_score * 2)
    G1 = np.round(np.clip(G1_base + np.random.normal(0, 1.5, size=n_samples), 0, 20)).astype(int)
    
    G2_base = G1 * 0.85 + (assignment_rate / 20)
    G2 = np.round(np.clip(G2_base + np.random.normal(0, 1.0, size=n_samples), 0, 20)).astype(int)
    
    G3_base = G2 * 0.90 + np.random.normal(0, 1.0, size=n_samples)
    G3 = np.round(np.clip(G3_base, 0, 20)).astype(int)
    
    # Define Target: Dropout Risk (1 = High Risk of dropout if G3 < 10 or attendance < 70% or failures > 1)
    dropout = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        risk_score = 0
        if G3[i] < 10:
            risk_score += 4
        if attendance_pct[i] < 70:
            risk_score += 3
        if failures[i] > 1:
            risk_score += 3
        if sentiment_score[i] < -0.3:
            risk_score += 2
        
        # Risk thresholds
        if risk_score >= 5 or (G3[i] < 8 and attendance_pct[i] < 65):
            dropout[i] = 1
            
    # Assemble into DataFrame
    df = pd.DataFrame({
        'school': school, 'sex': sex, 'age': age, 'address': address, 'famsize': famsize,
        'Pstatus': Pstatus, 'Medu': Medu, 'Fedu': Fedu, 'Mjob': Mjob, 'Fjob': Fjob,
        'reason': reason, 'guardian': guardian, 'traveltime': traveltime, 'studytime': studytime,
        'failures': failures, 'schoolsup': schoolsup, 'famsup': famsup, 'paid': paid,
        'activities': activities, 'nursery': nursery, 'higher': higher, 'internet': internet,
        'romantic': romantic, 'famrel': famrel, 'freetime': freetime, 'goout': goout,
        'Dalc': Dalc, 'Walc': Walc, 'health': health, 'absences': absences,
        'G1': G1, 'G2': G2, 'G3': G3, 'attendance_pct': attendance_pct,
        'assignment_rate': assignment_rate, 'sentiment_score': sentiment_score,
        'dropout': dropout
    })
    
    return df

def train_and_evaluate_models():
    df = generate_uci_student_dataset(600)
    
    # 1. Feature Preprocessing
    # Separate features and target
    X = df.drop(columns=['dropout'])
    y = df['dropout']
    
    # List of categorical features
    categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
    
    # Encode categorical variables
    encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le
        
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.20, random_state=42)
    
    print(f"Training shapes: Train={X_train.shape}, Test={X_test.shape}")
    
    # Define 4 models
    models = {
        "Logistic Regression": LogisticRegression(random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=5, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    }
    
    comparison_data = []
    trained_instances = {}
    
    print("\nTraining and evaluating models...")
    for name, model in models.items():
        # Train
        model.fit(X_train, y_train)
        trained_instances[name] = model
        
        # Predict
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else [0]*len(y_pred)
        
        # Metrics
        acc = accuracy_score(y_test, y_pred) * 100
        prec = precision_score(y_test, y_pred, zero_division=0) * 100
        rec = recall_score(y_test, y_pred, zero_division=0) * 100
        f1 = f1_score(y_test, y_pred, zero_division=0) * 100
        auc = roc_auc_score(y_test, y_prob) * 100
        
        comparison_data.append({
            "Model": name,
            "Accuracy (%)": round(acc, 2),
            "Precision (%)": round(prec, 2),
            "Recall (%)": round(rec, 2),
            "F1-Score (%)": round(f1, 2),
            "ROC-AUC (%)": round(auc, 2)
        })
        
    comparison_df = pd.DataFrame(comparison_data)
    print("\n========== MODEL COMPARISON REPORT ==========")
    print(comparison_df.to_string(index=False))
    print("=============================================\n")
    
    # Serialize the best model (XGBoost)
    best_model_name = "XGBoost"
    best_model = trained_instances[best_model_name]
    
    # Prepare model save directory
    save_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(save_dir, exist_ok=True)
    
    model_save_path = os.path.join(save_dir, 'model.pkl')
    explainer_save_path = os.path.join(save_dir, 'shap_explainer.pkl')
    
    # Save best model, scaler, and label encoders together
    model_package = {
        "model": best_model,
        "scaler": scaler,
        "encoders": encoders,
        "features": X.columns.tolist(),
        "metrics": comparison_df.to_dict(orient='records')
    }
    
    with open(model_save_path, 'wb') as f:
        pickle.dump(model_package, f)
        
    print(f"Serialized best model successfully to {model_save_path}")
    
    # Generate and serialize SHAP Explainer
    # XGBoost explainer can use TreeExplainer
    try:
        explainer = shap.TreeExplainer(best_model)
        with open(explainer_save_path, 'wb') as f:
            pickle.dump(explainer, f)
        print(f"Serialized SHAP TreeExplainer successfully to {explainer_save_path}")
    except Exception as e:
        print(f"Error compiling standard TreeExplainer, building fallback explainer: {e}")
        # Build simpler linear or kernel explainer if needed
        explainer = shap.Explainer(best_model, X_train)
        with open(explainer_save_path, 'wb') as f:
            pickle.dump(explainer, f)
        print("Serialized fallback SHAP Explainer.")
        
if __name__ == "__main__":
    train_and_evaluate_models()
