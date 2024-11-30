import pickle
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

def create_model():
    """
    Create a Logistic Regression model.
    """
    return LogisticRegression(max_iter=1000)

def train_model(model, X_train, y_train):
    """
    Train the model with labeled data.
    """
    model.fit(X_train, y_train)

def evaluate_model(model, X_test, y_test):
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Accuracy: {accuracy:.2f}")
    print(classification_report(y_test, predictions, target_names=[
        "Tech", "Sports", "Politics", "Healthcare", "Education", "Business"
    ]))

def save_model(model, filename):
    """
    Save the trained model to a file.
    """
    with open(filename, 'wb') as f:
        pickle.dump(model, f)

def load_model(model_filename="model.pkl"):
    """
    Load the trained model from a file.
    """
    with open(model_filename, 'rb') as f:
        model = pickle.load(f)
    return model
