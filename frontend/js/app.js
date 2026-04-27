let chart = null;
let csvData = [];
let totalAnalyses = 0;
let totalFake = 0;
let totalGenuine = 0;

/* =========================
   UTIL FUNCTIONS
========================= */

// Animate numbers safely
function animateValue(id, start, end, duration) {
  const el = document.getElementById(id);
  if (!el) return;

  if (start === end) {
    el.innerText = end + "%";
    return;
  }

  let current = start;
  const range = end - start;
  const increment = range > 0 ? 1 : -1;
  const stepTime = Math.max(10, Math.floor(duration / Math.abs(range)));

  const timer = setInterval(() => {
    current += increment;
    el.innerText = current + "%";
    if (current === end) clearInterval(timer);
  }, stepTime);
}

// Typing effect
function typeEffect(element, text, speed = 20) {
  if (!element) return;

  element.innerHTML = "";
  let i = 0;

  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }

  typing();
}

// Highlight suspicious words
function highlightText(review) {
  const patterns = [
    /\b(amazing|best|perfect|incredible|awesome)\b/gi,
    /\b(100%|guaranteed|no doubt)\b/gi,
    /\b(buy now|must buy|highly recommended)\b/gi,
    /!{2,}/g,
    /\b(very very|so so|extremely)\b/gi
  ];

  let highlighted = review;

  patterns.forEach(pattern => {
    highlighted = highlighted.replace(pattern, match => {
      return `<span style="
        background: rgba(239,68,68,0.2);
        padding: 2px 4px;
        border-radius: 4px;
        color: #f87171;
        font-weight: 500;
      ">${match}</span>`;
    });
  });

  return highlighted;
}

// Generate explanation
function generateReasons(fake, genuine) {
  if (fake > 70) {
    return [
      "Excessive promotional language detected",
      "Lacks detailed product experience",
      "Patterns match common fake reviews"
    ];
  } else if (genuine > 70) {
    return [
      "Natural and balanced tone",
      "Contains specific user experience",
      "Language variation indicates authenticity"
    ];
  } else {
    return [
      "Mixed sentiment detected",
      "Some generic phrases present",
      "Needs manual verification"
    ];
  }
}

// API call
const API_URL = "https://fake-review-ai-l79p.onrender.com";

async function getPrediction(review) {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("API ERROR:", text);
    throw new Error("API Error");
  }

  return res.json();
}

