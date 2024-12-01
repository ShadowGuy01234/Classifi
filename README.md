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

## Retraining (Optional)

Users can manually label additional data and use the retraining script to improve the model. Retrained models incorporate new insights to enhance future classification accuracy.

### Steps to Retrain
1. **Prepare the Labeled Data**:
   - Organize labeled data in directories where each directory corresponds to a category, and the files within are samples of that category.

2. **Run the Retraining Script**:
   - Use the `train_and_save_model.py` script to retrain the model. Provide the path to the labeled data directory as an argument.
   ```bash
   python train_and_save_model.py
   ```

3. **Save and Deploy the Updated Model**:
   - Once training is complete, the retrained model will be saved in the specified location as configured in the script.
   - Replace the old model with the retrained model in the appropriate directory to use it in future classifications.

4. **Deactivate Virtual Environment (Optional)**:
   - After retraining, you can deactivate the virtual environment:
   ```bash
   deactivate
   ```

---

## API Endpoints

### `GET /`
**Description**: Home page of the API.  
**Response**:
```json
"Welcome to ClassiFi API! Use POST /upload to classify your documents."
```

### `POST /upload`
**Description**: Upload a ZIP file containing documents to classify.  
**Request**: Upload a ZIP file using the key `file` in the form-data.  
Example CURL request:
```bash
curl -X POST -F "file=@path/to/your/file.zip" http://localhost:3000/upload
```
**Response**:
```json
"Files successfully uploaded and extracted!"
```

---

## File Structure

```
Classifi/
├── server/               # Backend server code
│   ├── app.js            # Main server file for handling requests
│   ├── python_model/     # Folder for Python model and related files
│   ├── uploads/          # Folder for storing uploaded files
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
