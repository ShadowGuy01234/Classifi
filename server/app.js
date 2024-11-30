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
app.use(express.static(path.join(__dirname, "../public")));

const upload = multer({ dest: path.join(__dirname, "uploads/") });

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

// Route for ZIP file upload and classification
app.post("/classify-zip", upload.single("documents"), async (req, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const zipFilePath = uploadedFile.path;
  const extractPath = path.join(__dirname, "uploads", "extracted");
  const classifiedOutputPath = path.join(__dirname, "uploads", "classified");

  try {
    if (fs.existsSync(classifiedOutputPath)) {
      fs.rmSync(classifiedOutputPath, { recursive: true, force: true });
    }

    fs.mkdirSync(extractPath, { recursive: true });
    fs.mkdirSync(classifiedOutputPath, { recursive: true });
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
    const results = {};
    for (const file of files) {
      const filePath = path.join(extractPath, file);
      const textContent = await extractTextFromFile(filePath);

      if (textContent !== "Error during text extraction") {
        const classification = await new Promise((resolve, reject) => {
          exec(
            `python3 ./python_model/classifier.py "${filePath}"`,
            (error, stdout, stderr) => {
              if (error) {
                console.error(`Error classifying ${file}: ${stderr}`);
                resolve("Error during classification");
              } else {
                resolve(stdout.trim());
              }
            }
          );
        });
        const cleanedCategory = classification
          .replace("Predicted Category: ", "")
          .replace(/\s+/g, "_");
        const categoryPath = path.join(classifiedOutputPath, cleanedCategory);
        fs.mkdirSync(categoryPath, { recursive: true });
        const destinationPath = path.join(categoryPath, file);
        fs.copyFileSync(filePath, destinationPath);

        results[file] = classification;
      } else {
        results[file] = "Error: Unable to extract text";
      }
    }

    // ZIP file of the classified documents
    const outputZipPath = path.join(
      __dirname,
      "uploads",
      "classified_documents.zip"
    );
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        res.json({
          results,
          downloadLink: "/download-classified-zip",
          totalFiles: Object.keys(results).length,
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
    res
      .status(500)
      .json({
        error: "An error occurred during ZIP extraction or classification.",
      });
  } finally {
    fs.rmSync(zipFilePath, { force: true });
    fs.rmSync(extractPath, { recursive: true, force: true });
  }
});

// Route to download the classified ZIP file
app.get("/download-classified-zip", (req, res) => {
  const zipPath = path.join(__dirname, "uploads", "classified_documents.zip");

  res.download(zipPath, "classified_documents.zip", (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).send("Could not download the file");
    }

    fs.rmSync(zipPath, { force: true });
  });
});

// Star Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});