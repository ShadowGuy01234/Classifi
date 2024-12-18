import os
import json
import joblib
import shutil
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from preprocess import clean_text
from extract_text import (
    extract_text_from_pdf, 
    extract_text_from_pptx, 
    extract_text_from_docx,
    extract_text_from_csv,
    extract_text_from_excel,
    extract_text_from_json
)
from collections import Counter

def load_user_feedback(feedback_file):
    """
    Load user feedback from a JSON file.
    """
    try:
        with open(feedback_file, 'r', encoding='utf-8') as f:
            feedback = json.load(f)
        return feedback
    except Exception as e:
        print(f"Error loading feedback file: {e}")
        return []

def reorganize_files_by_feedback(uploads_dir, data_dir, feedback):
    """
    Reorganize files based on user feedback by moving them to correct directories.
    """
    extracted_dir = os.path.join(uploads_dir, 'extracted')
    
    for entry in feedback:
        filename = entry['fileName']
        old_category = entry['oldCategory']
        new_category = entry['newCategory']
        
        # Construct full paths
        old_category_dir = os.path.join(data_dir, old_category)
        new_category_dir = os.path.join(data_dir, new_category)
        
        file_path = os.path.join(extracted_dir, filename)
        
        os.makedirs(new_category_dir, exist_ok=True)
        
        # Move file to new category directory
        try:
            if os.path.exists(file_path):
                new_file_path = os.path.join(new_category_dir, filename)
                shutil.move(file_path, new_file_path)
                print(f"Moved {filename} from {old_category} to {new_category}")
            else:
                print(f"Warning: File {filename} not found in {extracted_dir}")
        except Exception as e:
            print(f"Error moving {filename}: {e}")

def load_labeled_data_from_dirs(data_dir):
    """
    Load labeled data from a directory where each subdirectory is a label.
    """
    data = []
    labels = []
    file_paths = []  # Track original file paths for confidence analysis
    for label in os.listdir(data_dir):
        label_path = os.path.join(data_dir, label)
        if os.path.isdir(label_path):
            for file_name in os.listdir(label_path):
                file_path = os.path.join(label_path, file_name)
                ext = os.path.splitext(file_path)[1].lower()
                
                try:
                    if ext == '.txt':
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                    elif ext == '.pdf':
                        content = extract_text_from_pdf(file_path)
                    elif ext == '.pptx':
                        content = extract_text_from_pptx(file_path)
                    elif ext == '.docx':
                        content = extract_text_from_docx(file_path)
                    elif ext == '.csv':
                        content = extract_text_from_csv(file_path)
                    elif ext == '.xlsx' or ext == '.xls':
                        content = extract_text_from_excel(file_path)
                    elif ext == '.json':
                        content = extract_text_from_json(file_path)
                    else:
                        continue

                    # Check for empty content
                    if not content or content.startswith("Error"):
                        print(f"Skipping {file_path}: No extractable content")
                        continue

                    # Clean and preprocess the text
                    clean_content = clean_text(content)
                    data.append(clean_content)
                    labels.append(label)
                    file_paths.append(file_path)
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    return data, labels, file_paths

def analyze_model_confidence(y_test, y_pred, y_pred_proba):
    """
    Analyze model prediction confidence.
    """
    confidence_scores = np.max(y_pred_proba, axis=1)
    incorrect_mask = y_test != y_pred
    
    return {
        'mean_confidence': np.mean(confidence_scores),
        'median_confidence': np.median(confidence_scores),
        'min_confidence': np.min(confidence_scores),
        'max_confidence': np.max(confidence_scores),
        'incorrect_mean_confidence': np.mean(confidence_scores[incorrect_mask]),
        'correct_mean_confidence': np.mean(confidence_scores[~incorrect_mask])
    }

