# ClassiFi: AI-Based Document Classification System

ClassiFi is an AI-powered document classification system designed to automate and streamline the organization of documents. Built using **Node.js** for the backend, **Express.js** for the server, and a customizable **Python AI model**, ClassiFi makes it easy to classify and organize large sets of documents across various industries.

---

## Features

- **File Upload**: Upload ZIP files containing documents to classify.
- **File Extraction**: Automatically extracts uploaded ZIP files for further processing.
- **Multiple File Format Support**: Supports **PPT**, **PDF**, **TXT**, **CSV**, **JSON**, and **DOCX** files.
- **AI Model Integration**: Uses a customizable Python-based model for document classification.
- **Scalable Backend**: Built with **Node.js** and **Express.js**.
- **Customizable Model Retraining**: Add labeled data and retrain the classification model as needed.

---

## Real-World Applications

ClassiFi can be applied to a wide range of industries and domains, including:

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
   Navigate to the `server` directory and install the dependencies:
   ```bash
   cd server
   npm install
   ```

3. **Install Python Dependencies**:
   Navigate to the `python_model` directory and install the required Python libraries:
   ```bash
   cd python_model
   pip install -r requirements.txt
   ```

4. **Set Up Directories**:
   Ensure the `uploads` directorie is created for storing uploaded files:
   ```bash
   mkdir server/uploads 
   ```

---

## Usage

### Starting the Server

#### For Production:
Start the server in production mode:
```bash
node server/app.js
```

#### For Development:
For automatic server restart during development, use `nodemon`:
```bash
npm run dev
```

The server will be running at `http://localhost:3000`.

---

### API Endpoints

#### `GET /`
- **Description**: Home page of the API.
- **Response**:  
  `"Welcome to ClassiFi API! Use POST /upload to classify your documents."`

#### `POST /upload`
- **Description**: Upload a ZIP file containing documents to classify.
- **Request**: Upload a ZIP file using the key `file` in the form-data.
  Example `curl` request:
  ```bash
  curl -X POST -F "file=@path/to/your/file.zip" http://localhost:3000/upload
  ```
- **Response**:  
  `"Files successfully uploaded and extracted!"`

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
│   └── index.html        # Main HTML file
|   └── styes.css         # Contains styles
|   └── script.js         # Contains js scripts 
└── README.md             # Project documentation
```

---

## Dependencies

### Backend Dependencies

| **Dependency** | **Purpose**                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `express`      | Web framework for building the server and handling routes.                  |
| `multer`       | Middleware for handling file uploads.                                       |
| `unzipper`     | Library for extracting ZIP files.                                           |
| `nodemon`      | Development tool for auto-reloading the server whenever files are updated.  |

Install the backend dependencies:
```bash
npm install
```

### Python Dependencies

If you're using a Python model, ensure the required libraries are installed:
```bash
pip install -r python_model/requirements.txt
```
