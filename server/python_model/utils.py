import os
from sklearn.model_selection import train_test_split

def load_documents(folder_path):
    documents = []
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                documents.append(f.read())
    return documents

def split_data(X, y, test_size=0.2, random_state=42):

    return train_test_split(X, y, test_size=test_size, random_state=random_state)

def map_labels_to_categories(predictions):

    CATEGORY_MAP = {
        0: "Tech",
        1: "Sports",
        2: "Politics",
        3: "Healthcare",
        4: "Education",
        5: "Business"
    }
    return [CATEGORY_MAP[label] for label in predictions]

def print_predictions(documents, categories):

    for doc, category in zip(documents, categories):
        print(f"Document: {doc[:50]}... -> Category: {category}")
