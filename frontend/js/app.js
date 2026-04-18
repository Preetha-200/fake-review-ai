let chart = null;
let csvData = [];

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
async function getPrediction(review) {
  const res = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review })
  });

  if (!res.ok) throw new Error("API Error");

  return res.json();
}

/* =========================
   SINGLE REVIEW ANALYSIS
========================= */

async function analyze() {
  const reviewEl = document.getElementById("review");
  const loader = document.getElementById("loader");

  if (!reviewEl) return;

  const review = reviewEl.value.trim();

  if (!review) {
    alert("Enter a review first.");
    return;
  }

  loader?.classList.remove("hidden");

  try {
    const data = await getPrediction(review);

    loader?.classList.add("hidden");

    const fake = Math.round(data.fake_percentage);
    const genuine = Math.round(data.genuine_percentage);
    const confidence = Math.round(data.confidence);

    // TEXT VALUES
    document.getElementById("fakeText").innerText = fake + "%";
    document.getElementById("genuineText").innerText = genuine + "%";
    document.getElementById("confidenceText").innerText = confidence + "%";

    // BARS (with animation)
    setTimeout(() => {
      document.getElementById("fakeBar").style.width = fake + "%";
      document.getElementById("genuineBar").style.width = genuine + "%";
      document.getElementById("confidenceBar").style.width = confidence + "%";
    }, 100);

    // Confidence color
    const confEl = document.getElementById("confidence");
    if (confEl) {
      if (confidence > 75) {
        confEl.className = "text-2xl font-bold text-green-400";
      } else if (confidence > 50) {
        confEl.className = "text-2xl font-bold text-yellow-400";
      } else {
        confEl.className = "text-2xl font-bold text-red-400";
      }
    }

    // Highlight
    const highlightEl = document.getElementById("highlightedText");
    if (highlightEl) {
      highlightEl.innerHTML = highlightText(review);
    }

    // Chart
    const canvas = document.getElementById("chart");
    if (canvas) {
      const ctx = canvas.getContext("2d");

      if (chart) chart.destroy();

      chart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Fake", "Genuine"],
          datasets: [{
            data: [fake, genuine],
            backgroundColor: ["#ef4444", "#22c55e"],
            borderWidth: 0
          }]
        },
        options: {
          cutout: "70%",
          plugins: { legend: { display: false } }
        }
      });
    }

    // Insight
    let insight =
      fake > 75
        ? "Strong indicators of manipulation detected."
        : genuine > 75
        ? "This review appears authentic and natural."
        : "Mixed signals detected. Manual review recommended.";

    typeEffect(document.getElementById("insight"), insight);

    // Reasons
    const reasons = generateReasons(fake, genuine);
    const list = document.getElementById("reasons");

    if (list) {
      list.innerHTML = "";
      reasons.forEach(r => {
        const li = document.createElement("li");
        li.textContent = "• " + r;
        list.appendChild(li);
      });
    }

  } catch (err) {
    loader?.classList.add("hidden");
    alert("Backend error");
    console.error(err);
  }
}

/* =========================
   CSV ANALYSIS (FINAL)
========================= */

async function analyzeCSV() {
  const fileInput = document.getElementById("csvFile");
  const table = document.getElementById("csvResults");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  if (!fileInput || !fileInput.files.length) {
    alert("Upload a CSV file.");
    return;
  }

  const file = fileInput.files[0];

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,

    complete: async function(results) {
      const data = results.data;

      if (!data || !data.length) {
        alert("CSV is empty.");
        return;
      }

      // ✅ Smart column detection
      let reviewKey = Object.keys(data[0]).find(key => {
        const cleaned = key.replace(/^\uFEFF/, "").trim().toLowerCase();
        return cleaned.includes("review") || cleaned.includes("text");
      });

      // fallback → first column
      if (!reviewKey) {
        reviewKey = Object.keys(data[0])[0];
      }

      if (table) table.innerHTML = "";
      csvData = [];

      const total = data.length;

      for (let i = 0; i < total; i++) {
        const review = data[i][reviewKey];

        if (!review || review.trim() === "") continue;

        try {
          const result = await getPrediction(review);

          const fake = Math.round(result.fake_percentage);
          const genuine = Math.round(result.genuine_percentage);

          csvData.push({ review, fake, genuine });

          if (table) {
            const tr = document.createElement("tr");
            tr.className = "border-b border-gray-800";

            tr.innerHTML = `
              <td class="py-2 pr-4">${review.substring(0, 60)}...</td>
              <td class="text-red-400">${fake}%</td>
              <td class="text-green-400">${genuine}%</td>
            `;

            table.appendChild(tr);
          }

          // Progress
          if (progressBar && progressText) {
            const progress = Math.round(((i + 1) / total) * 100);
            progressBar.style.width = progress + "%";
            progressText.innerText = `${i + 1} / ${total} processed`;
          }

        } catch (err) {
          console.error("Row error:", err);
        }
      }

      if (progressText) {
        progressText.innerText = `Completed: ${total} reviews processed`;
      }
    }
  });
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