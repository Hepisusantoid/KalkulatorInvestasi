document.addEventListener("DOMContentLoaded", function () {
    try {
        const currentMoneyInput = document.getElementById("current_money");
        const investmentAmountInput = document.getElementById("investment_amount");
        const investmentFrequencySelect = document.getElementById("investment_frequency");
        const investmentPeriodInput = document.getElementById("investment_period");
        const annualInterestInput = document.getElementById("annual_interest");
        const calculateButton = document.getElementById("calculate_button");

        const totalInvestmentSpan = document.getElementById("total_investment");
        const totalInterestSpan = document.getElementById("total_interest");
        const finalAmountSpan = document.getElementById("final_amount");
        const percentageDifferenceSpan = document.getElementById("percentage_difference");
        const resultsSection = document.getElementById("results_section");

        const ctx = document.getElementById("investmentChart").getContext("2d");
        let investmentChart;

        // Jumlah periode per tahun untuk tiap frekuensi
        const PERIODS_PER_YEAR = {
            once: 1,
            daily: 365,
            weekly: 52,
            monthly: 12,
            quarterly: 4,
            semiannually: 2,
            annually: 1
        };

        const FREQUENCY_LABEL = {
            once: "sekali di awal",
            daily: "harian",
            weekly: "mingguan",
            monthly: "bulanan",
            quarterly: "tiga bulanan",
            semiannually: "enam bulanan",
            annually: "tahunan"
        };

        // ---------- Utilitas format angka ----------
        function formatNumber(num) {
            if (!isFinite(num)) return "0";
            const rounded = Math.round(num);
            return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }

        function cleanNumber(numString) {
            const cleaned = String(numString).replace(/\./g, "").replace(/[^\d]/g, "");
            const value = parseInt(cleaned, 10);
            return isNaN(value) ? 0 : value;
        }

        // ---------- Live dot-thousands formatting saat mengetik ----------
        [currentMoneyInput, investmentAmountInput].forEach(input => {
            input.addEventListener("input", function (e) {
                const cursorFromEnd = e.target.value.length - e.target.selectionStart;
                const raw = e.target.value.replace(/[^\d]/g, "");
                const formatted = raw === "" ? "" : formatNumber(parseInt(raw, 10));
                e.target.value = formatted;
                const newPos = Math.max(formatted.length - cursorFromEnd, 0);
                e.target.setSelectionRange(newPos, newPos);
                clearError(e.target);
            });
            input.value = formatNumber(cleanNumber(input.value));
        });

        [investmentPeriodInput, annualInterestInput].forEach(input => {
            input.addEventListener("input", function (e) {
                clearError(e.target);
            });
        });

        // ---------- Validasi ----------
        function showError(input, message) {
            input.classList.add("input-invalid");
            const err = document.getElementById("err_" + input.id);
            if (err) {
                err.textContent = message;
                err.classList.add("show");
            }
        }

        function clearError(input) {
            input.classList.remove("input-invalid");
            const err = document.getElementById("err_" + input.id);
            if (err) {
                err.textContent = "";
                err.classList.remove("show");
            }
        }

        function validateInputs(values) {
            let valid = true;

            if (values.currentMoney < 0) {
                showError(currentMoneyInput, "Uang tersedia tidak boleh negatif.");
                valid = false;
            }
            if (values.investmentAmount < 0) {
                showError(investmentAmountInput, "Jumlah investasi tidak boleh negatif.");
                valid = false;
            }
            if (values.currentMoney === 0 && values.investmentAmount === 0) {
                showError(investmentAmountInput, "Isi minimal salah satu: uang saat ini atau jumlah investasi.");
                valid = false;
            }
            if (isNaN(values.investmentPeriod) || values.investmentPeriod <= 0) {
                showError(investmentPeriodInput, "Jangka waktu harus lebih dari 0 tahun.");
                valid = false;
            } else if (values.investmentPeriod > 50) {
                showError(investmentPeriodInput, "Jangka waktu maksimal 50 tahun.");
                valid = false;
            }
            if (isNaN(values.annualInterestRatePct)) {
                showError(annualInterestInput, "Bunga tahunan tidak valid.");
                valid = false;
            } else if (values.annualInterestRatePct < 0) {
                showError(annualInterestInput, "Bunga tahunan tidak boleh negatif.");
                valid = false;
            } else if (values.annualInterestRatePct > 1000) {
                showError(annualInterestInput, "Bunga di atas 1000%/tahun tidak realistis. Periksa kembali angkanya.");
                valid = false;
            }

            return valid;
        }

        // ---------- Loading state ----------
        function showLoading() {
            calculateButton.innerHTML = "⏳ Menghitung...";
            calculateButton.classList.add("loading");
            calculateButton.disabled = true;
        }

        function hideLoading() {
            calculateButton.innerHTML = "🚀 Hitung Investasi";
            calculateButton.classList.remove("loading");
            calculateButton.disabled = false;
        }

        // ---------- Simulasi investasi (compounding sesuai frekuensi asli) ----------
        function simulateInvestment(currentMoney, investmentAmount, frequency, years, annualRate) {
            const periodsPerYear = PERIODS_PER_YEAR[frequency];
            const ratePerPeriod = annualRate / periodsPerYear;

            let balanceWithInterest = currentMoney;
            let balanceWithoutInterest = currentMoney;

            const labels = ["Tahun 0"];
            const dataWithInterest = [balanceWithInterest];
            const dataWithoutInterest = [balanceWithoutInterest];

            if (frequency === "once") {
                // Investasi sekali di awal, lalu bertumbuh dengan bunga majemuk tahunan
                balanceWithInterest += investmentAmount;
                balanceWithoutInterest += investmentAmount;
                dataWithInterest[0] = balanceWithInterest;
                dataWithoutInterest[0] = balanceWithoutInterest;

                for (let y = 1; y <= years; y++) {
                    balanceWithInterest *= (1 + annualRate);
                    labels.push("Tahun " + y);
                    dataWithInterest.push(balanceWithInterest);
                    dataWithoutInterest.push(balanceWithoutInterest);
                }
            } else {
                const totalPeriods = Math.round(years * periodsPerYear);
                let periodCounter = 0;

                for (let y = 1; y <= years; y++) {
                    const periodsThisYear = Math.round(y * periodsPerYear) - periodCounter;
                    for (let p = 0; p < periodsThisYear; p++) {
                        balanceWithInterest = (balanceWithInterest + investmentAmount) * (1 + ratePerPeriod);
                        balanceWithoutInterest += investmentAmount;
                        periodCounter++;
                    }
                    labels.push("Tahun " + y);
                    dataWithInterest.push(balanceWithInterest);
                    dataWithoutInterest.push(balanceWithoutInterest);
                }
            }

            return {
                finalAmount: balanceWithInterest,
                totalInvested: balanceWithoutInterest,
                labels,
                dataWithInterest,
                dataWithoutInterest
            };
        }

        // ---------- Render chart ----------
        function renderChart(labels, dataWithInterest, dataWithoutInterest) {
            if (investmentChart) {
                investmentChart.data.labels = labels;
                investmentChart.data.datasets[0].data = dataWithInterest;
                investmentChart.data.datasets[1].data = dataWithoutInterest;
                investmentChart.update("active");
                return;
            }

            investmentChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "💹 Dengan Bunga",
                            data: dataWithInterest,
                            borderColor: "#2547a8",
                            backgroundColor: "rgba(37, 71, 168, 0.12)",
                            fill: true,
                            tension: 0.35,
                            borderWidth: 3,
                            pointBackgroundColor: "#2547a8",
                            pointBorderColor: "#ffffff",
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        },
                        {
                            label: "📊 Tanpa Bunga",
                            data: dataWithoutInterest,
                            borderColor: "#c9a24b",
                            backgroundColor: "rgba(201, 162, 75, 0.10)",
                            fill: false,
                            tension: 0.35,
                            borderWidth: 3,
                            pointBackgroundColor: "#c9a24b",
                            pointBorderColor: "#ffffff",
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: "index" },
                    plugins: {
                        legend: {
                            display: true,
                            position: "top",
                            labels: { usePointStyle: true, padding: 18, font: { size: 13, weight: "500" } }
                        },
                        tooltip: {
                            backgroundColor: "rgba(15, 31, 77, 0.92)",
                            titleColor: "#ffffff",
                            bodyColor: "#ffffff",
                            borderColor: "#2547a8",
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || "";
                                    if (label) label += ": ";
                                    label += "Rp " + formatNumber(context.raw);
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: "Periode Waktu", font: { size: 13, weight: "600" }, color: "#374151" },
                            grid: { color: "rgba(15, 31, 77, 0.05)", drawBorder: false },
                            ticks: { color: "#6b7280", font: { size: 11 } }
                        },
                        y: {
                            title: { display: true, text: "Nilai Investasi (Rp)", font: { size: 13, weight: "600" }, color: "#374151" },
                            beginAtZero: true,
                            grid: { color: "rgba(15, 31, 77, 0.05)", drawBorder: false },
                            ticks: {
                                color: "#6b7280",
                                font: { size: 11 },
                                callback: function (value) {
                                    return "Rp " + formatNumber(value);
                                }
                            }
                        }
                    }
                }
            });
        }

        // ---------- Handler tombol ----------
        calculateButton.addEventListener("click", function () {
            [currentMoneyInput, investmentAmountInput, investmentPeriodInput, annualInterestInput].forEach(clearError);

            const values = {
                currentMoney: cleanNumber(currentMoneyInput.value),
                investmentAmount: cleanNumber(investmentAmountInput.value),
                frequency: investmentFrequencySelect.value,
                investmentPeriod: parseFloat(investmentPeriodInput.value),
                annualInterestRatePct: parseFloat(annualInterestInput.value)
            };

            if (!validateInputs(values)) {
                resultsSection.style.opacity = "0.4";
                return;
            }

            showLoading();

            setTimeout(() => {
                try {
                    const annualRate = values.annualInterestRatePct / 100;
                    const result = simulateInvestment(
                        values.currentMoney,
                        values.investmentAmount,
                        values.frequency,
                        values.investmentPeriod,
                        annualRate
                    );

                    const totalInterest = result.finalAmount - result.totalInvested;
                    const percentageDifference = result.totalInvested > 0
                        ? ((result.finalAmount - result.totalInvested) / result.totalInvested) * 100
                        : 0;

                    totalInvestmentSpan.textContent = "Rp " + formatNumber(result.totalInvested);
                    totalInterestSpan.textContent = "Rp " + formatNumber(totalInterest);
                    finalAmountSpan.textContent = "Rp " + formatNumber(result.finalAmount);
                    percentageDifferenceSpan.textContent = percentageDifference.toFixed(2) + "%";
                    resultsSection.style.opacity = "1";

                    renderChart(result.labels, result.dataWithInterest, result.dataWithoutInterest);
                } catch (err) {
                    console.error("Gagal menghitung investasi:", err);
                    alert("Terjadi kesalahan saat menghitung. Periksa kembali angka yang dimasukkan, lalu coba lagi.");
                } finally {
                    hideLoading();
                }
            }, 400);
        });
    } catch (err) {
        console.error("Gagal memuat kalkulator:", err);
        alert("Kalkulator gagal dimuat. Coba muat ulang halaman.");
    }
});