function updateChart(fake, genuine) {
    const canvas = document.getElementById("chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Destroy previous chart safely
    if (chart instanceof Chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Fake", "Genuine"],
            datasets: [{
                data: [fake, genuine],
                backgroundColor: [
                    "#B5D8A7",
                    "#5FB08A"
                ],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            animation: {
                animateRotate: true,
                animateScale: true
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/* =========================
   SINGLE REVIEW ANALYSIS
========================= */

async function analyze() {
    const reviewEl = document.getElementById("review");
    const categoryEl = document.getElementById("category");
    const loader = document.getElementById("loader");

    if (!reviewEl) return;

    const review = reviewEl.value.trim();
    const category = categoryEl ? categoryEl.value : "electronics";

    if (!review) {
        alert("Enter a review first.");
        return;
    }

    loader?.classList.remove("hidden");

    try {
        const data = await getPrediction(review, category);

        loader?.classList.add("hidden");

        const fake = Math.round(data.fake_percentage);
        const genuine = Math.round(data.genuine_percentage);
        const confidence = Math.round(data.confidence);

        // TEXT VALUES
        document.getElementById("fakeText").innerText = fake + "%";
        document.getElementById("genuineText").innerText = genuine + "%";
        document.getElementById("confidenceText").innerText = confidence + "%";

        // ANIMATED PROGRESS BARS
        setTimeout(() => {
            document.getElementById("fakeBar").style.width = fake + "%";
            document.getElementById("genuineBar").style.width = genuine + "%";
            document.getElementById("confidenceBar").style.width = confidence + "%";
        }, 100);

        // CENTER LABEL
        const centerLabel = document.getElementById("centerLabel");
        if (centerLabel) {
            centerLabel.textContent = fake > genuine ? "Fake" : "Genuine";
        }

        // HIGHLIGHTED REVIEW
        const highlightEl = document.getElementById("highlightedText");
        if (highlightEl) {
            highlightEl.innerHTML = highlightText(review);
        }

        // CHART
        updateChart(fake, genuine);

        // AI INSIGHT
        const insight =
            fake > 75
                ? "Strong indicators of manipulation detected."
                : genuine > 75
                ? "This review appears authentic and natural."
                : "Mixed signals detected. Manual review recommended.";

        typeEffect(document.getElementById("insight"), insight);

        // REASONS
        const reasons = generateReasons(fake, genuine);
        const list = document.getElementById("reasons");

        if (list) {
            list.innerHTML = "";

            reasons.forEach(reason => {
                const li = document.createElement("li");
                li.className = "text-gray-400";
                li.textContent = "• " + reason;
                list.appendChild(li);
            });
        }

        addToHistory(
            review,
            category,
            fake,
            genuine,
            confidence
        );

    } catch (err) {
        loader?.classList.add("hidden");
        alert("Backend error");
        console.error(err);
    }
}

// ======================================
// CSV MODE MANAGEMENT
// ======================================

let appendCSVMode = false;

function resetCSVAnalysis() {
    if (!appendCSVMode) {
        resetCSVAnalysis();
    }

    const historyTable = document.getElementById("historyTable");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    if (historyTable) historyTable.innerHTML = "";

    if (progressBar) progressBar.style.width = "0%";

    if (progressText) {
        progressText.textContent = "0 / 0 processed";
    }

    totalAnalyses = 0;
    totalFake = 0;
    totalGenuine = 0;

    document.getElementById("totalAnalyses").textContent = "0";
    document.getElementById("totalFake").textContent = "0";
    document.getElementById("totalGenuine").textContent = "0";
}

function enableAppendCSVButton() {
    let button = document.getElementById("appendCSVBtn");

    if (button) return;

    const analyzeButton = document.querySelector(
        '#csvSection button[onclick="analyzeCSV()"]'
    );

    button = document.createElement("button");
    button.id = "appendCSVBtn";
    button.textContent = "Add Another CSV";
    button.className =
        "w-full py-3 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition mt-3";

    button.onclick = () => {
        appendCSVMode = true;
        document.getElementById("csvFile").click();
    };

    analyzeButton.insertAdjacentElement("afterend", button);
}

document.getElementById("csvFile").addEventListener("change", () => {
    const fileInput = document.getElementById("csvFile");
    const fileBox = document.getElementById("fileBox");
    const fileName = document.getElementById("fileName");

    if (!fileInput.files.length) return;

    fileName.textContent = fileInput.files[0].name;
    fileBox.classList.remove("hidden");

    // Auto-analyze when adding another CSV
    if (appendCSVMode) {
        analyzeCSV();
    }
});


/* =========================
   CSV ANALYSIS
========================= */

async function analyzeCSV() {
    // Hide single-review sections
    [
        "statsSection",
        "insightSection",
        "reasonsSection",
        "highlightSection"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = "none";
        }
    });

    const fileInput = document.getElementById("csvFile");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const historyTable = document.getElementById("historyTable");
    const centerLabel = document.getElementById("centerLabel");

    
    if (!selectedCSVFiles.length) {
        alert("Upload a CSV file first.");
        return;
    }

    const file = selectedCSVFiles[0];

    csvData = [];
    progressBar.style.width = "0%";
    progressText.textContent = "0 / 0 processed";

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,

        complete: async function(results) {
            const rows = results.data;

            if (!rows.length) {
                alert("CSV file is empty.");
                return;
            }

            let reviewKey = Object.keys(rows[0]).find(key => {
                const cleaned = key
                    .replace(/^\uFEFF/, "")
                    .trim()
                    .toLowerCase();

                return cleaned.includes("review") ||
                       cleaned.includes("text");
            });

            if (!reviewKey) {
                reviewKey = Object.keys(rows[0])[0];
            }

            const total = rows.length;

            for (let i = 0; i < total; i++) {
                const review = rows[i][reviewKey]?.trim();
                if (!review) continue;

                try {
                    const result = await getPrediction(review);

                    const fake = Math.round(result.fake_percentage);
                    const genuine = Math.round(result.genuine_percentage);
                    const confidence = Math.round(result.confidence);

                    csvData.push({
                        review,
                        fake,
                        genuine,
                        confidence
                    });

                    // Update counters
                    totalAnalyses++;
                    if (fake > genuine) {
                        totalFake++;
                    } else {
                        totalGenuine++;
                    }

                    document.getElementById("totalAnalyses").textContent = totalAnalyses;
                    document.getElementById("totalFake").textContent = totalFake;
                    document.getElementById("totalGenuine").textContent = totalGenuine;

                    // Add history row
                    const badge = fake > genuine
                        ? `<span class="px-2 py-1 rounded-full text-xs font-semibold text-red-400 bg-red-500/10">FAKE</span>`
                        : `<span class="px-2 py-1 rounded-full text-xs font-semibold text-green-400 bg-green-500/10">GENUINE</span>`;

                    const time = new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                    });

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td class="py-4 px-3 max-w-xs truncate">${review}</td>
                        <td class="px-3">csv-upload</td>
                        <td class="px-3">${badge}</td>
                        <td class="px-3">${fake}%</td>
                        <td class="px-3">${genuine}%</td>
                        <td class="px-3">${confidence}%</td>
                        <td class="px-3 text-gray-400">${time}</td>
                    `;

                    historyTable.insertBefore(row, historyTable.firstChild);

                    // Update chart only
                    if (typeof updateChart === "function") {
                        updateChart(fake, genuine);
                    }

                    if (centerLabel) {
                        centerLabel.textContent =
                            fake > genuine ? "Fake" : "Genuine";
                    }

                    // Update progress
                    const progress = Math.round(((i + 1) / total) * 100);
                    progressBar.style.width = progress + "%";
                    progressText.textContent =
                        `${i + 1} / ${total} processed`;

                } catch (error) {
                    console.error(`Row ${i + 1} failed:`, error);
                }
            }

            progressText.textContent =
                `Completed: ${csvData.length} reviews processed`;

            enableAppendCSVButton();
            appendCSVMode = false;
            fileInput.value = "";
        }
    });

    enableAppendCSVButton();
    appendCSVMode = false;
    fileInput.value = "";
}

/* =========================
   DOWNLOAD CSV
========================= */

function downloadCSV() {
  if (!csvData.length) {
    alert("No data to download.");
    return;
  }

  let csv = "review,fake_percentage,genuine_percentage\n";

  csvData.forEach(row => {
    csv += `"${row.review.replace(/"/g, '""')}",${row.fake},${row.genuine}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "analysis_results.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/* =========================
   FILE NAME DISPLAY
========================= */

window.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csvFile");
  const fileBox = document.getElementById("fileBox");
  const fileName = document.getElementById("fileName");
  const removeBtn = document.getElementById("removeFile");

  if (!fileInput) return;

  // When file is selected
  fileInput.addEventListener("change", function () {
    if (this.files.length > 0) {
      fileName.innerText = this.files[0].name;
      fileBox.classList.remove("hidden"); // show box
    }
  });

  // Remove file
  removeBtn.addEventListener("click", () => {
    fileInput.value = ""; // clear input
    fileBox.classList.add("hidden"); // hide box
    fileName.innerText = "";
  });
});

/* =========================
   dashboard seperation
========================= */


function showSection(section) {
    const reviewSection = document.getElementById("reviewSection");
    const csvSection = document.getElementById("csvSection");
    const csvProgressSection = document.getElementById("csvProgressSection");
    const chatSection = document.getElementById("chatSection");

    const reviewTab = document.getElementById("reviewTab");
    const csvTab = document.getElementById("csvTab");

    const singleReviewSections = [
        document.querySelector("#highlightedText")?.closest(".bg-gray-900"),
        document.getElementById("insight")?.closest(".bg-gray-900"),
        document.getElementById("reasons")?.closest(".bg-gray-900"),
        document.getElementById("genuineBar")?.closest(".bg-gray-900")
    ];

    if (section === "review") {
        // Main sections
        reviewSection?.classList.remove("hidden");
        csvSection?.classList.add("hidden");
        csvProgressSection?.classList.add("hidden");

        // Force chat visible
        if (chatSection) {
            chatSection.classList.remove("hidden");
            chatSection.style.display = "block";
        }

        // Show review-only cards
        singleReviewSections.forEach(el => {
            if (el) {
                el.classList.remove("hidden");
                el.style.display = "";
            }
        });

        // Tabs
        reviewTab.className =
            "px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition";

        csvTab.className =
            "px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition";

    } else {
        // Main sections
        csvSection?.classList.remove("hidden");
        reviewSection?.classList.add("hidden");
        csvProgressSection?.classList.remove("hidden");

        // Hide chat in CSV mode
        if (chatSection) {
            chatSection.classList.add("hidden");
            chatSection.style.display = "none";
        }

        // Hide review-only cards
        singleReviewSections.forEach(el => {
            if (el) {
                el.classList.add("hidden");
                el.style.display = "none";
            }
        });

        // Tabs
        csvTab.className =
            "px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition";

        reviewTab.className =
            "px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition";
    }
}

/* =========================
   History
========================= */

function addToHistory(review, category, fake, genuine, confidence) {
    const tbody = document.getElementById("historyTable");
    if (!tbody) return;

    const isFake = fake > genuine;
    const result = isFake ? "FAKE" : "GENUINE";
    const resultColor = isFake
        ? "text-red-400 bg-red-500/10"
        : "text-green-400 bg-green-500/10";

    // Update counters
    totalAnalyses++;

    if (isFake) {
        totalFake++;
    } else {
        totalGenuine++;
    }

    // Update dashboard cards
    document.getElementById("totalAnalyses").textContent = totalAnalyses;
    document.getElementById("totalFake").textContent = totalFake;
    document.getElementById("totalGenuine").textContent = totalGenuine;

    const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    const row = document.createElement("tr");

    row.innerHTML = `
        <td class="py-4 px-3 max-w-xs truncate">${review}</td>
        <td class="px-3 capitalize">${category}</td>
        <td class="px-3">
            <span class="px-2 py-1 rounded-full text-xs font-semibold ${resultColor}">
                ${result}
            </span>
        </td>
        <td class="px-3">${fake}%</td>
        <td class="px-3">${genuine}%</td>
        <td class="px-3">${confidence}%</td>
        <td class="px-3 text-gray-400">${time}</td>
    `;

    tbody.insertBefore(row, tbody.firstChild);
}

// ==========================================
// CSV FILE SELECTION HANDLER
// ==========================================


let selectedCSVFiles = [];

document.addEventListener("DOMContentLoaded", () => {
    const csvInput = document.getElementById("csvFile");

    if (!csvInput) return;

    csvInput.addEventListener("change", function (e) {
        const files = Array.from(e.target.files);

        if (!files.length) return;

        files.forEach(file => {
            const exists = selectedCSVFiles.some(
                existing =>
                    existing.name === file.name &&
                    existing.size === file.size
            );

            if (!exists) {
                selectedCSVFiles.push(file);
            }
        });

        renderSelectedCSVFiles();
        this.value = "";
    });

    renderSelectedCSVFiles();
});

function renderSelectedCSVFiles() {
    const container = document.getElementById("selectedFilesContainer");
    const list = document.getElementById("selectedFilesList");

    if (!container || !list) return;

    // Always visible
    container.classList.remove("hidden");

    if (selectedCSVFiles.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-gray-400 border-2 border-dashed border-gray-700 rounded-xl">
                <div class="text-3xl mb-2">📂</div>
                <p>No CSV files selected yet</p>
                <p class="text-xs mt-1 text-gray-500">
                    Choose one or more CSV files to begin analysis
                </p>
            </div>
        `;
        return;
    }

    list.innerHTML = selectedCSVFiles.map((file, index) => `
        <div class="flex items-center justify-between bg-gray-700 px-4 py-3 rounded-xl">
            <div class="flex items-center gap-3 min-w-0">
                <span class="text-purple-400 text-xl">📄</span>
                <span class="text-sm text-gray-200 truncate">
                    ${file.name}
                </span>
            </div>

            <button
                type="button"
                onclick="removeCSVFile(${index})"
                class="text-gray-400 hover:text-red-400 transition text-lg ml-3">
                ✕
            </button>
        </div>
    `).join("");
}

function removeCSVFile(index) {
    selectedCSVFiles.splice(index, 1);
    renderSelectedCSVFiles();
}