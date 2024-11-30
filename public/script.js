document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const resultDiv = document.getElementById('result');
    const fileInput = document.getElementById('documents');
    const loadingBar = document.getElementById('loadingBar');
    const loadingBarProgress = document.getElementById('loadingBarProgress');
    const loadingText = document.getElementById('loadingText');
    const loadingPercentage = document.getElementById('loadingPercentage');
    const categoryChartCanvas = document.getElementById('categoryChart');
    const downloadButton = document.getElementById('downloadButton');
    let categoryChart; 
  
    uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      resultDiv.style.display = 'none';
      downloadButton.style.display = 'none';
      loadingBar.style.display = 'block';
      loadingBarProgress.style.width = '0%';
      loadingPercentage.textContent = '0%';
  
      if (fileInput.files.length === 0) {
        resultDiv.innerHTML = `<strong>Error:</strong> No file selected. Please upload a ZIP file.`;
        resultDiv.style.display = 'block';
        return;
      }
  
      const file = fileInput.files[0];
      if (!file.name.endsWith('.zip')) {
        resultDiv.innerHTML = `<strong>Error:</strong> Please upload a valid ZIP file.`;
        resultDiv.style.display = 'block';
        return;
      }
  
      const maxFileSize = 12 * 1024 * 1024; 
      if (file.size > maxFileSize) {
        resultDiv.innerHTML = `<strong>Error:</strong> File size exceeds 12 MB.`;
        resultDiv.style.display = 'block';
        return;
      }
  
      const formData = new FormData();
      formData.append('documents', file);
  
      simulateProgressBar();
  
      try {
        const response = await fetch('/classify-zip', {
          method: 'POST',
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
          const table = document.createElement('table');
          table.innerHTML = `
            <tr>
              <th>File Name</th>
              <th>Predicted Category</th>
            </tr>
          `;
  
          const categoryCounts = {}; 
  
          Object.entries(data.results).forEach(([fileName, category]) => {
            const cleanedCategory = category.replace('Predicted Category: ', '');
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${fileName}</td>
              <td>${cleanedCategory}</td>
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
  
          downloadButton.style.display = 'block';
          downloadButton.onclick = () => {
            window.location.href = '/download-classified-zip';
          };
  
          if (categoryChart) {
            categoryChart.destroy(); 
          }
          categoryChart = new Chart(categoryChartCanvas, {
            type: 'bar',
            data: {
              labels: Object.keys(categoryCounts),
              datasets: [{
                label: 'Number of Documents',
                data: Object.values(categoryCounts),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }
      } catch (err) {
        updateProgressBar(100); 
        loadingText.textContent = 'Error';
        resultDiv.innerHTML = `<strong>Error:</strong> Unable to classify documents.`;
      }
  
      resultDiv.style.display = 'block';
      loadingBar.style.display = 'none';
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
  