import sys
import os
import joblib
from preprocess import clean_text  
from PyPDF2 import PdfReader
from pptx import Presentation  
import docx  
import pandas as pd  
import json  

script_dir = os.path.dirname(os.path.abspath(__file__))

model_filename = os.path.join(script_dir, 'model.pkl')
vectorizer_filename = os.path.join(script_dir, 'vectorizer.pkl')

def extract_text_from_pdf(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""  
        return text.strip()
    except Exception as e:
        raise ValueError(f"Unable to extract text from {pdf_path}. Error: {e}")

def extract_text_from_pptx(pptx_path):

    try:
        presentation = Presentation(pptx_path)
        text = ""
        for slide in presentation.slides:
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text += " ".join(run.text for run in paragraph.runs) + " "
        return text.strip()
    except Exception as e:
        raise ValueError(f"Unable to extract text from {pptx_path}. Error: {e}")

def extract_text_from_docx(docx_path):

    try:
        doc = docx.Document(docx_path)
        text = " ".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise ValueError(f"Unable to extract text from {docx_path}. Error: {e}")

def extract_text_from_xlsx(xlsx_path):

    try:
        df = pd.read_excel(xlsx_path)
        text = " ".join(df.to_string(index=False))
        return text.strip()
    except Exception as e:
        raise ValueError(f"Unable to extract text from {xlsx_path}. Error: {e}")

def extract_text_from_json(json_path):

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            text = str(data)
        return text.strip()
    except Exception as e:
        raise ValueError(f"Unable to extract text from {json_path}. Error: {e}")

def classify_document(file_path):

    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"File {file_path} does not exist.")

    # Load the model and vectorizer
    try:
        model = joblib.load(model_filename)
    except FileNotFoundError:
        raise FileNotFoundError(f"Model file not found: {model_filename}")

    try:
        vectorizer = joblib.load(vectorizer_filename)
    except FileNotFoundError:
        raise FileNotFoundError(f"Vectorizer file not found: {vectorizer_filename}")

    # Read the content of the document based on file type
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == '.pdf':
            content = extract_text_from_pdf(file_path)
        elif ext == '.pptx':
            content = extract_text_from_pptx(file_path)
        elif ext == '.docx':
            content = extract_text_from_docx(file_path)
        elif ext == '.xlsx':
            content = extract_text_from_xlsx(file_path)
        elif ext == '.json':
            content = extract_text_from_json(file_path)
        elif ext in ['.txt', '.csv']:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        else:
            raise ValueError(f"Unsupported file type: {ext}")
    except Exception as e:
        print(f"Error extracting text: {e}")
        return "Unclassified"

    if not content or len(content.strip()) == 0:
        print(f"Warning: No extractable text from {file_path}")
        return "Unclassified"

    # Clean and preprocess the text
    try:
        cleaned_content = clean_text(content)
    except Exception as e:
        print(f"Error during text preprocessing: {e}")
        return "Unclassified"

    # Vectorize and classify
    try:
        vectorized_content = vectorizer.transform([cleaned_content])
        prediction = model.predict(vectorized_content)
        return prediction[0]
    except Exception as e:
        print(f"Error during classification: {e}")
        return "Unclassified"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python classifier.py <file_to_classify>")
        sys.exit(1)

    file_to_classify = sys.argv[1]
    try:
        predicted_category = classify_document(file_to_classify)
        print(f"Predicted Category: {predicted_category}")
    except Exception as e:
        print(f"Error: {e}")