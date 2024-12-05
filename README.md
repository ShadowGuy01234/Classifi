# ClassiFi: AI-Based Document Classification System

ClassiFi is an AI-powered document classification system designed to automate and streamline the organization of documents. Built using Node.js for the backend, Express.js for the server, and a customizable Python AI model, ClassiFi makes it easy to classify and organize large sets of documents across various industries.

---

## Features
- **File Upload**: Upload ZIP files containing documents to classify.
- **File Extraction**: Automatically extracts uploaded ZIP files for further processing.
- **Multiple File Format Support**: Supports PPT, PDF, TXT, CSV, JSON, and DOCX files.
- **AI Model Integration**: Uses a customizable Python-based model for document classification.
- **Scalable Backend**: Built with Node.js and Express.js.
- **Customizable Model Retraining**: Add labeled data and retrain the classification model as needed.
- **Feedback Integration**: Allows users to provide feedback on classifications to improve model accuracy.

---

## Real-World Applications
ClassiFi can be applied to various industries, including:
- **Corporate Knowledge Management**: Automating the classification of internal documents, emails, and meeting notes.
- **Healthcare**: Categorizing medical records, research papers, and patient data.
- **Legal and Compliance**: Organizing case files, compliance documents, and regulations.
- **E-Governance**: Streamlining government services by classifying public records and citizen feedback.
- **Education**: Organizing academic resources such as lecture notes and research papers.
- **Media and Publishing**: Automating the classification of news articles and multimedia content.
- **Customer Support**: Categorizing support tickets, feedback, and queries to enhance service delivery.

---

## Installation

### Prerequisites
- **Node.js** (v14.x or later)
- **Python** (v3.x or later)
- **npm** (installed with Node.js)

### Steps to Install
1. **Clone the repository**:
   ```bash
   git clone https://github.com/ShadowGuy01234/Classifi.git
   cd Classifi
   ```

2. **Install Backend Dependencies**:
   Navigate to the `server` directory and install the required dependencies:
   ```bash
   cd server
   npm install
   ```

3. **Set Up a Python Virtual Environment**:
   Navigate to the `python_model` directory and create a virtual environment:
   ```bash
   cd python_model
   python -m venv venv
   ```
   Activate the virtual environment:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install Python Dependencies**:
   Install the required Python libraries:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set Up Directories**:
   Ensure the `uploads` directory is created for storing uploaded files:
   ```bash
   mkdir ../uploads
   ```

---

## Usage

### Starting the Server
- **For Production**:
  ```bash
  node app.js
  ```

- **For Development**:
  Use `nodemon` for automatic server restart during development:
  ```bash
  npm run dev
  ```

The server will be running at [http://localhost:3000](http://localhost:3000).

---

## Feedback and Model Retraining

ClassiFi includes a powerful **Feedback System** that allows users to provide feedback on classification results. This feedback is used to retrain and improve the AI model over time.

### How It Works:
1. **Feedback Submission**:  
   Users can review the classification results and submit corrections for any misclassified documents. The feedback is logged in a JSON file named `feedback_log.json`, stored in the `feedback` directory.

2. **Model Retraining**:  
   The feedback data is processed by the `retrain_on_feedback.py` script, which updates the model to reflect the corrections provided by users.

---

### Retraining with Feedback

To use the feedback for retraining the model, follow these steps:

1. **Ensure Feedback is Logged**:  
   Verify that the `feedback/feedback_log.json` file contains user feedback in the following format:
   ```json
   [
     {
       timestamp: "example_time",
       file_name: "example.pdf",
       oldCategory: "Business",
       newCategory: "Education"
     },
   ]
   ```

2. **Run the Retraining Script**:  
   Use the `retrain_on_feedback.py` script to incorporate feedback and update the model:
   ```bash
   python retrain_on_feedback.py
   ```

3. **Deploy the Updated Model**:  
   After retraining, replace the old model with the updated model to ensure the latest changes are applied to future classifications.

---

## File Structure

```
Classifi/
├── server/               # Backend server code
│   ├── app.js            # Main server file for handling requests
│   ├── python_model/     # Folder for Python model and related files
│   ├── uploads/          # Directory for storing uploaded files
│   ├── feedback/         # Directory for storing feedback data
│   └── package.json      # Project metadata and backend dependencies
├── public/               # Frontend files (HTML, CSS, JS)
│   ├── index.html        # Main HTML file
│   ├── styles.css        # Contains styles
│   └── script.js         # Contains JavaScript scripts
└── README.md             # Project documentation
```

---

## Dependencies

### Backend Dependencies
| Dependency | Purpose |
|------------|---------|
| `express`  | Web framework for building the server and handling routes. |
| `multer`   | Middleware for handling file uploads. |
| `unzipper` | Library for extracting ZIP files. |
| `nodemon`  | Development tool for auto-reloading the server whenever files are updated. |

Install the backend dependencies:
```bash
npm install
```

### Python Dependencies
Install the required Python libraries inside the virtual environment:
```bash
pip install -r python_model/requirements.txt
```