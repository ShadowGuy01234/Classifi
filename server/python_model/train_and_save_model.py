import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.metrics import classification_report, accuracy_score
from preprocess import clean_text  

def load_labeled_data_from_dirs(data_dir):
    """
    Load labeled data from a directory where each subdirectory is a label
    and contains text files.
    """
    data = []
    labels = []
    for label in os.listdir(data_dir):
        label_path = os.path.join(data_dir, label)
        if os.path.isdir(label_path):
            for file_name in os.listdir(label_path):
                file_path = os.path.join(label_path, file_name)
                ext = os.path.splitext(file_path)[1].lower()
                if ext == '.txt':
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                elif ext == '.pdf':
                    content = extract_text_from_pdf(file_path)
                elif ext == '.pptx':
                    content = extract_text_from_pptx(file_path)  
                else:
                    continue
                # Clean and preprocess the text
                data.append(clean_text(content))
                labels.append(label)
    return data, labels

def train_and_save_model(data_dir, model_path='model.pkl', vectorizer_path='vectorizer.pkl'):
    """
    Train an SVM model with GridSearchCV and save the best model and vectorizer.
    Includes confidence score calculation.
    """
    # Load labeled data
    print("Loading labeled data...")
    data, labels = load_labeled_data_from_dirs(data_dir)
    print("Splitting data into train and test sets...")
    X_train, X_test, y_train, y_test = train_test_split(data, labels, test_size=0.2, random_state=42, stratify=labels)
    
    print("Setting up pipeline and parameter grid...")
    pipeline = Pipeline([
        ('vectorizer', TfidfVectorizer()),
        ('classifier', SVC(probability=True))  # Enable probability estimates
    ])
    
    # Hyperparameter grid for GridSearchCV
    param_grid = {
        'vectorizer__max_features': [1000, 2000, 5000],
        'vectorizer__ngram_range': [(1, 1), (1, 2)],
        'classifier__C': [0.1, 1, 10],
        'classifier__kernel': ['linear', 'rbf']
    }
    
    # GridSearchCV for hyperparameter tuning
    print("Performing GridSearchCV...")
    grid_search = GridSearchCV(pipeline, param_grid, cv=3, n_jobs=-1, scoring='accuracy')
    grid_search.fit(X_train, y_train)
    
    # Get best model and vectorizer
    best_model = grid_search.best_estimator_
    print(f"Best parameters: {grid_search.best_params_}")
    
    print("Evaluating the model...")
    # Predictions with confidence scores
    y_pred = best_model.predict(X_test)
    y_pred_proba = best_model.predict_proba(X_test)
    
    # Calculate confidence scores
    confidence_scores = np.max(y_pred_proba, axis=1)
    
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print(classification_report(y_test, y_pred))
    
    # Print confidence score statistics
    print("\nConfidence Score Statistics:")
    print(f"Mean Confidence: {np.mean(confidence_scores):.4f}")
    print(f"Median Confidence: {np.median(confidence_scores):.4f}")
    print(f"Min Confidence: {np.min(confidence_scores):.4f}")
    print(f"Max Confidence: {np.max(confidence_scores):.4f}")
    
    # Save the model and vectorizer
    print(f"Saving the model to {model_path} and vectorizer to {vectorizer_path}...")
    joblib.dump(best_model.named_steps['classifier'], model_path)
    joblib.dump(best_model.named_steps['vectorizer'], vectorizer_path)
    
    np.savez('confidence_analysis.npz', 
             predictions=y_pred, 
             true_labels=y_test, 
             confidence_scores=confidence_scores)
    
    print("Training and saving completed.")

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
    
    pred_proba = classifier.predict_proba(text_vectorized)
    
    # Get prediction and confidence
    pred_label = classifier.classes_[np.argmax(pred_proba)]
    confidence = np.max(pred_proba)
    
    return {
        'prediction': pred_label,
        'confidence': confidence,
        'all_probabilities': dict(zip(classifier.classes_, pred_proba[0]))
    }

if __name__ == "__main__":
    data_dir = input("Enter the path to the labeled data directory: ").strip()
    train_and_save_model(data_dir)