def retrain_model_with_feedback(
    uploads_dir, 
    data_dir, 
    feedback_file='./feedback/feedback_log.json', 
    model_path='./python_model/model.pkl', 
    vectorizer_path='./python_model/vectorizer.pkl',
    confidence_analysis_path='./python_model/confidence_analysis.json'
):
    """
    Retrain the model based on user feedback with enhanced confidence analysis.
    """
    feedback = load_user_feedback(feedback_file)
    if not feedback:
        print("No feedback to process.")
        return

    reorganize_files_by_feedback(uploads_dir, data_dir, feedback)

    print("Loading updated labeled data...")
    data, labels, file_paths = load_labeled_data_from_dirs(data_dir)

    if not data:
        print("No data available for training. Cannot proceed.")
        return

    label_counts = Counter(labels)
    print("Label distribution:", label_counts)

    if len(set(labels)) < 2:
        print("Need at least two different labels to train a classifier. Cannot proceed.")
        return

    print("Splitting data into train and test sets...")
    
    try:
        X_train, X_test, y_train, y_test, train_paths, test_paths = train_test_split(
            data, labels, file_paths, test_size=0.2, random_state=42, stratify=labels
        )
    except ValueError:
        print("Cannot use stratified split. Falling back to non-stratified split.")
        X_train, X_test, y_train, y_test, train_paths, test_paths = train_test_split(
            data, labels, file_paths, test_size=0.2, random_state=42
        )

    print("Setting up pipeline and parameter grid...")
    pipeline = Pipeline([
        ('vectorizer', TfidfVectorizer()),
        ('classifier', SVC(probability=True))  
    ])

    param_grid = {
        'vectorizer__max_features': [500, 1000],
        'vectorizer__ngram_range': [(1, 1), (1, 2)],
        'classifier__C': [0.1, 1],
        'classifier__kernel': ['linear', 'rbf']
    }

    print("Performing GridSearchCV...")
    grid_search = GridSearchCV(pipeline, param_grid, cv=2, n_jobs=-1, scoring='accuracy')
    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_
    print(f"Best parameters: {grid_search.best_params_}")

    print("Evaluating the model...")
    y_pred = best_model.predict(X_test)
    y_pred_proba = best_model.predict_proba(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print(classification_report(y_test, y_pred))

    # Confidence analysis
    confidence_results = analyze_model_confidence(y_test, y_pred, y_pred_proba)
    print("\nConfidence Analysis:")
    for key, value in confidence_results.items():
        print(f"{key}: {value:.4f}")

    # Save confidence analysis
    with open(confidence_analysis_path, 'w') as f:
        json.dump(confidence_results, f, indent=4)

    # Save the model and vectorizer
    print(f"Saving the model to {model_path} and vectorizer to {vectorizer_path}...")
    joblib.dump(best_model.named_steps['classifier'], model_path)
    joblib.dump(best_model.named_steps['vectorizer'], vectorizer_path)
    
    prediction_details = {
        'test_paths': test_paths,
        'true_labels': y_test.tolist(),
        'predicted_labels': y_pred.tolist(),
        'confidence_scores': confidence_results
    }
    
    with open('./python_model/prediction_details.json', 'w') as f:
        json.dump(prediction_details, f, indent=4)
    
    print("Retraining and saving completed.")

def predict_with_confidence(model_path, vectorizer_path, text):
    """
    Load saved model and vectorizer to make a prediction with confidence score.
    """
    # Load saved model and vectorizer
    vectorizer = joblib.load(vectorizer_path)
    classifier = joblib.load(model_path)
    
    # Preprocess and vectorize input text
    processed_text = clean_text(text)
    text_vectorized = vectorizer.transform([processed_text])
    
    # Predict with probability
    pred_proba = classifier.predict_proba(text_vectorized)
    
    # Get prediction and confidence
    pred_label = classifier.classes_[np.argmax(pred_proba)]
    confidence = np.max(pred_proba)
    
    return {
        'prediction': pred_label,
        'confidence': float(confidence),
        'all_probabilities': dict(zip(classifier.classes_, pred_proba[0].tolist()))
    }

def main():
    uploads_dir = "./uploads"
    data_dir = "./uploads/extracted"
    feedback_file = './feedback/feedback_log.json'
    
    retrain_model_with_feedback(uploads_dir, data_dir, feedback_file)

if __name__ == "__main__":
    main()