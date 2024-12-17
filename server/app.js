const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");
const util = require("util");
const archiver = require("archiver"); 
const execPromise = util.promisify(exec);

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files including the uploads directory
app.use(express.static(path.join(__dirname, "../public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, "uploads");
const uploadedFilesDir = path.join(uploadsDir, "uploaded_files");
const extractPath = path.join(uploadsDir, "extracted");
const classifiedOutputPath = path.join(uploadsDir, "classified");

[uploadsDir, uploadedFilesDir, extractPath, classifiedOutputPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadedFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let extractedText = "";

  try {
    switch (ext) {
      case ".pdf":
        extractedText = (
          await execPromise(
            `python ./python_model/extract_text.py --pdf "${filePath}"`
          )
        ).stdout.trim();
        break;
      case ".docx":
        extractedText = (
          await execPromise(
            `python ./python_model/extract_text.py --docx "${filePath}"`
          )
        ).stdout.trim();
        break;
      case ".csv":
        extractedText = (
          await execPromise(
            `python ./python_model/extract_text.py --csv "${filePath}"`
          )
        ).stdout.trim();
        break;
      case ".xlsx":
        extractedText = (
          await execPromise(
            `python ./python_model/extract_text.py --excel "${filePath}"`
          )
        ).stdout.trim();
        break;
      case ".json":
        extractedText = (
          await execPromise(
            `python ./python_model/extract_text.py --json "${filePath}"`
          )
        ).stdout.trim();
        break;
      case ".txt":
        extractedText = fs.readFileSync(filePath, "utf-8");
        break;
      case ".pptx":
        extractedText = (
          await execPromise(
            `python ./python_model/extract_text.py --pptx "${filePath}"`
          )
        ).stdout.trim();
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (err) {
    console.error(`Error extracting text from file: ${filePath}`, err);
    extractedText = "Error during text extraction";
  }

  return extractedText;
};

// Function to reset feedback log
const resetFeedbackLog = () => {
  const feedbackDir = path.join(__dirname, "feedback");
  const feedbackFilePath = path.join(feedbackDir, "feedback_log.json");

  if (!fs.existsSync(feedbackDir)) {
    fs.mkdirSync(feedbackDir, { recursive: true });
  }

  fs.writeFileSync(feedbackFilePath, JSON.stringify([], null, 2), "utf-8");
};

// Route for feedback submission
app.post("/submit-feedback", (req, res) => {
  const { fileName, oldCategory, newCategory } = req.body;
  const feedbackEntry = {
    timestamp: new Date().toISOString(),
    fileName,
    oldCategory,
    newCategory
  };

  const feedbackDir = path.join(__dirname, 'feedback');
  const feedbackFilePath = path.join(feedbackDir, 'feedback_log.json');

  try {
    let feedbackData = [];
    if (fs.existsSync(feedbackFilePath)) {
      feedbackData = JSON.parse(fs.readFileSync(feedbackFilePath, 'utf-8'));
    }

    feedbackData.push(feedbackEntry);

    fs.writeFileSync(feedbackFilePath, JSON.stringify(feedbackData, null, 2), 'utf-8');

    console.log("Feedback submitted and logged:", feedbackEntry);
    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error logging feedback:", error);
    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
});

// Route for ZIP file upload and classification
app.post("/classify-zip", upload.single("documents"), async (req, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  resetFeedbackLog();

  const zipFilePath = uploadedFile.path;

  try {
    if (fs.existsSync(classifiedOutputPath)) {
      fs.rmSync(classifiedOutputPath, { recursive: true, force: true });
    }
    fs.mkdirSync(classifiedOutputPath, { recursive: true });

    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    fs.mkdirSync(extractPath, { recursive: true });

    // Extract ZIP file
    await fs
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    const files = fs.readdirSync(extractPath);

    if (files.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid files found in the ZIP." });
    }

    const classificationResults = await new Promise((resolve, reject) => {
      exec(
        `python ./python_model/classifier.py "${extractPath}"`,
        (error, stdout, stderr) => {
          if (error) {
            console.error("Classification error:", stderr);
            reject(error);
          } else {
            // Parse the classification results
            const results = {};
            stdout.trim().split('\n').forEach(line => {
              if (line.includes(': ')) {
                const [filePath, category] = line.split(': ');
                results[path.basename(filePath)] = category.trim();
              }
            });
            resolve(results);
          }
        }
      );
    });

    // Organize files into category folders
    const fileLinks = [];
    for (const file of files) {
      const sourceFilePath = path.join(extractPath, file);
      
      const category = classificationResults[file] || "Unclassified";
      const cleanedCategory = category
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");

      // Create category folder if it doesn't exist
      const categoryPath = path.join(classifiedOutputPath, cleanedCategory);
      fs.mkdirSync(categoryPath, { recursive: true });

      const destinationPath = path.join(categoryPath, file);
      fs.copyFileSync(sourceFilePath, destinationPath);

      const relativeFilePath = path.relative(path.join(__dirname, 'uploads'), destinationPath);
      fileLinks.push({
        fileName: file,
        category: cleanedCategory,
        link: `/uploads/${relativeFilePath.replace(/\\/g, '/')}`
      });
    }

    // Create ZIP of classified documents
    const outputZipPath = path.join(uploadsDir, "classified_documents.zip");
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        res.json({
          results: classificationResults,
          downloadLink: "/download-classified-zip",
          totalFiles: Object.keys(classificationResults).length,
          fileLinks: fileLinks
        });
        resolve();
      });

      archive.on("error", (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(classifiedOutputPath, false);
      archive.finalize();
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred during ZIP extraction or classification.",
    });
  }
});

// Route to download the classified ZIP file
app.get("/download-classified-zip", (req, res) => {
  const zipPath = path.join(uploadsDir, "classified_documents.zip");

  res.download(zipPath, "classified_documents.zip", (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).send("Could not download the file");
    }
    fs.rmSync(zipPath, { force: true });
  });
});

// Route to retrain the model
app.post("/retrain-model", async (req, res) => {
  try {
    // Execute the Python script for model retraining
    const { stdout, stderr } = await execPromise(
      "python ./python_model/retrain_on_feedback.py"
    );

    console.log("Standard Output:", stdout);
    console.log("Standard Error:", stderr);

    const isActualError = stderr && 
      !stderr.includes('[nltk_data]') && 
      stderr.trim() !== '';

    if (isActualError) {
      console.error("Retraining error:", stderr);
      return res.status(500).json({ 
        success: false, 
        message: "Error during model retraining",
        error: stderr 
      });
    }

    console.log("Model retrained successfully:", stdout);
    res.status(200).json({ 
      success: true, 
      message: "Model retrained successfully",
      output: stdout 
    });
  } catch (error) {
    console.error("Retraining failed:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrain model",
      error: error.message 
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});