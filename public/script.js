document.addEventListener("DOMContentLoaded", function () {
  const uploadForm = document.getElementById("uploadForm");
  const resultDiv = document.getElementById("result");
  const fileInput = document.getElementById("documents");
  const loadingBar = document.getElementById("loadingBar");
  const loadingBarProgress =
    document.getElementById("loadingBarProgress");
  const loadingText = document.getElementById("loadingText");
  const loadingPercentage = document.getElementById("loadingPercentage");
  const categoryChartCanvas = document.getElementById("categoryChart");
  const downloadButton = document.getElementById("downloadButton");
  let categoryChart;
  let downloadLink = null;

  // Retrain model button click handler
  retrainButton.addEventListener("click", async () => {
    try {
      retrainButton.disabled = true;
      retrainingStatus.textContent = "Retraining model...";
      retrainingStatus.style.color = "rgb(11, 177, 215)";

      // Send request to retrain the model
      const response = await fetch("/retrain-model", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        retrainingStatus.textContent = "Model retrained successfully!";
        retrainingStatus.style.color = "rgb(11, 177, 215)";
      } else {
        retrainingStatus.textContent = `Retraining failed: ${result.message}`;
        retrainingStatus.style.color = "red";
      }
    } catch (error) {
      console.error("Retraining error:", error);
      retrainingStatus.textContent =
        "An error occurred during retraining.";
      retrainingStatus.style.color = "red";
    } finally {
      retrainButton.disabled = false;
    }
  });

  downloadButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/download-classified-zip");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "classified_documents.zip";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Could not download the classified documents.");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert(
        "An error occurred while downloading the classified documents."
      );
    }
  });

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    resultDiv.style.display = "none";
    downloadButton.style.display = "none";
    loadingBar.style.display = "block";
    loadingBarProgress.style.width = "0%";
    loadingPercentage.textContent = "0%";

    if (fileInput.files.length === 0) {
      resultDiv.innerHTML = `<strong>Error:</strong> No file selected. Please upload a ZIP file.`;
      resultDiv.style.display = "block";
      return;
    }

    const file = fileInput.files[0];
    if (!file.name.endsWith(".zip")) {
      resultDiv.innerHTML = `<strong>Error:</strong> Please upload a valid ZIP file.`;
      resultDiv.style.display = "block";
      return;
    }

    const maxFileSize = 12 * 1024 * 1024;
    if (file.size > maxFileSize) {
      resultDiv.innerHTML = `<strong>Error:</strong> File size exceeds 12 MB.`;
      resultDiv.style.display = "block";
      return;
    }

    const formData = new FormData();
    formData.append("documents", file);

    simulateProgressBar();

    try {
      const response = await fetch("/classify-zip", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      updateProgressBar(100);

      if (data.error) {
        resultDiv.innerHTML = `<strong>Error:</strong> ${data.error}`;
      } else {
        downloadButton.style.display = "block";
        retrainButton.style.display = "inline-block";

        const table = document.createElement("table");
        table.innerHTML = `
    <tr>
      <th>File Name</th>
      <th>Predicted Category</th>
      <th>Feedback</th>
    </tr>
  `;

        const categoryCounts = {};

        Object.entries(data.results).forEach(([fileName, category]) => {
          const cleanedCategory = category.replace(
            "Predicted Category: ",
            ""
          );
          const row = document.createElement("tr");
          row.innerHTML = `
      <td>${fileName}</td>
      <td>${cleanedCategory}</td>
      <td>
        <form class="feedbackForm">
          <select name="correctCategory">
            <option value="Choose a Category" selected>Choose a Category</option>
            <option value="business">business</option>
            <option value="education">education</option>
            <option value="healthcare">healthcare</option>
            <option value="politics">politics</option>
            <option value="sports">sports</option>
            <option value="tech">tech</option>
          </select>
          <button type="submit" data-file="${fileName}" data-category="${cleanedCategory}">Submit</button>
        </form>
      </td>
    `;
          table.appendChild(row);

          if (!categoryCounts[cleanedCategory]) {
            categoryCounts[cleanedCategory] = 0;
          }
          categoryCounts[cleanedCategory]++;
        });

        resultDiv.innerHTML = `
    <strong>Classification Results:</strong> 
    <p>Total Documents Classified: ${data.totalFiles}
  `;
        resultDiv.appendChild(table);

        document.querySelectorAll(".feedbackForm").forEach((form) => {
          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const button = e.target.querySelector("button");
            const fileName = button.getAttribute("data-file");
            const oldCategory = button.getAttribute("data-category");
            const newCategory = form.querySelector("select").value;

            if (newCategory !== "Choose a Category") {
              try {
                const response = await fetch("/submit-feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    fileName,
                    oldCategory,
                    newCategory,
                  }),
                });

                if (response.ok) {
                  alert("Feedback submitted successfully!");
                } else {
                  alert("Failed to submit feedback.");
                }
              } catch (error) {
                console.error("Feedback submission error:", error);
                alert("An error occurred while submitting feedback.");
              }
            }
          });
        });

        if (categoryChart) {
          categoryChart.destroy();
        }
        categoryChart = new Chart(categoryChartCanvas, {
          type: "bar",
          data: {
            labels: Object.keys(categoryCounts),
            datasets: [
              {
                label: "Number of Documents",
                data: Object.values(categoryCounts),
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      }
    } catch (err) {
      updateProgressBar(100);
      loadingText.textContent = "Error";
      resultDiv.innerHTML = `<strong>Error:</strong> Unable to classify documents.`;
    }

    resultDiv.style.display = "block";
    loadingBar.style.display = "none";
  });

  function simulateProgressBar() {
    let progress = 0;
    const interval = setInterval(() => {
      if (progress >= 90) {
        clearInterval(interval);
      } else {
        progress++;
        updateProgressBar(progress);
      }
    }, 150);
  }

  function updateProgressBar(progress) {
    loadingBarProgress.style.width = `${progress}%`;
    loadingPercentage.textContent = `${progress}%`;
  }
});
