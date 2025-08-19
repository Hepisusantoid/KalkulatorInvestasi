document.addEventListener("DOMContentLoaded", function() {
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

    const ctx = document.getElementById("investmentChart").getContext("2d");
    let investmentChart;

    // Function to format number with dot as thousand separator
    function formatNumber(num) {
        return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Function to clean input (remove dots and convert to number)
    function cleanNumber(numString) {
        return parseFloat(numString.replace(/\./g, ""));
    }

    // Add event listeners for input formatting
    [currentMoneyInput, investmentAmountInput].forEach(input => {
        input.addEventListener("input", function(e) {
            const value = e.target.value.replace(/[^\d]/g, ""); // Remove non-digits
            e.target.value = formatNumber(parseFloat(value || 0));
        });
        // Initialize with formatted value on load
        input.value = formatNumber(parseFloat(input.value || 0));
    });

    // Add loading animation to button
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

    calculateButton.addEventListener("click", function() {
        showLoading();
        
        // Simulate calculation delay for better UX
        setTimeout(() => {
            let currentMoney = cleanNumber(currentMoneyInput.value);
            let investmentAmount = cleanNumber(investmentAmountInput.value);
            let investmentFrequency = investmentFrequencySelect.value;
            let investmentPeriod = parseFloat(investmentPeriodInput.value);
            let annualInterestRate = parseFloat(annualInterestInput.value) / 100;

            let totalInvestedWithoutInterest = currentMoney;
            let finalAmount = currentMoney;

            let periodInterestRate;
            let numberOfPeriods;
            let labels = [];
            let dataWithInterest = [];
            let dataWithoutInterest = [];

            switch (investmentFrequency) {
                case "once":
                    periodInterestRate = annualInterestRate;
                    numberOfPeriods = 1;
                    totalInvestedWithoutInterest += investmentAmount;
                    finalAmount += investmentAmount;
                    break;
                case "weekly":
                    periodInterestRate = annualInterestRate / 52;
                    numberOfPeriods = investmentPeriod * 52;
                    totalInvestedWithoutInterest += investmentAmount * numberOfPeriods;
                    break;
                case "monthly":
                    periodInterestRate = annualInterestRate / 12;
                    numberOfPeriods = investmentPeriod * 12;
                    totalInvestedWithoutInterest += investmentAmount * numberOfPeriods;
                    break;
                case "semiannually":
                    periodInterestRate = annualInterestRate / 2;
                    numberOfPeriods = investmentPeriod * 2;
                    totalInvestedWithoutInterest += investmentAmount * numberOfPeriods;
                    break;
                case "annually":
                    periodInterestRate = annualInterestRate;
                    numberOfPeriods = investmentPeriod;
                    totalInvestedWithoutInterest += investmentAmount * numberOfPeriods;
                    break;
            }

            // Calculate future value and populate data for chart
            let currentBalanceWithInterest = currentMoney;
            let currentBalanceWithoutInterest = currentMoney;
            
            dataWithInterest.push(currentBalanceWithInterest);
            dataWithoutInterest.push(currentBalanceWithoutInterest);
            labels.push("Tahun 0");

            for (let i = 1; i <= investmentPeriod; i++) {
                let yearlyInvestment = 0;
                if (investmentFrequency === "once" && i === 1) {
                    yearlyInvestment = investmentAmount;
                } else if (investmentFrequency === "weekly") {
                    yearlyInvestment = investmentAmount * 52;
                } else if (investmentFrequency === "monthly") {
                    yearlyInvestment = investmentAmount * 12;
                } else if (investmentFrequency === "semiannually") {
                    yearlyInvestment = investmentAmount * 2;
                } else if (investmentFrequency === "annually") {
                    yearlyInvestment = investmentAmount;
                }

                // Calculate with interest (compound interest)
                currentBalanceWithInterest = (currentBalanceWithInterest + yearlyInvestment) * (1 + annualInterestRate);
                
                // Calculate without interest (simple accumulation)
                currentBalanceWithoutInterest += yearlyInvestment;
                
                dataWithInterest.push(currentBalanceWithInterest);
                dataWithoutInterest.push(currentBalanceWithoutInterest);
                labels.push("Tahun " + i);
            }

            finalAmount = currentBalanceWithInterest;
            let totalInterest = finalAmount - totalInvestedWithoutInterest;

            // Calculate percentage difference
            let percentageDifference = 0;
            if (totalInvestedWithoutInterest > 0) {
                percentageDifference = ((finalAmount - totalInvestedWithoutInterest) / totalInvestedWithoutInterest) * 100;
            }

            totalInvestmentSpan.textContent = "Rp " + formatNumber(totalInvestedWithoutInterest);
            totalInterestSpan.textContent = "Rp " + formatNumber(totalInterest);
            finalAmountSpan.textContent = "Rp " + formatNumber(finalAmount);
            percentageDifferenceSpan.textContent = percentageDifference.toFixed(2) + "%";

            // Update or create chart with modern styling
            if (investmentChart) {
                investmentChart.data.labels = labels;
                investmentChart.data.datasets[0].data = dataWithInterest;
                investmentChart.data.datasets[1].data = dataWithoutInterest;
                investmentChart.update('active');
            } else {
                investmentChart = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: "💹 Dengan Bunga",
                            data: dataWithInterest,
                            borderColor: "#667eea",
                            backgroundColor: "rgba(102, 126, 234, 0.1)",
                            fill: false,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: "#667eea",
                            pointBorderColor: "#ffffff",
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8
                        }, {
                            label: "📊 Tanpa Bunga",
                            data: dataWithoutInterest,
                            borderColor: "#f59e0b",
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            fill: false,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: "#f59e0b",
                            pointBorderColor: "#ffffff",
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    padding: 20,
                                    font: {
                                        size: 14,
                                        weight: '500'
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#667eea',
                                borderWidth: 1,
                                cornerRadius: 8,
                                displayColors: true,
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || "";
                                        if (label) {
                                            label += ": ";
                                        }
                                        label += "Rp " + formatNumber(context.raw);
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: "Periode Waktu",
                                    font: {
                                        size: 14,
                                        weight: '600'
                                    },
                                    color: '#374151'
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#6b7280',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: "Nilai Investasi (Rp)",
                                    font: {
                                        size: 14,
                                        weight: '600'
                                    },
                                    color: '#374151'
                                },
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#6b7280',
                                    font: {
                                        size: 12
                                    },
                                    callback: function(value, index, values) {
                                        return "Rp " + formatNumber(value);
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            hideLoading();
        }, 500);
    });
});

